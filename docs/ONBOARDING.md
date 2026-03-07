# Ascend Onboarding Documentation

This document provides a complete specification of the Ascend app onboarding experience, including flow structure, content, user experience, and connections to reusable help modules.

---

## Overview

The Ascend onboarding system is designed to:
1. **Establish legal compliance** through a mandatory health disclaimer
2. **Authenticate users** for cloud sync capabilities  
3. **Introduce the app's value proposition** and RFEM methodology
4. **Teach core interactions** through static demonstrations
5. **Get users started** by creating their first exercise
6. **Provide app navigation overview** through an interactive tour
7. **Allow revisiting** content via Settings → Help & Guides

### Total Slides

| Flow Segment | Slides | Skippable |
|--------------|--------|-----------|
| Health Disclaimer | 1 | ❌ No |
| Authentication | 1 | N/A (optional if configured) |
| Identity & Value | 2 | ✅ Yes |
| Gesture Demos | 3 | ✅ Yes |
| Exercise Creation | 3 | ✅ Yes |
| App Tour | 4 | ✅ Yes |
| RFEM Deep Dive | 3 | ✅ Yes (optional) |

**Minimum path:** Health Disclaimer (1) + Skip onboarding = 1 screen  
**Full path:** 17 screens (including optional RFEM deep dive)

---

## Flow Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         APP LAUNCH                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 0: HEALTH DISCLAIMER (Mandatory - Cannot Skip)            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ HealthDisclaimer.tsx                                        │  │
│  │ - Medical consultation warning                              │  │
│  │ - Listen to your body guidance                             │  │
│  │ - User responsibility acknowledgment                        │  │
│  │ - Links to Terms of Service                                │  │
│  │ Button: "I Understand & Agree"                             │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 0.5: AUTHENTICATION (Conditional)                         │
│  Shows only if Supabase is configured                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ AuthGate.tsx                                                │  │
│  │ - Sign In / Sign Up toggle                                 │  │
│  │ - Email + Password form                                    │  │
│  │ - Forgot password flow                                     │  │
│  │ - Email verification flow                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  ONBOARDING FLOW (OnboardingFlow.tsx)                            │
│  Can be skipped at any point after Phase 1                       │
└──────────────────────────────────────────────────────────────────┘
        │
        ├── PHASE 1: Identity & Value (2 slides)
        │   ├── Slide 1: IdentitySlide
        │   └── Slide 2: ValuePropositionSlide
        │
        ├── PHASE 2: Gesture Demonstrations (3 slides)
        │   ├── Slide 3: DayInLifeSlide
        │   ├── Slide 4: SwipeCompleteSlide
        │   ├── Slide 5: SwipeSkipSlide
        │   └── Slide 6: TapToEditSlide (interactive)
        │
        ├── PHASE 3: Quick Start (3 slides)
        │   ├── Slide 7: FirstExerciseSlide
        │   ├── Slide 8: RecordMaxSlide
        │   └── Slide 9: ExerciseSuccessSlide
        │
        ├── PHASE 4: App Tour (4 slides)
        │   ├── Slide 10: Today page overview
        │   ├── Slide 11: Exercises page overview
        │   ├── Slide 12: Training Cycles overview
        │   └── Slide 13: Progress page overview
        │           └── Option: "Learn About RFEM First" → RFEM Deep Dive
        │
        └── PHASE 5: RFEM Deep Dive (3 slides, optional)
            ├── Slide 14: RFEM Explained + interactive calculator
            ├── Slide 15: Wave Pattern visualization
            └── Slide 16: Beyond RFEM (alternative modes)
