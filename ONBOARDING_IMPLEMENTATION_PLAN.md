# Ascend Onboarding Redesign — Implementation Plan

## Executive Summary

This document outlines a complete redesign of the Ascend app onboarding experience. The new onboarding will:

1. **Explain RFEM training** clearly with visual examples and rationale
2. **Acknowledge traditional progression options** for users who prefer them
3. **Tour key app features** with contextual demonstrations
4. **Support revisiting content** separately (RFEM guide vs. app tour)
5. **Flow naturally into exercise creation** to establish immediate value

---

## Part 1: Design Philosophy

### Guiding Principles

| Principle | Implementation |
|-----------|----------------|
| **Respect time** | Allow skipping at any point; keep each step focused |
| **Show, don't just tell** | Use animated examples, not just text descriptions |
| **Build confidence** | Explain the "why" before the "how" |
| **Create immediate value** | End with actionable exercise creation |
| **Support different learners** | Visual, textual, and interactive elements |

### Tone and Voice

- **Approachable but knowledgeable** — like a friend who's also a great trainer
- **Encouraging without being condescending** — assume intelligence
- **Concrete and practical** — real numbers, real examples

---

## Part 2: Onboarding Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NEW USER ONBOARDING                              │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │   Welcome    │ →  │ RFEM Module  │ →  │  App Tour    │ → Exercise    │
│  │   (1 slide)  │    │ (4-5 slides) │    │  (4 slides)  │   Creation    │
│  └──────────────┘    └──────────────┘    └──────────────┘               │
│                             ↓                   ↓                        │
│                      ┌─────────────────────────────────────┐            │
│                      │   Stored as separate "chapters"     │            │
│                      │   accessible from Settings > Help   │            │
│                      └─────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Module Breakdown

| Module | Slides | Purpose | Revisitable? |
|--------|--------|---------|--------------|
| **Welcome** | 1 | Brand introduction, set expectations | No (one-time) |
| **RFEM Guide** | 4-5 | Explain RFEM training philosophy | Yes |
| **App Tour** | 4 | Key features and navigation | Yes |
| **Exercise Creation** | 1-2 | Get started immediately | No (but Exercises page always available) |

---

## Part 3: Detailed Slide Content

### Welcome Module (1 Slide)

#### Slide: "Welcome to Ascend"

**Visual:** App icon with subtle glow animation

**Headline:** Welcome to Ascend

**Body:**
> Smart strength training that adapts to you.
>
> In the next 2 minutes, you'll learn:
> - A training approach used by elite athletes
> - How Ascend automates your programming
> - Everything you need to start training

**CTA Button:** "Let's Go" →

**Skip Link:** "Skip intro" (visible but subtle)

---

### RFEM Guide Module (5 Slides)

This module can be revisited from Settings > Help > "Learn About RFEM Training"

#### Slide 1: "The Problem with 'Go to Failure'"

**Visual:** Animated chart showing recovery curve after maximal effort vs. submaximal

**Headline:** What If You Could Get Stronger... Without Burning Out?

**Body:**
> Most people train to failure every set. It feels productive, but it actually:
> - Creates excessive fatigue that hurts next session
> - Increases injury risk as form breaks down
> - Makes progress unpredictable

> Elite athletes discovered something better.

**CTA:** "See the Solution" →

---

#### Slide 2: "Introducing RFEM"

**Visual:** Interactive example with a "Max: 15 reps" badge and a target calculation

```
┌─────────────────────────────────────────┐
│          YOUR MAX: 15 REPS              │
│                                         │
│     Target = Max - RFEM                 │
│                                         │
│     RFEM 3: Target = 15 - 3 = 12 reps   │
│     RFEM 4: Target = 15 - 4 = 11 reps   │
│     RFEM 5: Target = 15 - 5 = 10 reps   │
│                                         │
│     ▼ Always in the productive zone     │
└─────────────────────────────────────────┘
```

**Headline:** RFEM: Reps From Established Max

**Body:**
> Instead of grinding to failure, you train at strategic rep targets **below** your max.
>
> **Example:** If you can do 15 pushups max:
> - RFEM 3 = Train at 12 reps
> - RFEM 4 = Train at 11 reps
> - RFEM 5 = Train at 10 reps
>
> You're always working hard, but never destroying yourself.

