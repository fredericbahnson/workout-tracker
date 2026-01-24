# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ascend is a Progressive Web App (PWA) for calisthenics and bodyweight strength training. It uses RFEM (Reps From Established Max) methodology for progression tracking, with cycle-based periodization. The app is local-first with optional cloud sync via Supabase.

## Commands

```bash
npm run dev          # Start dev server at localhost:5173
npm run build        # TypeScript check + Vite build
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

**`services/scheduler.ts`** - Generates workout schedules from cycle configuration. Handles RFEM calculations, warmup generation, and conditioning progression.

**`services/syncService.ts`** - Bidirectional sync between IndexedDB and Supabase. Uses last-write-wins conflict resolution. Offline changes queue in `syncQueue` table with exponential backoff retry.

**`data/repositories/`** - Data access layer. All CRUD operations go through repository classes (ExerciseRepo, CycleRepo, CompletedSetRepo, etc.).

**`data/db.ts`** - Dexie database schema with versioned migrations (currently v3). Schema changes require incrementing the version number and adding a new version block.

### State Management
- **Zustand** (`stores/appStore.ts`): Theme, font size, onboarding status
- **AuthContext**: User session, sign in/out
- **SyncContext**: Sync status, trigger sync
- **SyncedPreferencesContext**: User preferences that sync to cloud

### Path Alias
Use `@/` to import from `src/`:
```typescript
import { Button } from '@/components/ui/Button'
```

## Testing

Tests are colocated with source files as `*.test.ts`. Run a single test file:
```bash
npm test -- src/services/scheduler.test.ts
```

Test setup is in `src/test/setup.ts`. Uses jsdom environment.

## Key Domain Concepts

**RFEM (Reps From Established Max)**: Target reps = Max reps - RFEM value. RFEM values rotate through the cycle (e.g., [3, 4, 5, 4]).

**Cycles**: Training plans with exercise groups, weekly set goals, and RFEM rotation. Types: `training` (regular workouts) and `max_testing` (establishing new PRs).

**Progression Modes**: `rfem` (percentage of max), `simple` (fixed increments), or `mixed` (per-exercise).

## Data Transformations

Local data uses camelCase and Date objects. Remote (Supabase) uses snake_case and ISO strings. Transformers in `services/sync/transformers.ts` handle conversion.

## Environment Variables

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

## Conventions

- Components: PascalCase files
- Utilities: camelCase files
- Types: Defined in `types/`, exported via `types/index.ts`
- Logging: Use `createScopedLogger('Scope')` for debug output
- Shared Tailwind classes: `styles/classes.ts`
