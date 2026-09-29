# Marginalia

A private, offline-first journaling and habit-tracking app. Entries are classified for mood and momentum on-device, nothing text-based ever leaves the phone unencrypted, and a local MCP server lets you optionally query your own journal from Claude Desktop or another MCP client, with per-tool consent.

Not a wellness app with a mascot. It is a structured logging tool with a small on-device model attached to it.

## 1. What it does

- Daily journal entries (text, optional voice-to-text via on-device STT)
- Habit tracking with streaks computed from entry tags, not manual checkboxes
- On-device mood/sentiment classification per entry (see Section 5)
- Weekly digest generated locally from the last 7 days of classifications
- Optional MCP server so a desktop AI assistant can query journal data on request
- Full offline capability; sync is additive, not required

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Mobile framework | React Native (Expo, bare workflow for native modules) | Needed for native ML runtime bridges |
| Language | TypeScript, strict mode | |
| Local DB | WatermelonDB (SQLite-backed) | Offline-first, reactive, handles large journal history without reloading |
| Remote DB | Supabase (Postgres) | Row-Level Security, Realtime, Auth, Storage, Edge Functions in one place |
| Auth | Supabase Auth (email OTP + Apple/Google Sign-In) | |
| On-device ML runtime | TensorFlow Lite (Android NNAPI delegate / iOS Core ML delegate) | Runs the sentiment ANN on the phone's NPU where available, falls back to CPU |
| State management | Zustand + WatermelonDB observables | Avoids Redux boilerplate, keeps sync logic out of components |
| MCP layer | `@modelcontextprotocol/sdk` server running inside a local HTTP listener on the device, paired via QR code | See Section 6 |
| CI/CD | GitHub Actions + EAS Build | |
| Crash/perf monitoring | Sentry (self-hosted option documented) | |
| E2E testing | Detox | |
| Unit/integration testing | Jest, React Native Testing Library | |

## 3. System architecture

```
┌─────────────────────────────┐
│         Mobile App          │
│  ┌────────────┐  ┌────────┐ │
│  │ UI Layer    │  │ MCP    │ │
│  │ (RN screens)│  │ Server │ │
│  └─────┬──────┘  └───┬────┘ │
│        │             │      │
│  ┌─────▼─────────────▼───┐  │
│  │   Domain / Store       │  │
│  │  (Zustand, use-cases)  │  │
│  └─────┬──────────────────┘ │
│        │                    │
│  ┌─────▼──────┐  ┌────────┐ │
│  │ WatermelonDB│ │ TFLite  │ │
│  │  (local)    │ │ runtime │ │
│  └─────┬───────┘ └────────┘ │
└────────┼─────────────────────┘
         │ sync (delta, pull-then-push)
┌────────▼─────────────────────┐
│           Supabase             │
│  Postgres + RLS │ Auth │ Storage│
│  Edge Functions  │ Realtime     │
└────────────────────────────────┘
```

The model runs entirely inside the app process. Supabase never receives raw entry text unless the user explicitly opts into encrypted cloud backup (Section 8).

## 4. Database schema (Postgres, Supabase)

```sql
create table profiles (
  id uuid primary key references auth.users(id),
  display_name text,
  created_at timestamptz default now()
);

create table entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  body_ciphertext bytea not null,       -- client-side encrypted, server never sees plaintext
  body_nonce bytea not null,
  mood_label text,                      -- classification result, stored in clear (non-sensitive on its own)
  mood_confidence real,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  device_vector_clock jsonb default '{}'::jsonb
);

create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  name text not null,
  cadence text not null check (cadence in ('daily','weekly','custom')),
  created_at timestamptz default now()
);

create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  logged_at date not null,
  unique (habit_id, logged_at)
);

alter table entries enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;

create policy "own entries only" on entries
  for all using (auth.uid() = user_id);
create policy "own habits only" on habits
  for all using (auth.uid() = user_id);
create policy "own habit logs only" on habit_logs
  for all using (
    auth.uid() = (select user_id from habits where habits.id = habit_id)
  );
```

Encryption key for `body_ciphertext` is derived from the user's device keychain, never uploaded. This means a lost device with no backup enabled means lost entries — documented clearly in onboarding, not hidden in a settings submenu.

## 5. On-device sentiment ANN (the required ML component)

A small feed-forward ANN, not an LLM, chosen deliberately for latency and battery reasons:

