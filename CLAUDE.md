# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ascend is a Progressive Web App (PWA) for calisthenics and bodyweight strength training. It uses RFEM (Reps From Established Max) methodology for progression tracking, with cycle-based periodization. The app is local-first with optional cloud sync via Supabase.

More docs: `docs/ARCHITECTURE.md`, `docs/DATABASE_SCHEMA.md`, `supabase/migrations/README.md`, `CHANGELOG.md`.

## Environment

**Node 20+ is required** (Node 22 recommended). Node 18 is EOL and breaks the test suite (jsdom's transitive deps are ESM-only and Node 18 cannot `require()` ESM). If tests fail with `ERR_REQUIRE_ESM`, check `node --version` first.

`.env` (untracked) must contain `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for cloud sync and the auth gate. Without them the app runs in local-only mode (auth gate skipped, sync disabled) — the Supabase client is constructed with inert placeholders so the app doesn't crash; all real usage is gated behind `isSupabaseConfigured()` (`src/data/supabase.ts`). Git worktrees need their own `npm ci` and a copy of `.env`.

## Commands

```bash
npm run dev          # Start dev server at localhost:5173
npm run build        # TypeScript check (tsc -b) + Vite build
npm run preview      # Preview production build locally
npm test             # Run Vitest in watch mode
npm test -- --run    # Run tests once (no watch)
npm test -- --ui     # Interactive test UI
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format
npm run prepare      # Install husky git hooks (run once after clone)
```

### iOS Development (Capacitor)
```bash
npm run cap:sync     # Build + sync to iOS
npm run cap:open     # Open Xcode
npm run cap:build    # Build + sync + open Xcode
```

## ⚠️ Timer & Sound Engine — DO NOT TOUCH

The countdown timer / sound alignment was hard-won through weeks of serial debugging (v2.25.18–v2.25.30). Do not edit these files without explicit sign-off:

- `ios/App/App/TimerAudioPlugin.swift` (+ `.m` bridge)
- `src/hooks/useCountdownTimer.ts`
- `src/plugins/timerAudio.ts`
- `src/utils/timerNotifications.ts`

Load-bearing invariants:
1. **Anchor-at-entry** (Swift): the `DispatchTime` anchor is captured at `scheduleCountdown` entry, BEFORE audio-session setup (`setActive(true)` costs 200–400ms; anchoring after setup lags beeps behind the visual countdown).
2. **Zero leeway** (Swift): `DispatchSource` timers use `leeway: .nanoseconds(0)` to defeat iOS wake coalescing (coalescing collapsed T-3/T-2/T-1/T-0 beeps into one end burst).
3. **No JS keep-alive stop on completion**: `completeTimer()` in `useCountdownTimer` deliberately does NOT stop the keep-alive — the native side schedules its own stop at completion+1s. A JS timeout here killed the *next* set's keep-alive (bug fixed in v2.25.23).
4. **Single hook instance**: `useCountdownTimer` reads `totalSeconds` only at mount. `RestTimerBanner` (`src/components/workouts/RestTimerBanner.tsx`) must remain the ONLY rest-timer caller of the hook; its compact/expanded layouts are conditional JSX inside one component (never split into separately-mounted components — two mounted hook callers double-schedule native sounds). Restarting with a new duration happens ONLY via React key remount (`restTimerKey` in `useTodayModals`); the old instance's unmount cleanup cancels its scheduled sounds. `ExerciseTimer` is the hook's other (scheduled time-based set) consumer.

After any change near this area, verify: `git diff` shows the four engine files untouched, and on-device a full countdown sounds correct (beeps at 3-2-1, chord at 0, backgrounded app still fires once).

## Architecture

### Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS for styling
- Dexie.js (IndexedDB) for local storage
- Supabase for auth and cloud sync
- Zustand for UI state
- Capacitor for iOS native app

### Data Flow
Local-first architecture: all data lives in IndexedDB via Dexie, optionally synced to Supabase PostgreSQL when authenticated.

```
React → Repositories → Dexie (IndexedDB) ↔ SyncService ↔ Supabase
                                            └→ syncQueue (offline changes)
```

### Key Services

**`services/scheduler.ts`** - Generates workout schedules from cycle configuration. Handles RFEM calculations, warmup generation, and conditioning progression. `validateCycle` ignores weekly set goals for exercise types not present in the cycle.

**`services/syncService.ts`** - Bidirectional sync between IndexedDB and Supabase:
- **Last-write-wins on `updatedAt` for ALL syncable tables** (exercises, cycles, scheduled_workouts, max_records, completed_sets). Timestamps are **client-authoritative** — do not add server-side `BEFORE UPDATE` triggers that overwrite `updated_at` (they make conflicts resolve by push-arrival order and cause echo write-amplification; migration 013's trigger has this flaw, deliberately not repeated in 017).
- Every repository mutator must bump `updatedAt` or the change can lose LWW on other devices.
- `pullFromCloud` returns `{ failedTables }`; `pushToCloud` skips those tables so stale local data never overwrites the cloud after a partial pull. Pull merges use `bulkGet`/`bulkPut` (keep it batched).
- `syncQueue` operations: `upsert` | `delete` (soft) | `hardDelete`; retries capped at `MAX_RETRY_COUNT` with exponential backoff; deduped by `[table+itemId]`; items are tagged with `userId`.
- All sync triggers (sign-in, back-online, 5-minute interval, manual) flow through ONE guarded entrypoint in `contexts/sync/SyncProvider.tsx` (`runSyncChain`, keyed on `user?.id` so token refreshes don't re-sync, guarded by `isSyncingRef`). Don't add new ad-hoc `fullSync` call sites.

**`data/repositories/`** - Data access layer. All CRUD goes through repository objects (ExerciseRepo, CycleRepo, CompletedSetRepo, etc.). Shared `getNormalized`/`deleteIfExists` helpers live in `repositories/repoUtils.ts`. Prefer index-backed queries (`orderBy`, `between` on `[exerciseId+completedAt]`) over `toArray()` + in-memory filtering.

**`data/db.ts`** - Dexie schema with versioned migrations (currently **v8**). Schema changes require a new version block (repeat all table strings, change only what's new) with an idempotent `.upgrade()`. `importData` revives ISO-string dates to Date objects — IndexedDB sorts strings and Dates in separate type groups, so imported rows must store real Dates or index queries break.

### Schema-change checklist (both sides)

When adding a synced field: (1) local type in `types/`, (2) Dexie version bump in `data/db.ts` with backfill, (3) `Remote*` interface in `services/sync/types.ts` (nullable if old DBs may lack the column), (4) both transformer directions in `services/sync/transformers.ts`, (5) numbered SQL migration in `supabase/migrations/` + row in its README, (6) repository mutators set the field. **Deploy the Supabase migration BEFORE shipping the client** — a new client upserting an unknown column gets PGRST204 failures.

### State Management
- **Zustand** (`stores/appStore.ts`): Theme, font size, onboarding status, warmup-visibility toggles
- **AuthContext**: User session, sign in/out (context value memoized — keep it that way)
- **SyncContext**: Sync status, trigger sync (single `runSyncChain` entrypoint)
- **SyncedPreferencesContext**: User preferences that sync to cloud

### Page composition pattern
Pages stay thin by pushing logic into hooks and subcomponents — follow the Today page pattern: `hooks/today/useTodayLiveData` (live queries), `hooks/today/useTodayWorkoutActions` (handlers), `hooks/today/useTodayModals` (reducer-based modal state), UI in `components/workouts/today/`. Schedule's cycle-lifecycle modals are composed in `components/schedule/CycleModals.tsx` — reuse it rather than wiring the selector/wizard/max-testing trio again. Exercise creation logic is shared via `hooks/useCreateExercise.ts` (used by the Exercises page and the wizard's inline create).

### Path Alias
Use `@/` to import from `src/`:
```typescript
import { Button } from '@/components/ui/Button'
```

## UI Primitives (`src/components/ui/`)

Use these instead of hand-rolling: `Button`, `Input`/`NumberInput`/`TimeDurationInput` (MM:SS), `Select`, `Card`, `Modal`, `ConfirmModal` (standard confirm/cancel dialogs), `Badge`, `EmptyState`, `FilterChip`, `WheelPicker`, `Skeleton` variants, and:

- **`Toggle`** — accessible switch (`role="switch"`, 44px hit area, `sm`/`md` sizes). Never hand-roll a toggle.
- **`SegmentedControl`** — pill radio group (Schedule view toggle, Progress timeframe, wizard scheduling mode).
- **`SelectionCard`** — bordered pick-one card (theme/app-mode/font-size in Settings). `disabled` is visual-only so locked options can still open the paywall.
- **`StatTile`** — centered value+label stat block.

Icon-only buttons need `aria-label`. Use loading skeletons for `useLiveQuery === undefined` states rather than flashing empty states (note: `useLiveQuery` returns `undefined` both while loading and when the query yields `undefined` — use a `?? null` sentinel in the query when you need to distinguish, as Schedule does for `activeCycle`).

## Testing

Tests are colocated with source files as `*.test.ts(x)`. Run a single test file:
```bash
npm test -- src/services/scheduler.test.ts
```

- Setup in `src/test/setup.ts` (jsdom, localStorage/matchMedia mocks). **No jest-dom matchers** — use plain assertions (`.getAttribute(...)`, `toBeTruthy()`), RTL is available.
- Anything touching the countdown timer must mock `@/plugins/timerAudio` and `@/utils/timerNotifications` (see `useCountdownTimer.test.ts` / `RestTimerBanner.test.tsx` for the pattern) and use fake timers + a mocked `Date.now` (the hook is wall-clock based).
- `syncService.test.ts` / `repositories.test.ts` mock the Dexie `db` object — new table methods used in code (e.g. `bulkGet`) must be added to those mocks.
- Wizard step-gating logic is a pure function (`getProceedBlockReason` in `useCycleWizardState.ts`) — extend its unit test when changing step validation.

## Key Domain Concepts

**RFEM (Reps From Established Max)**: Target reps = Max reps - RFEM value. RFEM values rotate through the cycle (e.g., [3, 4, 5, 4]).

**Cycles**: Training plans with exercise groups, weekly set goals, and RFEM rotation. Types: `training` (regular workouts) and `max_testing` (establishing new PRs).

**Progression Modes**: `rfem` (percentage of max), `simple` (fixed increments), or `mixed` (per-exercise).

**Scheduling Modes**: `date` (fixed days of week, workouts get `scheduledDate`, drives overdue/rest-day logic) or `sequence` (flexible, do workouts whenever). Chosen via a toggle inside the wizard's Schedule step (not a separate step). The Max Testing wizard supports both and must assign `scheduledDate` in date mode via `calculateWorkoutDates`.

## Data Transformations

Local data uses camelCase and Date objects. Remote (Supabase) uses snake_case and ISO strings. Transformers in `services/sync/transformers.ts` handle conversion. **Use `?? null` (never `|| null`) for numeric fields** — `||` silently converts legitimate `0` values (bodyweight 0, increment 0) to null. Remote types in `services/sync/types.ts` are hand-maintained mirrors of the SQL schema; columns added by migrations must be reflected there and in both transformer directions or they are silently dropped.

## Environment Variables

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

## iOS Widget Notes

**WidgetKit iOS 17+ requirement:** Widgets must call `.containerBackground(for: .widget)` or WidgetKit refuses to render and shows `(!)`. Since the deployment target is iOS 16, this is applied conditionally via a `widgetContainerBackground()` ViewBuilder extension in `ios/App/AscendWidget/AscendWidget.swift`. Use `.clear` for lock screen (accessory) widgets — `AccessoryWidgetBackground()` handles the visual background internally.

**Lock screen icon rendering:** PNG image assets render as blank shapes on the lock screen due to iOS greyscale/vibrancy treatment. Use SwiftUI vector shapes with `.primary` color instead — iOS adapts `.primary` automatically for lock screen vibrancy.

**Safe area:** fixed bottom UI (tab bar, rest-timer banner) must account for `env(safe-area-inset-bottom)`; the nav is `h-16` + `.safe-area-bottom`, and the banner offsets by `calc(4rem + env(safe-area-inset-bottom))`. Overlay z-order: banner `z-40`, modals `z-50`.

## Conventions

- Components: PascalCase files
- Utilities: camelCase files
- Types: Defined in `types/`, exported via `types/index.ts`
- Logging: Use `createScopedLogger('Scope')` for debug output
- Shared Tailwind classes: `styles/classes.ts` (note: sparsely adopted — primitives carry their own styles)
- Swipeable cards (`SwipeableSetCard`/`SwipeableWorkoutCard`): a tap is <10px movement with NO duration limit (`TAP_THRESHOLD` in `constants/ui.ts`) — do not reintroduce a duration cutoff; slow gym taps must register
- `components/education/` (tooltip system + intro modals) is currently unwired but intentionally kept for future use