**CTA:** "Why This Works" →

---

#### Slide 3: "The Science of Submaximal Training"

**Visual:** Two progress graphs side by side:
- "Training to Failure" — jagged line with plateaus
- "RFEM Training" — smooth upward curve

**Headline:** More Volume, Better Recovery, Faster Progress

**Body:**
> When you don't go to failure:
> - **Recover faster** — ready to train again sooner
> - **Accumulate more volume** — more total reps over time
> - **Better technique** — form stays clean when not exhausted
> - **Sustainable progress** — no burnout cycles
>
> The result? You can train more frequently and consistently, which is the real key to long-term gains.

**CTA:** "How Ascend Uses RFEM" →

---

#### Slide 4: "RFEM Rotation = Built-in Periodization"

**Visual:** Animated sequence showing RFEM values across workouts: [3, 4, 5, 4, 3, 4, 5, 4...]

**Headline:** Automatic Intensity Waves

**Body:**
> Ascend rotates your RFEM values from workout to workout:
>
> **Workout 1:** RFEM 3 → Harder session
> **Workout 2:** RFEM 4 → Medium intensity
> **Workout 3:** RFEM 5 → Lighter session
> **Workout 4:** RFEM 4 → Building back up
> *(then the cycle repeats)*
>
> This creates natural periodization without you having to think about it.
>
> You can use the app's built-in defaults, or customize the RFEM rotation values yourself when creating a cycle.

**CTA:** "Other Training Styles" →

---

#### Slide 5: "Flexible Training Options"

**Visual:** Three cards showing different progression types

**Headline:** RFEM Is the Default, Not the Only Option

**Body:**
> Ascend also supports:
>
> 🎯 **Simple Progression**
> Traditional approach: add reps or weight each session
>
> 🔀 **Mixed Mode**
> Use RFEM for some exercises, simple for others
>
> 🏃 **Conditioning Mode**
> Set a baseline and add reps each week (great for finishers)

> You're in control of how you want to train each exercise.

**CTA:** "Explore the App" →

---

### App Tour Module (4 Slides)

This module can be revisited from Settings > Help > "App Tour"

#### Slide 1: "Today — Your Training Hub"

**Visual:** Screenshot/mockup of Today page with annotations

**Headline:** Everything Starts on Today

**Body:**
> The Today page shows:
> - **Your scheduled workout** — tap sets to log, swipe to complete
> - **Rest timer** — starts automatically after each set
> - **Progress tracker** — see how far through your cycle you are
> - **Ad-hoc logging** — log sets anytime, even outside your scheduled workout

**Annotation callouts:**
- "Swipe right to complete at target" → pointing to set card
- "Tap for custom reps" → pointing to same area
- "Cycle progress" → pointing to header

**CTA:** "Next: Exercises" →

---

#### Slide 2: "Exercises — Your Movement Library"

**Visual:** Screenshot/mockup of Exercises page

**Headline:** Build Your Exercise Library

**Body:**
> Add exercises you want to train:
> - **Type:** Push, Pull, Legs, Core, etc.
> - **Measurement:** Reps or time (for holds like planks)
> - **Mode:** Standard (uses your max) or Conditioning (fixed progression)
>
> Ascend tracks your max for each exercise to calculate targets automatically.

**Annotation callouts:**
- "Filter by type" → pointing to filter chips
- "Your current max" → pointing to exercise card detail

**CTA:** "Next: Training Cycles" →

---

#### Slide 3: "Schedule — Your Training Plan"

**Visual:** Screenshot/mockup of Schedule page calendar view

**Headline:** Structured Training Cycles

**Body:**
> Create training cycles where you set the goals, and Ascend handles the rest:
> - **Pick your exercises** — choose what you want to train
> - **Set your volume goals** — how many sets per week for each type
> - **Ascend generates your workouts** — always know exactly what to do today
>
> Or skip cycles entirely and log workouts freestyle.

**Annotation callouts:**
- "Calendar view" → pointing to calendar
- "Workout preview" → pointing to a day