- **Input**: 128-dim sentence embedding produced by a distilled, quantized embedding model (int8, ~4 MB) bundled with the app
- **Architecture**: `Dense(128→64, relu) → Dropout(0.2) → Dense(64→32, relu) → Dense(32→5, softmax)`
- **Output classes**: five mood buckets (low, flat, neutral, lifted, high-energy) — not clinical diagnosis labels, stated explicitly in the UI
- **Training**: trained offline on a public, licensed sentiment corpus, fine-tuned on a small labeled internal set, exported to `.tflite` via post-training int8 quantization
- **Size on disk**: under 6 MB total (embedding model + classifier head)
- **Inference time**: target under 40 ms on a mid-range Android NPU, under 120 ms CPU fallback
- **Where it runs**: entirely inside the app via `react-native-fast-tflite`; no network call, no server round-trip
- **Versioning**: model files ship with the app bundle and are versioned alongside app releases; a mismatch check on load falls back to a bundled default model rather than crashing

## 6. MCP integration

The app runs a local MCP server bound to `127.0.0.1` on a random port, discoverable only via an on-screen pairing QR code (not exposed on the network beyond loopback + a short-lived local tunnel for desktop pairing).

Exposed MCP tools (all read-only, all require the user to tap "approve" the first time each tool is called):

- `get_recent_entries(days: int)` — returns mood labels and habit completion, never raw entry text unless the user separately grants a "share full text" permission per session
- `get_habit_streaks()` — current and longest streaks per habit
- `get_weekly_digest()` — the locally generated summary

No MCP tool can write data. This is intentional: the assistant can read context to help the user reflect, it cannot edit the journal.

## 7. Offline sync strategy

- WatermelonDB is the source of truth on-device; Supabase is a sync target, not a cache-through layer
- Pull-then-push sync loop, using `updated_at` watermarks per table
- Conflict resolution: last-write-wins at the field level, with a per-record vector clock (`device_vector_clock`) to detect true concurrent edits and surface a manual merge screen only when both replicas changed the same field within the same sync window
- Sync runs on: app foreground, every 15 minutes in background (Android WorkManager / iOS BGTaskScheduler), and on manual pull-to-refresh

## 8. Security

- Client-side AES-256-GCM encryption for entry bodies before they ever reach Supabase
- Encryption key stored in iOS Keychain / Android Keystore, never in plaintext storage, never synced
- RLS on every table (Section 4)
- Supabase Edge Functions validate JWT on every call; no service-role key ships in the client
- Optional biometric app-lock (Face ID / fingerprint) before the app is usable at all

## 9. Testing strategy

- Unit tests: sync conflict resolution logic, streak calculation, model output parsing (Jest)
- Integration tests: WatermelonDB ↔ Supabase sync against a local Supabase instance (Docker)
- E2E tests: onboarding, entry creation, offline entry then reconnect sync (Detox, real devices in CI via EAS)
- Model regression test: fixed evaluation set run against the `.tflite` model on every model version bump, gated in CI, fails the build if accuracy drops below a set threshold

## 10. CI/CD

- GitHub Actions: lint → typecheck → unit/integration tests → build
- EAS Build for signed Android/iOS binaries on tagged releases
- Detox E2E suite runs nightly and on release branches, not on every PR (cost/time tradeoff, stated plainly)
- Supabase migrations tracked in `supabase/migrations`, applied via `supabase db push` in the deploy job, never applied by hand against production

## 11. Design system

- Palette: warm cream background (`#F7F3EC`), charcoal text (`#2B2B28`), single muted terracotta accent (`#B5654A`) for primary actions — no gradients
- Buttons: rounded-rectangle (8px radius), not pill-shaped
- Iconography: a single custom line-icon set (Lucide, restyled), no emoji anywhere in the UI
- Typography: one serif for entry text (reading comfort), one grotesk for UI chrome
- Motion: functional only — screen transitions and a single streak-increment micro-animation; no scroll-triggered parallax or decorative animation
- No AI-generated imagery anywhere in the app or marketing site; illustrations are flat vector, hand-built

## 12. Legal & site infrastructure

- `/privacy` — plain-language privacy policy, states exactly what leaves the device and what doesn't
- `/terms` — terms of service
- Custom domain (e.g. `marginalia.app`) fronted by Cloudflare, HTTPS enforced, HSTS enabled
- Favicon set (ico + apple-touch-icon + maskable PWA icon) matching the app glyph, not a generic placeholder

## 13. Explicitly not included

- No engagement notifications designed around guilt ("you haven't journaled in 3 days!") — reminders are neutral and user-scheduled
- No usage counters or "X people journaled today" social proof anywhere
- No paywall dark patterns; if a paid tier exists, pricing is stated as a flat number, not a countdown

## 14. Suggested folder structure

```
marginalia/
  app/                 # Expo Router screens
  src/
    domain/            # use-cases, pure functions (streaks, digest)
    data/
      local/           # WatermelonDB models, schema, migrations
      remote/           # Supabase client, sync engine
    ml/                # tflite wrapper, embedding + classifier
    mcp/               # local MCP server, tool handlers
    ui/                # design system components
  supabase/
    migrations/
    functions/
  e2e/                 # Detox specs
  .github/workflows/
```
