# Product Requirements Document — Marginalia

## 0. Platform decisions
| Area | Decision |
|---|---|
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions, Realtime) |
| Client | React Native (Expo, bare workflow) + TypeScript |
| Design language | Cream background, single muted terracotta accent, rounded-rectangle buttons, no gradients, no emoji icons, no decorative motion |
| Legal/site | `/privacy`, `/terms`, custom domain, HTTPS/HSTS, real favicon set |
| Non-negotiables | No fake metrics, no fabricated reviews, no "Made with AI" badge, no em dashes in shipped copy |

## 1. Problem statement
People who journal on their phone want a private, fast place to write, with light structure (habits, mood trend) — without the app itself reading their entries on a server, and without a wellness-app tone that nags them into opening it.

## 2. Goals
- G1: Entry creation, from tap-to-write to saved, under 1 second perceived latency, fully offline-capable
- G2: On-device mood classification with no entry text ever leaving the device in plaintext
- G3: Optional, permissioned AI-assistant access to journal metadata via MCP, off by default
- G4: Zero data loss across offline → sync → conflict scenarios

## 3. Non-goals
- Not a clinical mood-tracking or mental-health diagnostic tool (stated explicitly in-app)
- Not a social or shared-journal product
- No push-notification guilt loops

## 4. Target users
- Primary: individuals who already journal by habit and want structure without surveillance
- Secondary: habit-tracking users who want streaks tied to something more meaningful than a checkbox

## 5. Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| F1 | User can create, edit, delete a text journal entry, works fully offline | P0 |
| F2 | Each entry is classified into one of 5 mood buckets on-device within 150ms | P0 |
| F3 | User can create habits with daily/weekly/custom cadence and log completion | P0 |
| F4 | Streaks are computed automatically from habit logs | P0 |
| F5 | Weekly digest (mood trend + streak summary) generated locally, viewable without network | P1 |
| F6 | User can enable encrypted cloud backup (opt-in), entries encrypted client-side before upload | P0 |
| F7 | User can pair a desktop AI client via QR code to a local MCP server exposing read-only journal metadata | P1 |
| F8 | Each MCP tool call requires first-use approval; "share full entry text" is a separate, revocable permission | P0 |
| F9 | Biometric app-lock option | P1 |

## 6. Non-functional requirements
- NFR1: App must be usable with zero network connectivity for all P0 features
- NFR2: Model artifact (embedding + classifier) under 6MB combined
- NFR3: Sync conflict resolution must never silently discard a user edit — surfaced for manual merge when concurrent
- NFR4: No entry text logged to Sentry or any third-party analytics, even in error reports (scrub before send)

## 7. Success metrics
- % of entries created while offline that sync successfully within 24h of reconnect (target: 99.5%+)
- On-device classification latency at p95 (target: under 150ms on a 3-year-old mid-range Android device)
- Opt-in rate for cloud backup and for MCP pairing, tracked separately, reported in aggregate only

## 8. Risks
- R1: Users may distrust "on-device" claims without a way to verify — mitigated by an in-app "what leaves your device" transparency screen and open documentation of the encryption flow
- R2: Quantized model accuracy drift across app versions — mitigated by a fixed eval-set regression gate in CI

## 9. Milestones

| Phase | Scope |
|---|---|
| M0 — Foundation | Supabase schema + RLS, auth, base navigation, design system components |
| M1 — Core loop | Entry + habit CRUD, on-device model integrated |
| M2 — Sync | Encrypted backup + conflict resolution |
| M3 — MCP | Local MCP server + pairing flow |
| M4 — Hardening | CI model-eval gates, E2E suite, Sentry scrubbing rules, legal pages, custom domain, favicon |
| GA | Public release |

## 10. Open questions
- Whether cloud backup uses Supabase Storage directly or a separate encrypted blob service (cost/complexity tradeoff not yet settled)