**CTA:** "Next: Tracking Progress" →

---

#### Slide 4: "Progress — Watch Yourself Improve"

**Visual:** Screenshot/mockup of Progress page

**Headline:** See Your Growth Over Time

**Body:**
> The Progress page shows:
> - **Total volume** — sets, reps, time
> - **Personal records** — max achievements per exercise
> - **Trends** — weekly and cycle-based statistics
>
> Sync with an account to access your data on any device.

**CTA:** "Start Training" →

---

### Exercise Creation Module (1-2 Slides)

#### Slide 1: "Create Your First Exercise"

**Visual:** Embedded ExerciseForm component (simplified view initially)

**Headline:** Let's Add Your First Exercise

**Instruction text:**
> Start with an exercise you're excited to track.
> Pick your strongest or favorite movement!

**Form fields:**
- Exercise name
- Type (Push/Pull/Legs/Core)
- Measurement (Reps/Time)
- Initial max (optional with helper text: "Don't know? Leave blank for now")

**Actions:**
- "Create Exercise" (primary)
- "Skip for now" (secondary, takes to Exercises page)

---

#### Slide 2: "Success!" (after creation)

**Visual:** Checkmark animation

**Headline:** {Exercise Name} Added!

**Body:**
> Your first exercise is ready. You can:
> - **Add more exercises** to build your library
> - **Create a training cycle** to start scheduled workouts
> - **Log an ad-hoc workout now** on the Today page

**Actions:**
- "Add Another Exercise" (secondary)
- "Start Using Ascend" (primary → goes to Today page)

---

## Part 4: Revisitable Content System

### Storage Approach

Store onboarding chapters as enum values:

```typescript
// types/onboarding.ts
export type OnboardingChapter = 'rfem_guide' | 'app_tour';

// In appStore.ts
interface AppState {
  // ... existing fields
  hasCompletedOnboarding: boolean;
  viewedChapters: OnboardingChapter[]; // Track what they've seen
}
```

### Settings Page Integration

Add a new "Help & Guides" section to Settings:

```
┌─────────────────────────────────────────────────────────────────┐
│  Help & Guides                                                  │
├─────────────────────────────────────────────────────────────────┤
│  📖  Learn About RFEM Training                              →   │
│      Understand the progression system                          │
├─────────────────────────────────────────────────────────────────┤
│  📱  App Tour                                               →   │
│      Review key features and navigation                         │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

```typescript
// components/onboarding/index.ts exports:
export { OnboardingFlow } from './OnboardingFlow';      // Full flow for new users
export { RFEMGuide } from './RFEMGuide';                // Standalone RFEM content
export { AppTour } from './AppTour';                    // Standalone app tour
export { OnboardingSlide } from './OnboardingSlide';   // Shared slide component
export { AuthGate } from './AuthGate';                  // Existing

// Usage:
// - OnboardingFlow uses RFEMGuide + AppTour internally
// - Settings opens RFEMGuide or AppTour standalone
```

---

## Part 5: Visual Design System

### Color Palette for Onboarding

| Element | Light Mode | Dark Mode | Usage |
|---------|-----------|-----------|-------|
| Background | `gray-50` | `#121212` | Full screen backdrop |
| Card/Slide | `white` | `#1A1A2E` | Content containers |
| Primary accent | `primary-600` | `primary-500` | CTAs, highlights |
| RFEM highlight | `emerald-500` | `emerald-400` | RFEM-specific callouts |
| Secondary text | `gray-500` | `gray-400` | Descriptions |

### Typography Scale

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| Headline | `2xl` (24px) | Bold | Slide titles |
| Subhead | `lg` (18px) | Semibold | Section headers |
| Body | `base` (16px) | Normal | Main text |
| Caption | `sm` (14px) | Normal | Helper text |
| Badge | `xs` (12px) | Medium | Labels |

### Animation Specifications

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Slide transition | 300ms | `ease-out` | Navigation |
| Progress indicator | 200ms | `ease-in-out` | Step change |
| Icon appearance | 400ms | `spring(1, 80, 10)` | Slide enter |
| Chart animation | 800ms | `ease-out` | Slide enter |
| Success checkmark | 500ms | `spring` | Exercise created |

