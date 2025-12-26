# Ascend

A Progressive Web App for progressive calisthenics strength training.

## Features

- **User Accounts**: Sign up with email to sync across devices
- **Onboarding Flow**: Guided setup for new users
- **Training Cycles**: Create multi-week training plans with exercise groups and rotations
- **Dynamic Rep Calculation**: RFEM-based rep targets and conditioning progression
- **Queue-Based Scheduling**: Automatic workout queue management
- **Swipe Gestures**: Swipe right to complete sets, swipe left to skip
- **Rest Timer**: Configurable rest timer between sets
- **Weight Tracking**: Optional weight tracking for weighted exercises
- **Offline Support**: Full PWA with offline-first architecture
- **Progress Tracking**: Track sets, reps, and personal records over time
- **Data Export/Import**: Backup and restore all your data
- **Industry-Standard Dark Mode**: Uses #121212 background with elevated surfaces

## Local Development

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## Build

```bash
npm run build
npm run preview  # Preview the production build locally
```

## Deploy to Vercel

### Option A: GitHub Integration (Recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Vercel auto-detects Vite — just click "Deploy"
6. Your app will be live at `https://your-project.vercel.app`

### Option B: Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts. Your app will be deployed in about 30 seconds.

## Cloud Sync Setup

To enable user accounts and cloud sync:

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL from `supabase-schema.sql` in the SQL Editor
3. Add environment variables in Vercel:
   - `VITE_SUPABASE_URL` = your project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
4. Configure authentication URLs in Supabase:
   - Go to Authentication → URL Configuration
   - Set **Site URL** to your production URL (e.g., `https://your-app.vercel.app`)
   - Add your production URL to **Redirect URLs**
   
   This ensures email confirmation links redirect back to your app correctly.

## Install as App on Phone

Once deployed to Vercel (or any HTTPS host):

1. Open the deployed URL in your phone's browser
2. **iOS Safari**: Tap Share → "Add to Home Screen"
3. **Android Chrome**: Tap menu (⋮) → "Add to Home Screen" or "Install App"

The app works fully offline after first load. All data is stored locally on your device.

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── exercises/    # Exercise-related components
│   ├── workouts/     # Workout/set logging components
│   ├── cycles/       # Cycle wizard and management
│   ├── onboarding/   # Auth gate and onboarding flow
│   └── layout/       # Layout and navigation
├── contexts/         # Auth and sync contexts
├── data/
│   ├── db.ts         # Dexie database setup
│   ├── supabase.ts   # Supabase client
│   └── repositories/ # Data access layer
├── pages/            # Page components
├── services/         # Scheduling engine and sync
├── stores/           # Zustand state management
└── types/            # TypeScript type definitions
```

## Tech Stack

- **React 18** + TypeScript
- **Vite** + vite-plugin-pwa
- **Dexie.js** (IndexedDB wrapper)
- **Tailwind CSS**
- **Zustand** (state management)
- **Supabase** (authentication + cloud sync)

## About

Ascend is part of the BetterDays suite of personal development tools.
