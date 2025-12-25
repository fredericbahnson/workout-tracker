# Ascend

A Progressive Web App for progressive calisthenics strength training.

## Features

- **Training Cycles**: Create multi-week training plans with exercise groups and rotations
- **Dynamic Rep Calculation**: RFEM-based rep targets and conditioning progression
- **Queue-Based Scheduling**: Automatic workout queue management
- **Swipe Gestures**: Swipe right to complete sets, swipe left to skip
- **Rest Timer**: Configurable rest timer between sets
- **Offline Support**: Full PWA with offline-first architecture
- **Progress Tracking**: Track sets, reps, and personal records over time
- **Data Export/Import**: Backup and restore all your data

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
│   └── layout/       # Layout and navigation
├── data/
│   ├── db.ts         # Dexie database setup
│   └── repositories/ # Data access layer
├── pages/            # Page components
├── services/         # Scheduling engine
├── stores/           # Zustand state management
└── types/            # TypeScript type definitions
```

## Tech Stack

- **React 18** + TypeScript
- **Vite** + vite-plugin-pwa
- **Dexie.js** (IndexedDB wrapper)
- **Tailwind CSS**
- **Zustand** (state management)

## Future: Cloud Sync

Phase 2 will add Supabase integration for:
- User authentication
- Multi-device sync
- Sharing with others

## About

Ascend is part of the BetterDays suite of personal development tools.