```

---

## Detailed Slide Specifications

### Phase 0: Health Disclaimer (Mandatory)

**Component:** `HealthDisclaimer.tsx`  
**Cannot be skipped or bypassed**

| Element | Content |
|---------|---------|
| Icon | Heart (rose/amber gradient) |
| Headline | "Your Health Comes First" |
| Warning 1 | ⚠️ Consult your doctor before starting any new exercise program |
| Warning 2 | ❤️ Listen to your body - stop if experiencing pain, dizziness, etc. |
| Warning 3 | ✓ You are responsible for exercising safely |
| Legal text | Acknowledgment of inherent risks, link to Terms of Service |
| Button | "I Understand & Agree" |

**Persistence:** `hasAcknowledgedHealthDisclaimer` stored via `useAuth()` context

---

### Phase 0.5: Authentication (Conditional)

**Component:** `AuthGate.tsx`  
**Shows only if Supabase is configured**

#### Sign In Mode
- Email input
- Password input with visibility toggle
- "Sign In" button
- "Forgot password?" link
- Switch to Sign Up

#### Sign Up Mode  
- Email input
- Password input (6+ characters required)
- "Create Account" button
- Email verification flow with:
  - Verification instructions
  - "I've Verified My Email" button
  - Resend verification option
- Switch to Sign In

#### Password Reset Mode
- Email input
- "Send Reset Link" button
- Success confirmation with return to Sign In

---

### Phase 1: Identity & Value (Slides 1-2)

#### Slide 1: IdentitySlide

**Component:** `IdentitySlide.tsx`

| Element | Content |
|---------|---------|
| Image | App icon (`/pwa-192x192.png`) |
| Headline | "Built for Everyone" |
| Body | "Whether you're working on your first push-up or chasing muscle-ups, Ascend adapts to your journey." |
| Progression Examples | Visual showing: Incline Rows → Horizontal Rows → Pull-ups, Knee Push-ups → Push-ups → Archer Push-ups |
| Subtext | "Train at home, at the park, or wherever you are. No gym required." |
| Button | "Let's Go" → |

**Milestone tracked:** `identityShown: true`

---

#### Slide 2: ValuePropositionSlide

**Component:** `ValuePropositionSlide.tsx`

| Element | Content |
|---------|---------|
| Icon | Sparkles (violet/purple gradient) |
| Headline | "Train Smarter, Not Harder" |
| Body | "Ascend handles the programming so you can focus on training." |
| Feature 1 | ⚡ Intelligent Progression - Auto-calculated targets based on your performance |
| Feature 2 | 📴 Works Offline - Train anywhere without internet connection |
| Feature 3 | 🔄 Syncs Everywhere - Access your data on any device |
| Trial badge | "4-week free trial to get started" |
| Button | "See How It Works" → |

---

### Phase 2: Gesture Demonstrations (Slides 3-6)

#### Slide 3: DayInLifeSlide

**Component:** `DayInLifeSlide.tsx`

| Element | Content |
|---------|---------|
| Icon | Home (primary/cyan gradient) |
| Headline | "Your Daily Workout View" |
| Body | "Open the app, see your sets, swipe to complete. That's it." |
| Mock UI | Today page showing: 2/6 sets completed, Pull-ups (completed), Push-ups (completed), Pull-ups (pending), Push-ups (pending) |
| Steps | 1. See your **target reps** for each set, 2. **Swipe right** to mark complete, 3. **Enable rest timers** to have them start automatically |
| Button | "Try It Yourself" → |

---

#### Slide 4: SwipeCompleteSlide

**Component:** `SwipeCompleteSlide.tsx`  
**Visual:** `StaticSwipeDemo` (mode: complete)

| Element | Content |
|---------|---------|
| Icon | Hand (green/emerald gradient) |
| Headline | "Swipe Right to Complete" |
| Body | "Swipe the set card to the right to mark it complete" |
| Demo | Static visual showing Push-ups card partially swiped right with green reveal |
| Hint | "Changed your mind? Tap 'Undo' to redo or edit the set" |
| Button | "Got it" |

---

#### Slide 5: SwipeSkipSlide

**Component:** `SwipeSkipSlide.tsx`  
**Visual:** `StaticSwipeDemo` (mode: skip)

| Element | Content |
|---------|---------|
| Icon | X (red/orange gradient) |
| Headline | "Swipe Left to Skip" |
| Body | "Swipe left to skip a set you can't complete" |
| Demo | Static visual showing Pull-ups card partially swiped left with red reveal |
| Hint | "Skipped sets can always be revisited later" |
| Button | "Got it" |

---

#### Slide 6: TapToEditSlide (Interactive)

**Component:** `TapToEditSlide.tsx`  
**Visual:** `SwipeDemo` (mode: tap) - **Interactive**

| Element | Content |
|---------|---------|
| Icon | MousePointer (primary/cyan gradient) |
| Headline | "Tap to Edit Details" |
| Body | "Tap any set to log a different number of reps or time." |
| Demo | Interactive SwipeDemo component - user must tap the card |
| Hint | "Perfect for when you hit more or fewer reps than expected" |
| Completion | Automatic advance when user taps the demo card |

**Milestone tracked:** `swipeDemoPracticed: true`

---

### Phase 3: Quick Start (Slides 7-9)

#### Slide 7: FirstExerciseSlide

**Component:** `FirstExerciseSlide.tsx`

| Element | Content |
|---------|---------|
| Icon | Dumbbell (orange/amber gradient) |
| Headline | "Create Your First Exercise" |
| Body | "Start with the exercise you're most excited to track" |
| Suggestion Chips | Pull-ups, Push-ups, Squats, Dips, Rows, Lunges |
| Exercise Name Input | Text field with placeholder "Or type your own..." |
| Type Selector | Push, Pull, Legs, Core, Other |
| Note | "You can add more exercises and customize details later" |
| Button | "Continue" → (disabled until name entered) |

**Suggestion Chips (ExerciseSuggestionChips.tsx):**
```
Pull-ups (pull) | Push-ups (push) | Squats (legs)
Dips (push) | Rows (pull) | Lunges (legs)
```

---

#### Slide 8: RecordMaxSlide

**Component:** `RecordMaxSlide.tsx`

| Element | Content |
|---------|---------|
| Icon | Trophy (amber/orange gradient) |
| Headline | "What's Your Best?" |
| Body | "How many **{exerciseName}** can you do in one set, **with good form**?" |
| Input | NumberInput (default: 10, range: 1-100) |
| Help Toggle | "Not sure?" - reveals tip |
| Tip Content | "It's okay to estimate! Think of a recent workout where you pushed hard but kept good form." |
| Note | "Ascend uses this to calculate your training targets" |
| Primary Button | "Save & Continue" → |
| Secondary Button | "I'll set this later" (skips max recording) |

**Milestones tracked:**
- `firstExerciseCreated: true` (always)
- `firstMaxRecorded: true` (if reps provided)

---

#### Slide 9: ExerciseSuccessSlide

**Component:** `ReadySlide.tsx` (exported as `ExerciseSuccessSlide`)

| Element | Content |
|---------|---------|
| Icon | CheckCircle (green, no gradient) |
| Headline | "First Exercise Created!" |
| Summary Card | Shows exercise name and max (or "Max not set yet") |
| Body | "You can add more exercises from the Exercises tab after finishing the tour." |
| Button | "Continue Tour" → |

---

### Phase 4: App Tour (Slides 10-13)

**Component:** `AppTour.tsx`  
**Slides:** 4  
**Reusable:** Yes - accessible from Settings → Help & Guides → "Feature Tour"

#### Slide 10: Today Page Overview

| Element | Content |
|---------|---------|
| Icon | Home (primary/cyan gradient) |
| Headline | "Everything Starts on Today" |
| Body | "The Today page shows your scheduled workout and tracks your progress." |
| Mock UI | Today's Workout (3/8 sets): Pushups ✓, Rows (with swipe indicator), Squats |
| Feature List | ✋ Swipe right to complete at target, ⏱️ Rest timer starts automatically, 🏋️ Log ad-hoc sets anytime, ✕ Swipe left to skip a set, ✏️ Tap to edit details of the set |
| Button | "Next: Exercises" → |

---

#### Slide 11: Exercises Page Overview

| Element | Content |
|---------|---------|
| Icon | Dumbbell (orange/amber gradient) |
| Headline | "Build Your Exercise Library" |
| Body | "Add exercises you want to train and track your progress." |
| Mock UI | Filter chips (All, Push, Pull...), Exercise cards with names, types, and max values |
| Feature List | 🎯 Track reps or time-based exercises, 📊 Your max is tracked automatically |
| Button | "Next: Training Cycles" → |

---

#### Slide 12: Training Cycles Overview

| Element | Content |
|---------|---------|
| Icon | Calendar (purple/pink gradient) |
| Headline | "Structured Training Cycles" |
| Body | "Create training cycles where you set the goals, and Ascend handles the rest." |
| Mock UI | Calendar view with workout days highlighted |
| Feature List | • **Pick your exercises** — choose what you want to train, • **Set your volume goals** — how many sets per week, • **Ascend generates workouts** — always know what to do |
| Note | "Or skip cycles entirely and log workouts freestyle." |
| Button | "Next: Track Progress" → |

---

#### Slide 13: Progress Page Overview

| Element | Content |
|---------|---------|
| Icon | TrendingUp (emerald/teal gradient) |
| Headline | "See Your Growth Over Time" |
| Body | "The Progress page tracks your achievements and trends." |
| Mock UI | Stats row (Total Sets: 247, Total Reps: 3,182, PRs Set: 12), Mini bar chart showing last 7 workouts |
| Feature List | 📊 Volume trends and statistics, 📈 Personal records per exercise |
| Note | "Sync with an account to access your data on any device." |
| Primary Button | "Start Training" |
| Secondary Button | "Learn About RFEM First" → (optional, leads to RFEM Deep Dive) |

---

### Phase 5: RFEM Deep Dive (Slides 14-16, Optional)

**Component:** `RFEMGuide.tsx`  
**Slides:** 3  
**Reusable:** Yes - accessible from Settings → Help & Guides → "Understanding RFEM"

#### Slide 14: RFEM Explained

| Element | Content |
|---------|---------|
| Icon | Target (emerald/cyan gradient) |
| Headline | "RFEM: Reps From Established Max" |
| Body | "Instead of grinding to failure, you train at strategic rep targets **below** your max." |
| Interactive Element | `RFEMCalculator` - slider to adjust max (5-30), shows calculations for RFEM 3/4/5 |
| Benefits | ✓ **Recover faster** — ready to train again sooner, ✓ **Accumulate more volume** — more total reps over time, ✓ **Better technique** — form stays clean |
| Button | "See the Wave Pattern" → |

**RFEMCalculator Details:**
- Initial max: 15 reps
- Adjustable range: 5-30 reps
- Shows formula: Target = Max − RFEM
- Visual bars for each RFEM value (3, 4, 5)
- Legend: Working reps (green) vs Buffer (gray)

---

#### Slide 15: Wave Pattern

| Element | Content |
|---------|---------|
| Icon | Repeat (emerald/cyan gradient) |
| Headline | "Automatic Intensity Waves" |
| Body | "Ascend rotates your RFEM values from workout to workout:" |
| Visualization | SVG wave chart showing RFEM pattern: 3 → 4 → 5 → 4 → 3 → 4 → 5 → 4 across 8 workouts |
| Badge | "RFEM rotates: **3 → 4 → 5 → 4**" |
| Labels | "← Harder sessions" / "Lighter sessions →" |
| Note | "This creates **natural periodization** without you having to think about it." |
| Button | "Other Training Modes" → |

---

#### Slide 16: Beyond RFEM

| Element | Content |
|---------|---------|
| Icon | Layers (purple/pink gradient) |
| Headline | "RFEM Is the Default, Not the Only Option" |
| Body | "Ascend also supports:" |
| Mode 1 | 🎯 **Simple Progression** - Traditional approach: add reps or weight each session |
| Mode 2 | 🔀 **Mixed Mode** - Use RFEM for some exercises, simple for others |
| Mode 3 | 🏃 **Conditioning Mode** - Set a baseline and add reps each week (great for finishers) |
| Note | "You're in control of how you want to train each exercise." |
| Button | "Get Started" |

**Milestone tracked:** `rfemDeepDiveSeen: true`

---

## UI Components

### OnboardingProgress

**Component:** `OnboardingProgress.tsx`

Displays progress through the onboarding flow:
- Dot indicators for each step (current = elongated pill, completed = small dot, remaining = gray dot)
- Module break separators at indices 2 and 6
- Exit (X) button shows confirmation modal
- Modal text: "You can come back to this content anytime in **Settings → Help & Guides**."

### OnboardingSlide

**Component:** `OnboardingSlide.tsx`

Reusable slide template with:
- Icon or image display with gradient background
- Animated entrance (fade + translate)
- Headline and body content
- Primary action button (full width)
- Optional secondary action button
- Variant-specific color theming:
  - `default`: primary/cyan
  - `rfem`: emerald/cyan  
  - `tour`: purple/pink
  - `exercise`: orange/amber
  - `health`: rose/amber
- Scrollable option for long content
- Inline actions option (places buttons inside scroll area)

---

## Visual Components

### StaticSwipeDemo

**Component:** `StaticSwipeDemo.tsx`

Static visualization of a set card mid-swipe:
- Mode: `complete` (green) or `skip` (red)
- Shows exercise name and target reps
- Simulates partial swipe with reveal background

### SwipeDemo (Interactive)

**Component:** `SwipeDemo.tsx`

Interactive demonstration component:
- Mode: `tap` (for TapToEditSlide)
- Actual touch/click interaction
- Completion callback on successful interaction
- Visual hints and animations

### RFEMCalculator

**Component:** `RFEMCalculator.tsx`

Interactive RFEM demonstration:
- Adjustable max reps slider (5-30)
- Real-time calculation display for RFEM 3, 4, 5
- Visual bars showing working reps vs buffer
- Formula display: Target = Max − RFEM

### ExerciseSuggestionChips

**Component:** `ExerciseSuggestionChips.tsx`

Quick selection chips:
- 6 common exercises: Pull-ups, Push-ups, Squats, Dips, Rows, Lunges
- Selection state with checkmark
- Auto-fills exercise name and type

---

## State Management

### Persistence

The following states are persisted locally via Zustand:

```typescript
// appStore.ts
hasCompletedOnboarding: boolean      // Main completion flag
hasStartedOnboarding: boolean        // Resume tracking
onboardingMilestones: {
  identityShown: boolean             // Slide 1 seen
  swipeDemoPracticed: boolean        // Completed gesture demos
  firstExerciseCreated: boolean      // Created first exercise
  firstMaxRecorded: boolean          // Set initial max
  firstSetLogged: boolean            // Post-onboarding
  firstCycleCreated: boolean         // Post-onboarding
  rfemDeepDiveSeen: boolean          // Completed RFEM guide
  cycleIntroSeen: boolean            // Help guide
  maxTestingIntroSeen: boolean       // Help guide
  adHocSessionCount: number          // Post-onboarding
}

