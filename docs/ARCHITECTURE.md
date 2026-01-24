# Ascend Architecture Documentation

## Overview

Ascend is a Progressive Web App (PWA) for calisthenics and bodyweight strength training. It implements RFEM (Reps From Established Max) methodology with cycle-based periodization.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript |
| Styling | Tailwind CSS |
| State | Zustand (local UI), React Context (auth, sync) |
| Local Storage | Dexie (IndexedDB wrapper) |
| Backend | Supabase (Auth, PostgreSQL) |
| Build | Vite, PWA plugin |
| Testing | Vitest, React Testing Library |

## Directory Structure

```
src/
├── components/       # React components organized by domain
│   ├── cycles/       # Cycle creation/editing wizards
│   ├── exercises/    # Exercise forms and cards
│   ├── layout/       # App layout, headers, navigation
│   ├── onboarding/   # New user onboarding flow
│   ├── schedule/     # Workout schedule and calendar
│   ├── settings/     # Settings page components
│   ├── ui/           # Reusable UI primitives
│   └── workouts/     # Workout logging components
├── constants/        # Application constants
├── contexts/         # React contexts (Auth, Sync, Preferences)
├── data/             # Data layer
│   ├── db.ts         # Dexie database configuration
│   ├── repositories/ # Data access layer
│   └── supabase.ts   # Supabase client
├── hooks/            # Custom React hooks
├── pages/            # Page components (route-level)
├── services/         # Business logic
│   ├── scheduler.ts  # Workout scheduling algorithm
│   ├── sync/         # Sync transformers
│   └── syncService.ts# Cloud sync service
├── stores/           # Zustand stores
├── styles/           # Shared style utilities
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Data Architecture

### Local-First Approach

Ascend uses a local-first architecture where all data is stored in IndexedDB (via Dexie) and optionally synced to Supabase when the user is authenticated.

```
┌─────────────────┐     ┌─────────────────┐
│   React App     │     │    Supabase     │
│                 │     │                 │
│  ┌───────────┐  │     │  ┌───────────┐  │
│  │  Zustand  │  │     │  │ PostgreSQL│  │
│  │ (UI State)│  │     │  │           │  │
│  └───────────┘  │     │  └───────────┘  │
│        │        │     │        ↑        │
│        ↓        │     │        │        │
│  ┌───────────┐  │────▶│  ┌───────────┐  │
│  │   Dexie   │  │sync │  │   Auth    │  │
│  │(IndexedDB)│  │◀────│  │           │  │
│  └───────────┘  │     │  └───────────┘  │
└─────────────────┘     └─────────────────┘
```

### Repository Pattern

All data access goes through repository classes in `src/data/repositories/`:

| Repository | Responsibility |
|------------|---------------|
| `ExerciseRepo` | CRUD for exercises |
| `MaxRecordRepo` | Max records (PRs) |
| `CompletedSetRepo` | Logged workout sets |
| `CycleRepo` | Training cycles |
| `ScheduledWorkoutRepo` | Planned workouts |
| `UserPreferencesRepo` | User settings (synced) |

### Data Models

```typescript
// Core domain models (simplified)
Exercise { id, name, type, mode, measurementType }
MaxRecord { id, exerciseId, maxReps?, maxTime?, weight? }
Cycle { id, name, startDate, numberOfWeeks, groups, status }
ScheduledWorkout { id, cycleId, weekNumber, scheduledSets, status }
CompletedSet { id, exerciseId, targetReps, actualReps, completedAt }
```

## Key Systems

### 1. Workout Scheduler (`services/scheduler.ts`)

Generates workout schedules based on cycle configuration:

- Distributes exercises across workout days
- Calculates target reps using RFEM algorithm
- Generates warmup sets
- Handles conditioning exercise progression

```typescript
// Core scheduling function
generateSchedule(cycle, exercises, maxRecords) → ScheduledWorkout[]
```

### 2. Sync System (`services/syncService.ts`)

Handles bidirectional sync between local IndexedDB and Supabase:

- **Pull**: Fetches remote changes since last sync
- **Push**: Uploads local changes
- **Conflict Resolution**: Remote wins (last-write-wins)
- **Offline Support**: Queues changes when offline
- **Retry Logic**: Exponential backoff for failed operations (configured in `constants/sync.ts`)

```typescript
// Sync flow
SyncService.fullSync() → {
  pullRemoteChanges()  // Get server changes
  pushLocalChanges()   // Send local changes
  resolveConflicts()   // Merge conflicts
}

