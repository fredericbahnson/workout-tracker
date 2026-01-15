# Ascend

A Progressive Web App for systematic calisthenics and bodyweight strength training with sophisticated progression tracking.

## Key Features

### Training System
- **RFEM Progression**: Reps From Established Max — calculates target reps as a percentage of your tested maximum
- **Simple Progression**: Traditional rep/weight progression with configurable increments
- **Mixed Mode**: Configure RFEM or Simple progression independently for each exercise
- **Conditioning Exercises**: Weekly progressive overload with configurable rep/time increments
- **Time-Based Exercises**: Full support for timed holds (planks, hangs, etc.)
- **Warmup Generation**: Automatic warmup sets at 20% and 40% of working intensity

### Cycle Management
- **Training Cycles**: Multi-week plans with exercise groups and rotations
- **Max Testing Cycles**: Dedicated cycles for establishing new maxes
- **Group Rotation**: Organize exercises into groups (Push/Pull/Legs) with automatic rotation
- **Set Goals**: Target weekly set counts per exercise type with intelligent distribution

### Workout Experience
- **Swipe Gestures**: Swipe right to complete sets, swipe left to skip
- **Quick Complete**: One-tap set completion at target reps
- **Rest Timer**: Configurable countdown with haptic feedback
- **Ad-Hoc Workouts**: Log unscheduled workouts anytime
- **Workout Preview**: See upcoming sets before starting

### Data & Sync
- **Cloud Sync**: Sign up with email to sync across devices
- **Offline-First**: Full PWA with IndexedDB storage
- **Automatic Sync**: Background sync every 5 minutes when online
- **Data Export/Import**: Full backup and restore capability

### User Interface
- **Dark Mode**: Industry-standard dark theme (#121212 background)
- **Calendar View**: Visual schedule with workout history
- **Progress Tracking**: Historical stats and personal records
- **Responsive Design**: Optimized for mobile and desktop

## Getting Started

### Local Development

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### Build & Preview

```bash
npm run build
npm run preview  # Preview the production build locally
```

### Run Tests

```bash
npm test           # Run all tests
npm test -- --ui   # Interactive test UI
```

## Deployment

### Deploy to Vercel

#### Option A: GitHub Integration (Recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Vercel auto-detects Vite — just click "Deploy"
6. Your app will be live at `https://your-project.vercel.app`

#### Option B: Vercel CLI

```bash
npm install -g vercel
vercel
```

### Cloud Sync Setup (Supabase)

To enable user accounts and cloud sync:

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL from `supabase-schema.sql` in the SQL Editor
3. Add environment variables in Vercel:
   - `VITE_SUPABASE_URL` = your project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
4. Configure authentication URLs in Supabase:
   - Go to Authentication → URL Configuration
   - Set **Site URL** to your production URL
   - Add your production URL to **Redirect URLs**

### Database Migrations

If updating an existing database, see migration files in `supabase/migrations/`.

## Install as Mobile App

Once deployed to Vercel (or any HTTPS host):

1. Open the deployed URL in your phone's browser
2. **iOS Safari**: Tap Share → "Add to Home Screen"
3. **Android Chrome**: Tap menu (⋮) → "Add to Home Screen" or "Install App"

The app works fully offline after first load.

## Project Structure

```
src/
├── components/
│   ├── ui/               # Reusable UI (Button, Card, Modal, Input, Skeleton)
│   ├── exercises/        # Exercise CRUD components
│   ├── workouts/         # Set logging, rest timer, workout display
│   │   └── today/        # Today page subcomponents
│   ├── cycles/           # Cycle wizard and management
│   │   └── wizard/       # Decomposed wizard steps and hooks
│   ├── schedule/         # Schedule page modals
│   ├── settings/         # Settings page modals
│   ├── onboarding/       # Auth gate and onboarding flow
│   └── layout/           # Navigation and page structure
├── constants/            # Training constants (RFEM, warmup percentages)
├── contexts/             # React contexts (Auth, Sync)
├── data/
│   ├── db.ts             # Dexie database schema
│   ├── supabase.ts       # Supabase client
│   └── repositories/     # Data access layer (CRUD operations)
├── hooks/                # Custom React hooks
├── pages/                # Page components
├── services/             # Business logic
│   ├── scheduler.ts      # Schedule generation engine
│   ├── syncService.ts    # Cloud sync orchestration
│   └── sync/             # Sync transformers and types
├── stores/               # Zustand state management
├── styles/               # Tailwind utilities
├── types/                # TypeScript definitions
└── utils/                # Utility functions
```

## Tech Stack

- **React 18** + TypeScript
- **Vite** + vite-plugin-pwa
- **Dexie.js** (IndexedDB wrapper)
- **Tailwind CSS**
- **Zustand** (state management)
- **Supabase** (authentication + cloud sync)
- **Vitest** (testing)

## Testing

The test suite includes:
- **Scheduler tests**: Schedule generation, progression calculations, warmup generation
- **Sync tests**: Cloud sync transformers, conflict resolution, queue processing
- **Repository tests**: Data access layer CRUD operations

Current test coverage: 284 tests

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

## About

Ascend is part of the BetterDays suite of personal development tools.