### Interactive Elements

**RFEM Calculator Demo (Slide 2 of RFEM Guide):**
```
User can adjust a slider for "Your Max" (5-50)
Target calculation updates in real-time
Visual representation shows the "safety margin"
```

**Swipe Gesture Demo (App Tour Slide 1):**
```
Animated hand showing swipe motion
Ghost set card demonstrating completion
Optional: interactive tutorial card user can try
```

---

## Part 6: Implementation Phases

### Phase 1: Foundation (Estimated: 2-3 hours)

**Tasks:**
1. Create new component structure
2. Build `OnboardingSlide` shared component with animations
3. Create `OnboardingProgress` indicator component
4. Set up navigation and state management

**Files to create:**
```
src/components/onboarding/
├── index.ts                    # Updated exports
├── OnboardingFlow.tsx          # Complete rewrite
├── OnboardingSlide.tsx         # New shared component
├── OnboardingProgress.tsx      # New progress indicator
├── types.ts                    # Onboarding-specific types
└── AuthGate.tsx                # Keep existing
```

### Phase 2: RFEM Guide Module (Estimated: 3-4 hours)

**Tasks:**
1. Create `RFEMGuide.tsx` with 5 slides
2. Build RFEM calculator interactive component
3. Create animated charts/visualizations
4. Style all RFEM-specific content

**Files to create:**
```
src/components/onboarding/
├── RFEMGuide.tsx               # RFEM module container
├── slides/
│   ├── RFEMProblemSlide.tsx
│   ├── RFEMIntroSlide.tsx
│   ├── RFEMScienceSlide.tsx
│   ├── RFEMRotationSlide.tsx
│   └── RFEMOptionsSlide.tsx
├── visuals/
│   ├── RFEMCalculator.tsx      # Interactive demo
│   ├── ProgressComparisonChart.tsx
│   └── RFEMWaveAnimation.tsx
```

### Phase 3: App Tour Module (Estimated: 2-3 hours)

**Tasks:**
1. Create `AppTour.tsx` with 4 slides
2. Build mockup/screenshot components
3. Create annotation overlay system
4. Add optional interactive elements

**Files to create:**
```
src/components/onboarding/
├── AppTour.tsx                 # App tour container
├── slides/
│   ├── TodayTourSlide.tsx
│   ├── ExercisesTourSlide.tsx
│   ├── ScheduleTourSlide.tsx
│   └── ProgressTourSlide.tsx
├── visuals/
│   ├── ScreenMockup.tsx        # Styled screenshot container
│   └── AnnotationOverlay.tsx   # Callout system
```

### Phase 4: Exercise Creation & Polish (Estimated: 2-3 hours)

**Tasks:**
1. Integrate existing ExerciseForm with streamlined onboarding variant
2. Build success celebration screen
3. Connect all modules in OnboardingFlow
4. Add skip/completion logic

**Updates:**
```
src/components/onboarding/
├── ExerciseCreationStep.tsx    # New simplified creation flow
├── SuccessCelebration.tsx      # Post-creation celebration
└── OnboardingFlow.tsx          # Final integration
```

### Phase 5: Settings Integration (Estimated: 1-2 hours)

**Tasks:**
1. Add "Help & Guides" section to Settings
2. Create standalone modals for revisiting content
3. Update appStore with chapter tracking
4. Test all navigation paths

**Updates:**
```
src/pages/Settings.tsx          # Add Help section
src/stores/appStore.ts          # Add viewedChapters
src/types/onboarding.ts         # Shared types
```

### Phase 6: Testing & Refinement (Estimated: 2-3 hours)

**Tasks:**
1. Test full onboarding flow
2. Test revisit flows from Settings
3. Test skip scenarios
4. Verify dark/light mode
5. Test on mobile viewport
6. Performance optimization

---

## Part 7: Component Specifications

### OnboardingSlide Component

