# System Design Addendum — Marginalia

Fills the gaps from the initial PRD: capacity estimation, sequence diagrams, MCP threat model, scaling, SLOs/SLIs, and data deletion.

## 1. Capacity estimation

Assumptions, stated explicitly so the numbers can be re-derived if they're wrong:

- Target: 50,000 MAU at 12 months, 15,000 DAU
- Average user: 1.2 entries/day, ~400 bytes ciphertext each, 3 habit logs/day
- Peak write window: evening, roughly 60% of daily writes land in a 3-hour band

| Metric | Estimate |
|---|---|
| Entries/day | 15,000 × 1.2 ≈ 18,000 |
| Habit logs/day | 15,000 × 3 ≈ 45,000 |
| Peak writes/sec (evening band) | (18,000 + 45,000) × 0.6 / 10,800s ≈ 3.5 writes/sec |
| Storage growth (entries only) | 18,000 × 400B × 365 ≈ 2.6 GB/year at 50K MAU |
| Realtime connections (concurrent, evening peak) | ~15% of DAU concurrently open ≈ 2,250 |

Conclusion: this is a low-QPS, storage-light workload. A single Supabase project (shared Postgres tier) handles this comfortably through year one; the constraint is likely Edge Function cold-start latency and Realtime connection limits before it's ever raw throughput.

## 2. Sequence diagrams

### 2.1 Entry creation → on-device classification → optional sync

```
User          App UI        Local Store       ML Runtime        Sync Engine       Supabase
 |              |                |                 |                 |               |
 |--write entry->|                |                 |                 |               |
 |              |--save draft--->|                 |                 |               |
 |              |--embed+classify------------------>|                 |               |
 |              |<--mood label, confidence----------|                 |               |
 |              |--persist entry+label--------------->|                 |               |
 |              |<--ack-----------|                 |                 |               |
 |<--entry saved-|                |                 |                 |               |
 |              |                |                 |    (if cloud backup enabled)      |
 |              |                |                 |                 |--push queue-->|
 |              |                |                 |                 |<--ack---------|
```

Key property: everything up to "entry saved" happens with zero network dependency. Sync is strictly additive and asynchronous.

### 2.2 MCP query from a paired desktop client

```
Desktop AI Client        Local MCP Server (on phone)      Local Store
        |                          |                            |
        |--tool call: get_recent_entries(days=7)---------------->|
        |                          |--check permission grant--->|
        |                          |<--granted (mood-only scope)-|
        |                          |--query WatermelonDB-------->|
        |                          |<--mood labels + dates-------|
        |<--tool result (labels, no raw text)--------------------|
```

If the user has not separately granted "share full text," any attempt to request raw entry content returns a permission-denied result, not a truncated/partial one — no silent downgrade that could be mistaken for a real answer.

## 3. MCP threat model

An AI client with read access to journal metadata is a real attack surface, not a neutral feature. Threats considered:

| Threat | Vector | Mitigation |
|---|---|---|
| Unauthorized pairing | Attacker on the same Wi-Fi discovers the local MCP port | Server binds to `127.0.0.1` only; desktop pairing goes through a short-lived signed tunnel token shown as a QR code, expires in 5 minutes if unused |
| Scope creep after pairing | A paired client later requests a broader tool (e.g., full text) without the user noticing | Every tool has its own permission grant; broader-scope requests always re-prompt, grants are not hierarchical (raw-text access doesn't imply metadata access or vice versa) |
| Prompt injection via journal content reaching the assistant | User asks the assistant to summarize entries; malicious text embedded in an old entry attempts to manipulate the assistant's later behavior | Out of this app's control surface once text is returned to the client, but the app mitigates blast radius by keeping MCP tools read-only — nothing the assistant does can write back to the journal, so injected content can't cause data loss or corruption |
| Stale grant persistence | User revokes access in-app but the desktop client caches an old session | Grants are checked per-call against the current permission table, not cached at pairing time; revocation takes effect on the next tool call, not the next pairing |
| Exfiltration via repeated low-scope calls | Client repeatedly calls `get_weekly_digest()` to reconstruct a fuller picture over time than a human would approve at once | Rate limit of one call per tool per 60 seconds per paired client; the user can see a log of the last 20 MCP calls in-app |

## 4. Scaling considerations

- **Postgres**: entries and habit_logs indexed on `(user_id, created_at desc)` for the digest and history queries; no full-table scans expected at any realistic scale for this workload
- **Connection pooling**: Supabase's pooler (pgbouncer, transaction mode) sits in front of Postgres; Edge Functions never hold long-lived connections
- **Edge Function cold starts**: sync and digest-related functions are lightweight (no ML inference server-side in this app), so cold start is the main latency risk, not compute — mitigated by keeping function bundles small and avoiding heavy dependencies in the sync path
- **Realtime**: only used for optional multi-device notification of new backups, not for high-frequency updates, so channel count stays low relative to DAU

## 5. SLOs / SLIs

| SLI | SLO | Alert threshold |
|---|---|---|
| Sync success rate within 24h of reconnect | 99.5% | Alert if 7-day rolling rate drops below 99% |
| On-device classification latency (p95, client-reported) | < 150ms | Alert if p95 exceeds 300ms for 3 consecutive days (client telemetry, aggregated, no entry content) |
| Edge Function (sync endpoint) latency (p95) | < 400ms | Alert if p95 exceeds 800ms for 15 minutes |
| Crash-free session rate | > 99.5% | Alert if it drops below 99% in any release cohort |

## 6. Data retention & deletion

- Account deletion request triggers a single Postgres function (`delete_account(user_id)`) that:
  1. Deletes all rows in `entries`, `habits`, `habit_logs` for the user (cascade via foreign keys)
  2. Deletes any Storage objects under the user's backup path
  3. Deletes the `profiles` row and revokes the Supabase Auth session
- Backups: if the project uses point-in-time recovery, deleted data may persist in backup snapshots for up to the retention window (documented in `/privacy` in plain terms, e.g. "up to 7 days in backup snapshots")
- Local device data is wiped on app uninstall by the OS; in-app "erase local data" option is also provided for shared/borrowed devices
