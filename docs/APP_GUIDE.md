# Ascend App Guide

A comprehensive reference for the Ascend workout tracker: how every screen works, what every setting does, and how to get the most out of the app.

Ascend is a Progressive Web App (PWA) and native iOS app for calisthenics and bodyweight strength training. It uses RFEM (Reps From Established Max) methodology for progression tracking with cycle-based periodization. All data lives locally on-device; cloud sync is optional.

---

## Table of Contents

1. [First Launch & Account Setup](#1-first-launch--account-setup)
2. [App Navigation](#2-app-navigation)
3. [Exercises](#3-exercises)
4. [Training Cycles](#4-training-cycles)
5. [Logging Workouts](#5-logging-workouts)
6. [Ad-Hoc Workouts](#6-ad-hoc-workouts)
7. [Schedule & History](#7-schedule--history)
8. [Progress & Stats](#8-progress--stats)
9. [Settings](#9-settings)
10. [Premium Features & Subscriptions](#10-premium-features--subscriptions)
11. [Data & Sync](#11-data--sync)
12. [Gesture & Keyboard Reference](#12-gesture--keyboard-reference)

---

## 1. First Launch & Account Setup

When you open Ascend for the first time, three screens appear in sequence before you reach the main app.

### 1.1 Authentication (Optional)

If cloud sync is configured, the auth gate appears first. You can:

**Sign In** — Enter your email and password. A "Forgot password?" link is available below the form.

**Create Account** — Toggle to sign-up mode. Enter your email and create a password (6+ characters). After submitting:

1. A "Verify your email" screen appears with your address displayed.
2. Open the email from Ascend and tap the verification link.
3. Return to the app and tap **I've Verified My Email**.
4. If the email didn't arrive, tap **Didn't receive email? Resend**.

**Reset Password** — From the sign-in screen, tap "Forgot password?" to enter your email. A reset link is sent, and a confirmation screen shows with a **Back to Sign In** button.

If Supabase is not configured (e.g. running locally without cloud sync), the auth gate is skipped entirely and the app operates in offline-only mode.

### 1.2 Health Disclaimer (Mandatory)

This screen cannot be skipped. It displays three advisory boxes:

| Box | Message |
|-----|---------|
| Consult your doctor | Before starting any new exercise program, especially with existing conditions or injuries. |
| Listen to your body | Stop immediately if you experience pain, dizziness, shortness of breath, or discomfort. |
| You are responsible | For exercising safely, using proper form, and staying within your capabilities. |

A legal notice at the bottom links to the Terms of Service. Tap **I Understand & Agree** to continue.

### 1.3 Onboarding Walkthrough

New users see a guided walkthrough of 9 core slides plus optional extras. A progress bar at the top tracks your position. A **Skip** button appears on every slide except the first.

**Phase 1: Identity & Value (2 slides)**

| Slide | What it shows |
|-------|---------------|
| Identity | "Get stronger with intelligent periodization" — motivational introduction to calisthenics training. |
| Value Proposition | Key differentiators of Ascend: RFEM methodology, offline-first, cycle-based planning. |

**Phase 2: Experience Preview (4 slides)**

| Slide | What it shows |
|-------|---------------|
| Day in Life | What a typical training day looks like in Ascend. |
| Swipe to Complete | Interactive demo — you must physically swipe right on a sample set card to proceed. |
| Swipe to Skip | Demonstrates swiping left to skip a set. |
| Tap to Edit | Demonstrates tapping a set card to open the detail editor. |

**Phase 3: Quick Start (3 slides)**

| Slide | What it shows |
|-------|---------------|
| First Exercise | Create your first exercise. Suggestion chips offer common exercises (Push Ups, Pull Ups, Dips, etc.) or you can type a custom name. You also select the exercise type (Push, Pull, Legs, Core, Other). |
| Record Max | Optionally enter your current max reps for the exercise you just created. You can leave this blank and set it later. |
| Success | Confirms your exercise was created and shows the max you recorded (if any). |

**Phase 4: App Tour (4 slides)**

A walkthrough of the five main tabs: Today, Schedule, Exercises, Progress, and Settings.

**Phase 5: RFEM Deep Dive (3 optional slides)**

Accessible from the App Tour. Explains the RFEM methodology in detail: how target reps are calculated from your max, how RFEM rotation values work, and why periodization matters.

After completing or skipping the onboarding, you land on the **Today** page.

---

## 2. App Navigation

### 2.1 Bottom Tab Bar

A fixed tab bar at the bottom of the screen provides access to the five main sections:

| Tab | Icon | Page |
|-----|------|------|
| Today | Dumbbell | Today's workout and set logging |
| Schedule | Calendar | Full cycle schedule, list or calendar view |
| Exercises | ListChecks | Exercise library with search and filtering |
| Progress | BarChart3 | Training analytics and volume stats |
| Settings | Settings gear | Preferences, account, data management |

The active tab is highlighted in the app's primary color.

### 2.2 Page Headers

Each page has a sticky header at the top with:
- A bold title on the left.
- An optional subtitle (e.g. current date, exercise count, cycle name).
- An optional action button on the right (e.g. "+ Add", "+ Log").
- Detail pages show a back arrow to return to the parent page.

### 2.3 Modals

Actions like creating exercises, editing cycles, logging sets, and confirming deletions happen in modal overlays. Modals have a title bar with a close (X) button and can be dismissed by tapping the backdrop. Wizard-style modals (cycle creation, max testing) are full-height and have their own internal navigation.

---

## 3. Exercises

### 3.1 The Exercises Page

The Exercises tab shows your complete exercise library.

**Search** — A search bar at the top filters exercises by name as you type.

**Type Filter Chips** — A row of filter buttons below the search bar:
- **All** — Groups exercises by type, sorted alphabetically within each group.
- **Push**, **Pull**, **Legs**, **Core**, **Balance**, **Mobility**, **Other** — Shows only exercises of that type. Each chip displays a count.

**Exercise Cards** — Each card shows the exercise name, a colored type badge, and the latest max record (if any). Tap a card to open the exercise detail page. Tap the **+ Add** button in the header to create a new exercise.

### 3.2 Creating an Exercise

The exercise creation form has the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Exercise Name | Text | Yes | e.g. "Ring Rows", "Planche Push Ups" |
| Type | Dropdown | Yes | Push, Pull, Legs, Core, Balance, Mobility, or Other. Determines which weekly set goal the exercise counts toward. |
| Measurement | Dropdown | Yes | **Reps** (counted repetitions) or **Time** (duration in seconds, entered as MM:SS). |
| Mode | Dropdown | Yes | See "Exercise Modes" below. |
| Track Added Weight | Toggle | No | Enable to track weight added via vest, barbell, dip belt, etc. Reveals a "Default Weight" field. |
| Default Weight | Number | No | Pre-filled weight value (in your preferred unit) when logging sets. |
| Initial Max Reps | Number | No | Only shown when creating a new standard/reps exercise. Sets the initial max record. Can be left blank. |
| Initial Max Time | Time (MM:SS) | No | Only shown when creating a new standard/time exercise. |
| Base Reps | Number | No | Only shown for conditioning/reps exercises. The starting rep count. |
| Base Time | Time (MM:SS) | No | Only shown for conditioning/time exercises. The starting duration. |
| Notes | Text area | No | Form cues, variations, equipment notes. |
| Custom Parameters | List | No | See "Custom Parameters" below. |

**Exercise Modes**

| Mode | Label (Reps) | Label (Time) | Behavior |
|------|-------------|-------------|----------|
| Standard | "Standard (RFEM or simple progression)" | "Progressive (% of max time)" | Uses a max record to calculate target reps/time. The foundation for RFEM and simple progression cycles. |
| Conditioning | "Conditioning (consistent reps)" | "Fixed (set time + weekly increment)" | Maintains a consistent baseline that increments weekly. Used for exercises like planks or bear crawls where you hold a fixed output and gradually increase. |

**Custom Parameters**

Custom parameters let you track exercise-specific variables alongside each set (e.g. strap length, band resistance, grip width).

To add a parameter, tap **+ Add** under the Custom Parameters section. Each parameter has:
- **Name** — The label (e.g. "Band Color").
- **Type** — Text, Number, or Select.
  - **Select** type reveals an options field where you enter comma-separated values (e.g. "3 holes, 4 holes, 5 holes").
- **Default Value** — Optional pre-filled value.

### 3.3 Exercise Detail Page

Navigate here by tapping an exercise card on the Exercises page. The URL is `/exercises/:id`.

**Header** — Exercise name with **Edit** and **Delete** buttons.

**Info Card** — Displays type badge, conditioning badge (if applicable), +Weight badge (if weight tracking is enabled), and notes.

**Stats Card** — Three columns:
- Current Max (or Base Reps/Time for conditioning exercises).
- Total Sets logged.
- Total Reps or Total Time.

Stats are filtered by the selected timeframe: This Week, This Cycle, or All Time (configurable in Settings).

**Record New Max** — Button appears for standard-mode exercises. Opens a form to enter new max reps (or time), optional weight, and notes. Creates a new max record.

**Prior Maxes** — Chronological list of all max records for this exercise, showing date, value, weight, and notes.

**Exercise History** — All completed sets for this exercise, sorted by date.

### 3.4 Editing and Deleting

- **Edit**: Tap the Edit button on the exercise detail page to open the exercise form with current values pre-filled. All fields except Initial Max are editable.
- **Delete**: Tap the Delete button. A confirmation modal warns that historical data (completed sets, max records) associated with this exercise will also be deleted.

---

## 4. Training Cycles

### 4.1 What is a Cycle?

A cycle is a structured training block — typically 1 to 12 weeks — that organizes your exercises into groups, defines how often you train, and determines how your targets progress over time. When a cycle ends, you can test new maxes and start a fresh cycle with updated baselines.

### 4.2 Cycle Types

When you tap **Create New Cycle** (from the Today page or Schedule page), a type selector appears with four options:

| Type | Access | Description |
|------|--------|-------------|
| **RFEM Training Cycle** | All users | Periodized progression based on your max reps. Targets are calculated automatically using RFEM rotation values. |
| **Max Rep Testing** | All users | A 1-week cycle for establishing or re-testing your maximum reps/time. Includes warmup sets and records new maxes automatically. |
| **Simple Progression Cycle** | Advanced | Set fixed rep/time targets per exercise with optional linear increments each workout or week. |
| **Mixed Cycle** | Advanced | Configure RFEM or Simple progression independently for each exercise. Best for combining different approaches. |

Simple Progression and Mixed cycles require the Advanced app mode (see [Premium Features](#10-premium-features--subscriptions)).

### 4.3 Progression Modes Explained

#### RFEM (Reps From Established Max)

Your target reps for each workout are calculated as:

```
Target Reps = Max Reps - RFEM Value
```

RFEM values rotate through a configurable sequence. For example, with a max of 20 reps and an RFEM rotation of [3, 4, 5, 4]:

| Workout | RFEM | Target |
|---------|------|--------|
| 1 | 3 | 17 |
| 2 | 4 | 16 |
| 3 | 5 | 15 |
| 4 | 4 | 16 |
| 5 | 3 | 17 |
| ... | (repeats) | ... |

Lower RFEM values mean harder workouts (closer to your max). The rotation creates built-in periodization.

#### Simple Progression

You define a fixed starting target and optionally increment it:

- **Base Reps/Time**: Your starting target (e.g. 10 reps).
- **Progression Type**: Constant (no change), Per Workout (add after each workout), or Per Week (add each week).
- **Increment**: How many reps/seconds to add (e.g. +1 rep per week).
- **Weight Progression**: For weighted exercises, separate base weight and weight increment settings.

Example with base 10 reps, +2 per week over 4 weeks: 10, 12, 14, 16.

#### Mixed Mode

Each exercise is individually configured as either RFEM or Simple. RFEM exercises use the cycle's global RFEM rotation. Simple exercises have their own base, progression type, and increment. This lets you use max-based progression for some exercises and linear progression for others in the same cycle.

### 4.4 Creating a Training Cycle (RFEM, Simple, or Mixed)

The training cycle wizard walks through 7 steps. Navigation buttons at the bottom move between steps, and a progress indicator at the top shows your position.

#### Step 1: Start

Choose how to begin:

- **Start Fresh** — Empty configuration.
- **Clone from Previous Cycle** — Select from your last 5 completed cycles. The cloned cycle pre-fills all settings (groups, exercises, goals, rotation) which you can then modify.

Each cloneable cycle card shows the cycle name, number of weeks, days per week, number of groups, and creation date.

#### Step 2: Schedule Mode

Choose how workouts are scheduled:

- **Fixed Days** — Select specific days of the week (e.g. Mon/Wed/Fri). Workouts appear on those calendar dates. If you miss a day, it shows as overdue.
- **Flexible** — Complete workouts in whatever order and pace you choose. No calendar dates; just a sequence of workouts to get through.

#### Step 3: Schedule

Configure the cycle timing:

| Field | Description |
|-------|-------------|
| **Cycle Name** | A label for this cycle (e.g. "Winter 2026 Block 1"). |
| **Selected Days** | (Fixed Days mode only) Tap day-of-week buttons (S M T W T F S) to select training days. |
| **Workouts Per Week** | (Flexible mode only) Select 1-7 via a wheel picker. |
| **Number of Weeks** | Select 1-12 via a wheel picker. |

A summary line shows the total: "X total workouts - Y per week for Z weeks". In Fixed Days mode, a preview of the first 6 scheduled workout dates is shown.

#### Step 4: Groups

Define exercise groups. Each group is a collection of exercises that are performed together in a single workout.

For each group:
- **Group Name** — Editable text field (e.g. "Push Day", "Upper Body A").
- **Add Exercises** — Opens a modal listing all your exercises organized by type. Tap to add.
- **Remove Exercises** — Tap the trash icon next to any exercise.
- **Conditioning Exercises** — When a conditioning exercise is added, a base reps/time input appears so you can set the starting value for this cycle.

Tap **+ Add Group** to create additional groups. Groups can be deleted if more than one exists.

**Mixed Mode Only**: Each exercise in a group shows an inline configuration panel:
- A toggle to choose **RFEM** or **Simple** progression for that exercise.
- If Simple: base reps/time, progression type, increment, and optional weight settings.
- A warmup toggle per exercise.

#### Step 5: Progression (Simple Mode Only)

This step appears only for Simple Progression cycles. For each exercise in each group:

| Field | Description |
|-------|-------------|
| Base Reps/Time | The starting target value. |
| Progression Type | Constant, Per Workout, or Per Week. |
| Increment | Reps/seconds to add (disabled if Constant). |
| Base Weight | (Weighted exercises) Starting weight. |
| Weight Progression | Constant, Per Workout, or Per Week. |
| Weight Increment | Weight to add per interval. |

A preview shows the projected targets for Weeks 1 through 4.

#### Step 6: Goals

Configure rotation patterns and training targets.

**Weekly Set Goals** — Set the number of sets you want to complete per exercise type per week:
- Grid of number inputs for Push, Pull, Legs, Core, Balance, and Mobility.
- These goals are used for progress tracking, not strict enforcement.

**Group Rotation** — Define the order in which groups rotate across workout days. If you have 2 groups (A and B) and train 3 days per week, a rotation of [A, B] repeats as A, B, A, B, A, B...
- Add or remove rotation entries.
- Minimum one entry required.

**RFEM Rotation** (RFEM and Mixed modes) — The sequence of RFEM values that cycle through workouts:
- Default: [3, 4, 5, 4].
- Each value can be 0-20.
- Add or remove values. Minimum one required.
- The sequence repeats when exhausted.

**Conditioning Weekly Increment** (RFEM mode only) — How many reps to add each week for conditioning exercises. In Mixed mode, this is configured per-exercise in the Groups step.

**Warmup Sets** (RFEM and Simple modes) — Two checkboxes:
- **Include warmup sets** — Generates 2 warmup sets at 20% and 40% of max intensity before working sets.
- **Include time-based warmups** — (Only appears if warmups are enabled) Also generates warmups for time-based exercises.

In Mixed mode, warmup toggles appear per-exercise in the Groups step instead.

#### Step 7: Review

A read-only summary of the entire cycle configuration:
- Cycle name, duration, workouts per week, total workouts.
- Groups with their exercises listed.
- Weekly set goals shown as colored badges.
- First-week workout preview showing which group and RFEM value for each day.
- For Simple mode: per-exercise target preview (Week 1 through Week 4).
- For Mixed mode: exercises categorized by progression mode (RFEM, Simple, Conditioning).
- Validation errors (red) and warnings (yellow) if any configuration issues are detected.

Tap **Create Cycle** to save. If editing an existing cycle that has completed workouts, a modal asks whether to **Continue** (preserve progress) or **Restart** (reset all workouts to pending).

### 4.5 Creating a Max Testing Cycle

The Max Testing wizard has 3-4 steps depending on whether conditioning exercises are included.

#### Step 1: Select Exercises

- **From a completed cycle**: All exercises from that cycle are listed and pre-selected. Conditioning exercises are labeled with an amber "Conditioning" badge.
- **Standalone**: All standard-mode exercises are listed, none pre-selected.

Each exercise row shows:
- Checkbox (tap to include/exclude).
- Exercise name.
- Group name (or exercise type if standalone).
- Previous max reps (or "Not set").

An **Add Other Exercises** button (if from a completed cycle) opens a modal to include additional standard exercises not in the original cycle.

At least one standard exercise must be selected to proceed.

#### Step 2: Schedule + Warmup

Same schedule mode choice as training cycles (Fixed Days or Flexible).

Below the schedule selector:
- **Include warmup sets** checkbox — When enabled, adds 3 warmup sets at 20%, 30%, and 40% of your previous max before the max attempt for each exercise.

#### Step 3: Conditioning Baselines (Conditional)

This step only appears if conditioning exercises were selected. For each conditioning exercise:
- The exercise name and previous baseline.
- Plus/minus buttons and a number input to adjust the new baseline.
- These updated baselines will be used as starting points in your next training cycle.

#### Step 4: Review

Summary showing:
- Number of standard exercises and testing days needed.
- For each standard exercise: warmup reps at each percentage, then "Max attempt".
- For each conditioning exercise: previous baseline and new baseline.

The app automatically groups exercises by type to avoid testing two exercises of the same type on the same day. Day names are "Max Test" (if 1 day) or "Max Test Day 1", "Max Test Day 2", etc.

Tap **Start Max Testing** to create the cycle.

### 4.6 Editing and Managing Cycles

- Training cycles can be edited by tapping **Edit Cycle** on the Schedule page. This re-opens the wizard with current values pre-filled, starting at the Schedule Mode step.
- Max testing cycles cannot be edited after creation.
- Only one cycle can be active at a time. Creating a new cycle automatically completes the previous active cycle.

---

## 5. Logging Workouts

### 5.1 The Today Page

The Today tab is your daily training hub. What appears depends on your current state:

**No active cycle** — An empty state with a call-to-action to create your first cycle.

**Active cycle, no workout today** — Today's stats (sets completed, reps, exercises) and a **Log Ad-Hoc Workout** button.

**Active workout** — The full workout card:
- **Cycle Progress Header** — Shows the active cycle name and a progress bar (e.g. "5/12 workouts done").
- **Workout Header** — Group name, total set count, and scheduled date (if date-based scheduling).
- **Scheduled Sets** — The main list of sets to complete (see below).
- **Completed Sets** — Collapsible section showing sets already logged, with green (completed) or orange (skipped) backgrounds. Tap any completed set to edit it.
- **Today's Stats** — Total sets, total reps, unique exercises for the day.

**Completed workout** — A green "Workout Complete!" banner with a **Continue to Next** button.

**Cycle complete** — A completion card with buttons to **Test New Maxes** or **Create New Cycle**.

### 5.2 Scheduled Set Cards

Each scheduled set appears as a swipeable card. The card shows:
- Exercise name.
- Target reps (or target time in MM:SS for time-based exercises).
- Target weight (if the exercise tracks weight).
- **Warmup XX%** badge (yellow) for warmup sets.
- **Max Test** badge (blue) for max testing sets.
- **cond** label for conditioning exercises.

**Interactions**:

| Action | How | Result |
|--------|-----|--------|
| Quick-complete | Swipe the card to the right | Logs the set at the target reps/weight instantly. |
| Skip | Swipe the card to the left | Marks the set as skipped (orange). |
| Edit details | Tap the card | Opens the set logging modal for custom values. |

Visual feedback during swipe: green background with checkmark (right), orange background with X (left).

On the first set of your first workout, a hint appears: "Swipe right to complete - Swipe left to skip - Tap to edit details".

### 5.3 The Set Logging Modal

When you tap a scheduled set card, a modal opens with inputs specific to the exercise type:

**Rep-based exercises**:
- Target display at top (e.g. "Target: 12 reps @ 135 lbs").
- Reps input (number field).
- Weight input (if weight tracking enabled, pre-filled with default or suggested weight).
- Custom parameter fields (if the exercise has custom parameters).
- Notes text field.

**Time-based exercises (regular sets)**:
- An exercise timer component.
- Time achieved input (MM:SS format).
- Same weight, custom parameter, and notes fields.

**Time-based exercises (max tests)**:
- A stopwatch component with a large Play button.
- Time achieved input after stopping.

**Max test indicator**: When logging a max test set, a "Max Test" label appears prominently. The modal shows "Previous: X reps" for context.

### 5.4 Warmup Sets

Warmup sets are auto-generated when enabled in the cycle configuration.

**Training cycles**: 2 warmup sets at 20% and 40% of your max for each exercise.

**Max testing cycles**: 3 warmup sets at 20%, 30%, and 40% of your previous max.

Warmup sets display a yellow "Warmup XX%" badge. The rest timer runs at half the normal duration after completing a warmup set.

A reminder banner appears at the top of max testing workouts: "Warm up first! Before attempting each max test, do 2-3 lighter warmup sets to prepare the movement pattern."

### 5.5 Rest Timer

After completing a set (if enabled in Settings), a rest timer modal appears automatically.

**Display**: A large circular progress ring with the remaining time in MM:SS format. The ring is blue when running, orange when under 10 seconds, and green when complete.

**Status text**: "Rest" when running, "Paused" when paused, "Done!" when finished.

**Controls**:

| Button | Action |
|--------|--------|
| Pause / Resume | Toggle the countdown. |
| Reset | Return to the initial duration. |
| -15s | Subtract 15 seconds. |
| +15s | Add 15 seconds. |
| +30s | Add 30 seconds. |
| Done / Skip | Close the timer. |

**Audio**: Countdown beeps play during the last 3 seconds. A completion sound plays when the timer reaches zero. Volume is configurable in Settings (0-100%).

**Special durations**:
- Warmup sets use 50% of the default rest duration.
- Max testing has its own separate rest timer duration (configurable in Settings).

### 5.6 Completing a Workout

As you log sets, they move from the scheduled list to the completed list. You can:

- **Complete naturally** — Log all scheduled sets. The workout automatically shows the completion banner.
- **End early** — Tap the **End Workout** button. Remaining sets are skipped and the workout is marked complete.
- **Skip sets** — Swipe individual sets left to skip them.

After completing a workout, the Today page shows a **Continue to Next** button to advance to the next workout in the cycle.

### 5.7 Overdue Workouts

In date-based scheduling mode, if a workout's scheduled date has passed without completion, an overdue banner appears at the top of the Today page. Tapping it lets you choose to complete it now or skip it.

### 5.8 Rest Days

In date-based scheduling mode, if today is not a scheduled training day, a rest day card appears with a **Work Out Anyway** option to start an ad-hoc workout.

### 5.9 Cycle Completion

When all workouts in a cycle are done, a cycle completion card appears with two options:

- **Test New Maxes** — Opens the Max Testing wizard pre-populated with exercises from the completed cycle.
- **Create New Cycle** — Opens the cycle type selector to start a fresh cycle.

---

## 6. Ad-Hoc Workouts

Ad-hoc workouts let you log training outside your scheduled cycle.

### Creating an Ad-Hoc Workout

Tap **Log Ad-Hoc Workout** from the Today page or the Schedule page. This creates a new ad-hoc workout named "Ad Hoc Workout 1" (incrementing for subsequent ones).

### Logging Sets

1. Tap **Log a Set** to open the exercise picker.
2. Select an exercise from your library.
3. Enter reps/time, weight, and notes in the quick log form.
4. The set appears in the workout's logged sets list.
5. Repeat for additional exercises.

### Managing

- **Rename** — Tap the pencil icon in the workout header to change the name.
- **Complete** — Tap **Complete Workout** when finished.
- **Cancel** — Tap the red **Cancel Workout** button (with confirmation) to discard.

Ad-hoc workouts appear in the Schedule and Progress pages alongside cycle workouts.

---

## 7. Schedule & History

### 7.1 The Schedule Page

The Schedule tab shows all workouts in the active cycle. The header displays the cycle name and progress (e.g. "8/12 done").

**Action buttons** at the top:
- **+ Create New Cycle** — Opens the cycle type selector.
- **Edit Cycle** — Re-opens the cycle wizard for the active training cycle (not available for max testing cycles).
- **Log Ad-Hoc Workout** — Creates a new ad-hoc workout.

### 7.2 List View (Default)

**Cycle Progress Card** — A progress bar showing current week and completion percentage.

**Upcoming Workouts** — Ordered by sequence number. Each card shows:
- Workout number (e.g. #7).
- **NEXT** badge (green ring) on the first pending workout.
- Week number and RFEM value.
- Exercise breakdown by type (e.g. "Push: 3, Pull: 2").
- Swipe left to delete an upcoming workout.
- Tap to open the **Workout Preview Modal**.

**Completed Workouts** — Sorted by completion date (newest first). Tap to view full history of logged sets.

**Skipped Workouts** — Listed in reverse sequence order.

### 7.3 Calendar View

Toggle to calendar view using the **Calendar** button. The monthly calendar shows:

| Dot Color | Meaning |
|-----------|---------|
| Green | Completed workout. |
| Yellow | Partially completed workout. |
| Gray | Pending or rest day. |

Tap any date to see all workouts for that day.

### 7.4 Workout Preview Modal

Opens when you tap an upcoming workout card. Shows:
- Workout number, group name, week, and RFEM value.
- Total set count.
- All exercises grouped by type with target reps, time, and weight.
- **Start Workout** button (for the next pending workout).
- **Delete Workout** button (red, at the bottom).

### 7.5 Workout History Modal

Opens when you tap a completed workout card. Shows every logged set with:
- Exercise name.
- Reps/time achieved.
- Weight used.
- Whether it was completed or skipped.
- Any notes.

---

## 8. Progress & Stats

### 8.1 Time Period Selector

A dropdown at the top-right of the Progress page controls the timeframe for all statistics:

| Period | Scope |
|--------|-------|
| This Week | Monday through Sunday of the current week. |
| This Cycle | From the active cycle's start date to today. |
| All Time | All recorded history. |

This default can also be changed in Settings (see Section 9).

### 8.2 Sets by Day Chart

A bar chart showing sets completed each day for the last 30 days. Days of the week are labeled along the bottom. Bar height represents set count.

### 8.3 Overview Stats

A grid showing aggregate numbers for the selected period:

| Stat | Description |
|------|-------------|
| Total Sets | Number of sets completed. |
| Total Reps | Sum of all reps logged. |
| Total Time | Sum of all time-based exercise durations (if applicable). |
| Workout Days | Number of distinct days with at least one set logged. |
| Unique Exercises | Number of different exercises performed. |

### 8.4 Sets by Type

Horizontal bar charts showing the distribution of sets across exercise types (Push, Pull, Legs, Core, Balance, Mobility). Each bar shows the count on the right.

### 8.5 Totals by Exercise

A grouped list showing per-exercise totals (reps or duration) and set counts, organized by exercise type.

---

## 9. Settings

### 9.1 Account & Sync

| Setting | Description |
|---------|-------------|
| Email display | Shows the email of the signed-in user. |
| Sync status | Online or Offline indicator. |
| Manual sync | Button to trigger an immediate sync. |
| Sign out | Logs you out. Data remains on-device. |
| Change password | Opens a password change modal. |

If not signed in, a **Sign In** button opens the auth modal.

### 9.2 Appearance

**Theme** — Three options as visual buttons:
- **Light** (Sun icon) — Light backgrounds, dark text.
- **Dark** (Moon icon) — Dark backgrounds (#121212), light text.
- **System** (Monitor icon) — Follows your device setting.

**App Mode** — Two radio-style options:
- **Standard** — RFEM-based training and max testing cycles only.
- **Advanced** — All cycle types including Simple Progression and Mixed. Requires an Advanced subscription or active trial. Shows a lock icon and "Upgrade" badge if not accessible.

**Font Size** — Four options in a 2x2 grid:
- **Small**, **Default**, **Large**, **XL**. Each button shows a sample "Aa" at the corresponding size.

### 9.3 Training Defaults

**Default Values**:

| Setting | Description |
|---------|-------------|
| Default Max (RFEM) | The max reps assumed when an exercise has no recorded max. Used for RFEM target calculations. |
| Default Reps (Conditioning) | Starting rep count for new conditioning exercises. |
| Weekly Rep Increase (Conditioning) | Default number of reps to add each week for conditioning exercises. |
| Default Weekly Sets per Type | Number inputs for Push, Pull, Legs, Core, Balance, and Mobility. Pre-fills the weekly set goals when creating new cycles. |

**Display Settings**:

| Setting | Options | Description |
|---------|---------|-------------|
| Progress Totals Timeframe | This Week / This Cycle / All Time | Controls the default timeframe for stats on the Progress tab and exercise detail pages. |

### 9.4 Rest Timer

| Setting | Description |
|---------|-------------|
| Enable rest timer | Toggle. When on, a rest timer appears after each completed set. |
| Default rest duration | Time picker (10 seconds to 10 minutes). |
| Max testing rest timer | Separate toggle for max testing workouts. |
| Default max test rest duration | Time picker (30 seconds to 15 minutes). |
| Timer Sound volume | Slider (0-100%). Controls volume of countdown beeps and completion sounds relative to system volume. Includes a mute button and a "Test" button to preview the sound. |

### 9.5 Help & About

- **Quick Start Guide** — Re-opens the onboarding walkthrough.
- **About** — App version and links.

### 9.6 Subscription

- **Trial Banner** — Shows when a free trial is active or has expired without a purchase.
- **Subscription status** — Displays current purchase tier.
- **Restore Purchases** — Button for restoring iOS App Store purchases.

### 9.7 Data Management

| Action | Description |
|--------|-------------|
| **Export Backup** | Downloads a JSON file named `workout-backup-YYYY-MM-DD.json` containing all app data (exercises, max records, cycles, workouts, completed sets). |
| **Import Backup** | Opens a file picker to select a previously exported JSON file. Restores all data from the backup. |
| **Clear Workout History** | Deletes all cycles, scheduled workouts, and completed sets. Preserves exercises and max records. Requires confirmation. |
| **Clear All App Data** | Deletes everything (exercises, max records, cycles, workouts, sets). Requires confirmation. |
| **Delete Account and All Data** | (Only when signed in) Deletes the user account and all associated data from both the device and the cloud. Requires confirmation. |

---

## 10. Premium Features & Subscriptions

### 10.1 Tiers

| Feature | Standard (Free) | Advanced |
|---------|-----------------|----------|
| RFEM Training Cycles | Yes | Yes |
| Max Rep Testing Cycles | Yes | Yes |
| Cloud Sync | Yes | Yes |
| Progress Tracking | Yes | Yes |
| Ad-Hoc Workouts | Yes | Yes |
| Simple Progression Cycles | No | Yes |
| Mixed Mode Cycles | No | Yes |

### 10.2 Free Trial

A 4-week free trial grants access to all Advanced features. The trial can be activated at any time from the Settings page or when attempting to access a locked feature. A trial banner in Settings shows the remaining days.

### 10.3 Purchase Flow

Subscriptions are handled through the iOS App Store via RevenueCat. The paywall modal appears when:
- Tapping a locked cycle type (Simple Progression or Mixed).
- Trying to switch to Advanced app mode without an active subscription.

---

## 11. Data & Sync

### 11.1 Offline-First Architecture

All data is stored locally in the browser's IndexedDB database via Dexie.js. The app works fully offline after the initial load. No internet connection is required to:
- Create exercises and record maxes.
- Create and manage cycles.
- Log workouts and sets.
- View progress and history.

### 11.2 Cloud Sync

When signed in, data syncs between the device and Supabase (PostgreSQL):

- **Automatic sync** — Runs in the background every 5 minutes when online.
- **Manual sync** — Tap the sync button in Settings to trigger immediately.
- **Conflict resolution** — Uses last-write-wins. The most recently modified version of each record is kept.
- **Offline queue** — Changes made while offline are queued and synced automatically when connectivity returns, with exponential backoff retry.

### 11.3 Export & Import

The backup format is a JSON file containing all tables (exercises, max records, cycles, scheduled workouts, completed sets). Export and import are available in Settings > Data Management, independent of cloud sync.

---

## 12. Gesture & Keyboard Reference

### Touch Gestures

| Gesture | Context | Action |
|---------|---------|--------|
| Swipe right | Scheduled set card | Quick-complete the set at target reps. |
| Swipe left | Scheduled set card | Skip the set. |
| Tap | Scheduled set card | Open the detail logging modal. |
| Swipe left | Upcoming workout card (Schedule) | Delete the workout. |
| Tap | Any date (Calendar view) | Show workouts for that date. |

### Keyboard Shortcuts

| Key | Context | Action |
|-----|---------|--------|
| Enter / Space | Scheduled set card (focused) | Open the detail logging modal. |
| Right Arrow | Scheduled set card (focused) | Quick-complete the set. |
| Left Arrow | Scheduled set card (focused) | Skip the set. |

---

*Ascend is part of the BetterDays suite of personal development tools.*
