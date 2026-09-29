# Marginalia Development Breakdown

This document divides the **Marginalia** project into 8 independent, modular parts for step-by-step implementation.

---

## Part 1: Project Setup, Architecture & Foundation
- **Focus**: Core project scaffolding, build configurations, design system tokens, and base environment setup.
- **Key Modules**:
  - Expo / React Native project setup with TypeScript configuration (strict mode).
  - Design system tokens (`palette.ts`, `typography.ts`, `spacing.ts`) with theme definitions (warm cream background `#F7F3EC`, charcoal text `#2B2B28`, muted terracotta `#B5654A`).
  - Base layout, UI shell, navigation structure (`app/_layout.tsx`, `app/index.tsx`).
  - Foundation unit testing configuration (Jest setup).

---

## Part 2: Local Database & Data Layer (WatermelonDB)
- **Focus**: Offline-first storage schemas, local persistence, models, and repositories.
- **Key Modules**:
  - WatermelonDB schema definition (`entries`, `habits`, `habit_logs`, `profiles`).
  - Models (`Entry`, `Habit`, `HabitLog`, `Profile`).
  - Local database initializers and reactive observables.
  - CRUD helper functions for local entry creation and habit updates.

---

## Part 3: Client-Side Security & Encryption Engine
- **Focus**: End-to-end client-side encryption and secure key management.
- **Key Modules**:
  - Key derivation and management using device Keystore/Keychain.
  - AES-256-GCM encryption/decryption routines for journal entry bodies (`body_ciphertext`, `body_nonce`).
  - Optional biometric lock implementation (Face ID / Fingerprint guard).
  - Key management security unit tests.

---

## Part 4: Remote Backend, Supabase Infrastructure & Sync Engine
- **Focus**: Supabase setup, Postgres schemas with RLS, and pull-then-push delta sync engine.
- **Key Modules**:
  - Supabase database migration scripts (`profiles`, `entries`, `habits`, `habit_logs`) and Row Level Security (RLS) policies.
  - Supabase Auth integration (email OTP / OAuth).
  - Delta sync engine using `updated_at` watermarks and `device_vector_clock` vector clock conflict resolution.
  - Foreground and background sync hooks.

---

## Part 5: On-Device Sentiment Machine Learning Engine (TFLite)
- **Focus**: On-device machine learning inference for entry mood classification.
- **Key Modules**:
  - On-device distilled sentence embedding wrapper (128-dim embedding generation).
  - `react-native-fast-tflite` integration with TFLite model runtime.
  - Neural Network classifier (`128 -> 64 -> 32 -> 5 mood buckets`).
  - Offline classification pipeline for journal entries without server round-trips.

---

## Part 6: Habit Tracking & Weekly Digest Domain Engine
- **Focus**: Business logic for habit streak computations and local weekly digest generation.
- **Key Modules**:
  - Automatic streak calculation engine computed strictly from entry tags and log dates.
  - Weekly digest summary generator from recent mood classifications.
  - Pure domain functions for stats, trends, and habit completion checks.
  - Unit test suite for edge cases in streaks and weekly summaries.

---

## Part 7: Local Model Context Protocol (MCP) Server
- **Focus**: On-device MCP server enabling desktop AI tools (e.g., Claude Desktop) to safely query user journal insights.
- **Key Modules**:
  - Embedded HTTP server listening on loopback (`127.0.0.1`).
  - QR code pairing generator and session key verification.
  - Per-tool consent flow and user permission prompts.
  - MCP Read-Only tools (`get_recent_entries`, `get_habit_streaks`, `get_weekly_digest`).

---

## Part 8: Comprehensive UI Features, E2E Testing & CI/CD Pipeline
- **Focus**: End-to-end screens, complete user flows, automated tests, and deployment automation.
- **Key Modules**:
  - Full UI screens (Daily Journal editor, Habit dashboard, Settings, MCP Pairing screen).
  - Detox E2E automated testing suite.
  - GitHub Actions CI/CD pipeline (`lint` -> `typecheck` -> `test` -> `EAS Build`).
  - Legal pages (`/privacy`, `/terms`) and production build release pipeline.