```typescript
// components/onboarding/OnboardingSlide.tsx

interface OnboardingSlideProps {
  // Content
  icon?: React.ReactNode;
  image?: string;
  headline: string;
  body: React.ReactNode;
  
  // Visual customization
  variant?: 'default' | 'rfem' | 'tour';
  gradient?: string; // e.g., "from-emerald-500 to-cyan-500"
  
  // Actions
  primaryAction: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  
  // Animation
  animationDelay?: number;
}
```

### OnboardingProgress Component

```typescript
// components/onboarding/OnboardingProgress.tsx

interface OnboardingProgressProps {
  totalSteps: number;
  currentStep: number;
  moduleBreaks?: number[]; // Indices where modules change
  onSkip?: () => void;
}
```

### RFEMCalculator Component

```typescript
// components/onboarding/visuals/RFEMCalculator.tsx

interface RFEMCalculatorProps {
  initialMax?: number;
  showRotation?: boolean;
  interactive?: boolean;
}

// Renders:
// - Slider for max reps (5-50)
// - Live calculation display
// - Visual representation of target zone
```

---

## Part 8: Content Strings (Copy)

### Welcome
- **Headline:** "Welcome to Ascend"
- **Body:** "Smart strength training that adapts to you."

### RFEM Guide
- **Slide 1 Headline:** "What If You Could Get Stronger... Without Burning Out?"
- **Slide 2 Headline:** "RFEM: Reps From Established Max"
- **Slide 3 Headline:** "More Volume, Better Recovery, Faster Progress"
- **Slide 4 Headline:** "Automatic Intensity Waves"
- **Slide 5 Headline:** "RFEM Is the Default, Not the Only Option"

### App Tour
- **Slide 1 Headline:** "Everything Starts on Today"
- **Slide 2 Headline:** "Build Your Exercise Library"
- **Slide 3 Headline:** "Structured Training Cycles"
- **Slide 4 Headline:** "See Your Growth Over Time"

### Exercise Creation
- **Headline:** "Let's Add Your First Exercise"
- **Success Headline:** "{Name} Added!"

### Settings Help Section
- **Section Title:** "Help & Guides"
- **RFEM Link:** "Learn About RFEM Training"
- **RFEM Subtitle:** "Understand the progression system"
- **Tour Link:** "App Tour"
- **Tour Subtitle:** "Review key features and navigation"

---

## Part 9: Accessibility Considerations

### Required Implementations

| Feature | Implementation |
|---------|----------------|
| Screen reader | All images have alt text; live regions for dynamic content |
| Keyboard nav | All interactive elements focusable; Enter/Space to activate |
| Motion | Respect `prefers-reduced-motion`; provide static alternatives |
| Color contrast | All text meets WCAG AA (4.5:1 for body, 3:1 for large text) |
| Touch targets | Minimum 44x44px for all tappable elements |

### Animation Alternatives

When `prefers-reduced-motion` is enabled:
- Replace slide transitions with instant changes
- Show static versions of animated charts
- Remove decorative animations
- Keep functional animations (loading states) but reduce motion

---

## Part 10: Success Metrics

### Tracking Events (Optional)

| Event | Trigger | Data |
|-------|---------|------|
| `onboarding_started` | User begins onboarding | `{ isNewUser: boolean }` |
| `onboarding_slide_viewed` | Each slide | `{ module, slideIndex, slideId }` |
| `onboarding_completed` | Reaches end | `{ exerciseCreated: boolean, duration }` |
| `onboarding_skipped` | User skips | `{ skippedAt: slideId, module }` |
| `guide_revisited` | Opens from Settings | `{ chapter: 'rfem' | 'app_tour' }` |

### Success Criteria

| Metric | Target |
|--------|--------|
| Completion rate | > 60% of users complete full onboarding |
| Exercise creation rate | > 80% create at least one exercise |
| Revisit rate | > 10% revisit RFEM guide within first week |
| Time to complete | < 3 minutes for full flow |

---

## Part 11: File Structure Summary