// Retry configuration (constants/sync.ts)
MAX_RETRY_COUNT = 5           // Max retry attempts
RETRY_BASE_MS = 1000          // Base delay (1s)
RETRY_MAX_MS = 30000          // Max delay (30s)
```

### 3. State Management

**Global UI State (Zustand)**
```typescript
// src/stores/appStore.ts
useAppStore: theme, fontSize, repDisplayMode, hasCompletedOnboarding
```

**Auth State (React Context)**
```typescript
// src/contexts/AuthContext.tsx
useAuth: user, signIn, signUp, signOut, deleteAccount
```

**Sync State (React Context)**
```typescript
// src/contexts/SyncContext.tsx
useSync: syncStatus, triggerSync, lastSyncTime
```

**Preferences State (React Context)**
```typescript
// src/contexts/SyncedPreferencesContext.tsx
useSyncedPreferences: preferences, updatePreferences (syncs to cloud)
```

### 4. RFEM Progression System

RFEM (Reps From Established Max) is the core progression algorithm:

```
Target Reps = Max Reps - RFEM Value

Example:
- Max Record: 20 reps
- RFEM: 3
- Target: 20 - 3 = 17 reps
```

RFEM rotates through the cycle (e.g., [3, 4, 5, 4]) to provide progressive overload.

## Component Architecture

### Page Structure

Each page follows a consistent pattern:

```typescript
// pages/Today.tsx (example)
function TodayPage() {
  // 1. Data hooks
  const { data } = useLiveQuery(() => repo.getAll());
  
  // 2. UI state hooks
  const { displayWorkout } = useWorkoutDisplay();
  
  // 3. Modal state hooks
  const { modals, openModal } = useTodayModals();
  
  // 4. Action handlers
  const handleComplete = async () => { ... };
  
  // 5. Render
  return (
    <Layout>
      <PageHeader />
      <MainContent />
      <Modals />
    </Layout>
  );
}
```

### UI Component Library (`components/ui/`)

Reusable primitives:

| Component | Purpose |
|-----------|---------|
| `Button` | Standard button with variants |
| `Card` | Content container |
| `Modal` | Dialog overlay |
| `Input` | Form inputs (text, number, time) |
| `Select` | Dropdown selector |
| `Badge` | Status/label indicators |
| `FilterChip` | Toggle filter buttons |
| `ConfirmModal` | Confirmation dialogs |
| `EmptyState` | Empty list placeholders |
| `Skeleton` | Loading placeholders |

## PWA Features

- **Offline Support**: Full functionality without internet
- **Installable**: Add to home screen
- **Background Sync**: Queued sync when online
- **Service Worker**: Caches assets for fast loading

## Testing Strategy

| Type | Tool | Location |
|------|------|----------|
| Unit Tests | Vitest | `*.test.ts` alongside source |
| Hook Tests | React Testing Library | `hooks/*.test.ts` |
| Service Tests | Vitest | `services/*.test.ts` |

```bash
npm test           # Run all tests
npm test -- --run  # Single run (no watch)
```

## Code Quality

| Tool | Purpose | Config |
|------|---------|--------|
| TypeScript | Type safety | `tsconfig.json` |
| ESLint | Linting | `eslint.config.js` |
| Prettier | Formatting | `.prettierrc` |
| Husky | Pre-commit hooks | `.husky/pre-commit` |

```bash
npm run lint       # Check for issues
npm run lint:fix   # Auto-fix issues
npm run format     # Format code
```

## Environment Configuration

```bash
# .env (not committed)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_REVENUECAT_API_KEY=xxx    # iOS In-App Purchases (RevenueCat)
```

## Deployment

```bash
npm run build      # Build for production
npm run preview    # Preview production build
```

Deployed to Vercel via GitHub integration.

## Key Conventions

1. **File naming**: PascalCase for components, camelCase for utilities
2. **Imports**: Use `@/` alias for `src/`
3. **Types**: Defined in `types/`, exported via `types/index.ts`
4. **Constants**: Centralized in `constants/`
5. **Styling**: Tailwind utilities, shared classes in `styles/classes.ts`
6. **Logging**: Use `createScopedLogger('Scope')` for debugging

## Future Considerations

- iOS App Store distribution via Capacitor
- HealthKit integration for Apple Health
- Push notifications for workout reminders
- Subscription-based monetization