// AuthContext
hasAcknowledgedHealthDisclaimer: boolean  // Stored with user
```

### Flow Control

**Skip Handling:**
- Skip button appears after first slide
- Confirmation modal prevents accidental skip
- Skipping sets `hasCompletedOnboarding: true`

**Resume Handling:**
- If `hasStartedOnboarding && !hasCompletedOnboarding`, flow resumes
- Currently resumes from beginning (could be enhanced to track exact position)

---

## Reusable Help Modules

The following components can be accessed standalone from **Settings → Help & Guides**:

| Module | Access Path | Component |
|--------|-------------|-----------|
| Quick Start Guide | Getting Started → Quick Start Guide | `QuickStartGuide` |
| Feature Tour | Getting Started → Feature Tour | `AppTour` (standalone mode) |
| Understanding RFEM | Training Concepts → Understanding RFEM | `RFEMGuide` (standalone mode) |
| How Cycles Work | Training Concepts → How Cycles Work | `CycleGuide` |
| Max Testing Explained | Training Concepts → Max Testing Explained | `MaxTestingGuide` |

### Standalone Mode Differences

When `standalone={true}`:
- Final slide button says "Done" instead of "Start Training" / "Get Started"
- No "Learn About RFEM First" option on App Tour
- No milestone tracking updates

---

## File Structure

```
src/components/onboarding/
├── index.ts                     # Exports
├── types.ts                     # Type definitions
├── OnboardingFlow.tsx           # Main orchestrator
├── OnboardingSlide.tsx          # Reusable slide template
├── OnboardingProgress.tsx       # Progress indicator
├── AuthGate.tsx                 # Authentication screens
├── HealthDisclaimer.tsx         # Mandatory health screen
├── RFEMGuide.tsx               # RFEM deep dive (3 slides)
├── AppTour.tsx                 # App feature tour (4 slides)
├── slides/
│   ├── index.ts
│   ├── IdentitySlide.tsx
│   ├── ValuePropositionSlide.tsx
│   ├── DayInLifeSlide.tsx
│   ├── SwipeCompleteSlide.tsx
│   ├── SwipeSkipSlide.tsx
│   ├── TapToEditSlide.tsx
│   ├── FirstExerciseSlide.tsx
│   ├── RecordMaxSlide.tsx
│   └── ReadySlide.tsx          # ExerciseSuccessSlide
└── visuals/
    ├── index.ts
    ├── StaticSwipeDemo.tsx
    ├── SwipeDemo.tsx
    ├── RFEMCalculator.tsx
    ├── ExerciseSuggestionChips.tsx
    └── ProgressComparisonChart.tsx
```

---

## Design Principles

1. **Progressive Disclosure:** Information is revealed gradually, avoiding overwhelming new users
2. **Learn by Doing:** Interactive elements (TapToEditSlide, RFEMCalculator) reinforce learning
3. **Escape Hatches:** Users can skip at any time and revisit content later
4. **Value First:** Benefits and value proposition shown before asking for action
5. **Legal Compliance:** Health disclaimer is mandatory and cannot be bypassed
6. **Consistent Visual Language:** Gradient icons, animations, and card-based layouts throughout
7. **Mobile-First:** All slides designed for touch interaction and mobile viewports
8. **Accessibility:** Clear visual hierarchy, adequate touch targets, reduced motion support

---

## Future Considerations

- **Milestone-based Resume:** Track exact slide position for better resume experience
- **A/B Testing:** Framework for testing different onboarding variations
- **Analytics Integration:** Track completion rates, drop-off points
- **Contextual Help:** Trigger specific help modules based on user actions
- **Personalization:** Adjust content based on user goals (strength, endurance, etc.)