```
src/components/onboarding/
├── index.ts                        # Exports
├── types.ts                        # Shared types
├── OnboardingFlow.tsx              # Main orchestrator
├── OnboardingSlide.tsx             # Shared slide component
├── OnboardingProgress.tsx          # Progress indicator
├── AuthGate.tsx                    # Existing (unchanged)
│
├── welcome/
│   └── WelcomeSlide.tsx
│
├── rfem/
│   ├── RFEMGuide.tsx               # Module container
│   ├── RFEMProblemSlide.tsx
│   ├── RFEMIntroSlide.tsx
│   ├── RFEMScienceSlide.tsx
│   ├── RFEMRotationSlide.tsx
│   └── RFEMOptionsSlide.tsx
│
├── tour/
│   ├── AppTour.tsx                 # Module container
│   ├── TodayTourSlide.tsx
│   ├── ExercisesTourSlide.tsx
│   ├── ScheduleTourSlide.tsx
│   └── ProgressTourSlide.tsx
│
├── exercise/
│   ├── ExerciseCreationStep.tsx
│   └── SuccessCelebration.tsx
│
└── visuals/
    ├── RFEMCalculator.tsx          # Interactive RFEM demo
    ├── ProgressComparisonChart.tsx  # Before/after visualization
    ├── RFEMWaveAnimation.tsx        # Periodization wave
    ├── ScreenMockup.tsx             # App screenshot container
    └── AnnotationOverlay.tsx        # Callout overlays
```

---

## Part 12: Migration Notes

### Breaking Changes from Current Onboarding

| Current Behavior | New Behavior |
|-----------------|--------------|
| 4 simple slides | 10+ content-rich slides across modules |
| Single flow, no revisiting | Modular chapters, revisitable |
| Basic RFEM mention | Comprehensive RFEM education |
| No app tour | Full feature walkthrough |
| Form embedded in onboarding | Simplified creation step |

### Data Migration

**No data migration required.** The new system uses the same `hasCompletedOnboarding` flag in `appStore`. Users who completed old onboarding remain "completed" — they can revisit content from Settings if interested.

### Rollback Plan

Keep the old `OnboardingFlow.tsx` renamed to `OnboardingFlowLegacy.tsx` during development. If issues arise, swap imports in `App.tsx` to revert.

---

## Appendix A: Example RFEM Calculation Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│     YOUR PUSHUP MAX: 15 reps                                    │
│     ════════════════════════                                    │
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐    │
│     │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│    │
│     │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│    │
│     │██████████████████████████████████████████░░░░░░░░░░░│    │
│     │██████████████████████████████████████████░░░░░░░░░░░│    │
│     │██████████████████████████████████████████░░░░░░░░░░░│    │
│     │    Your Target: 12 reps (RFEM 3)        │  Buffer   │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                 │
│     ▓▓▓ = Working reps    ░░░ = Safety buffer (3 reps)         │
│                                                                 │
│     "Train hard, but keep 3 in the tank"                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Appendix B: RFEM Rotation Wave Visual

```
RFEM Value
    5 │         ●                       ●
      │        ╱ ╲                     ╱ ╲
    4 │       ╱   ●                   ╱   ●
      │      ╱     ╲                 ╱
    3 │     ●       ╲               ●
      │              ╲             ╱
    2 │               ●───────────●
      │
      └────────────────────────────────────────
         #1    #2    #3    #4    #5    #6
                    (Workouts)
        
        ▲ Harder sessions          Recovery ▲
```

---

## Appendix C: Comparison Chart Data

**"Training to Failure" vs "RFEM Training" over 12 weeks:**

| Metric | To Failure | RFEM |
|--------|-----------|------|
| Total sets completed | 180 | 240 |
| Missed sessions (fatigue) | 4 | 1 |
| PRs set | 2 | 5 |
| Perceived fatigue (avg) | 8.5/10 | 6/10 |
| Injury events | 1 | 0 |

*(Illustrative data for visual — not scientific claims)*

---

## Next Steps

1. **Review this plan** — confirm scope and approach
2. **Create component scaffolding** — set up file structure
3. **Build foundation** (Phase 1) — shared components
4. **Implement RFEM Guide** (Phase 2) — core content
5. **Implement App Tour** (Phase 3) — feature walkthrough
6. **Integration & polish** (Phase 4-5) — wire everything together
7. **Test thoroughly** (Phase 6) — all user paths

---

*Document created: January 2025*
*Target version: Ascend v2.13.0*
