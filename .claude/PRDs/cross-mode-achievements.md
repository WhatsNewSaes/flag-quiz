# PRD: Cross-Mode Achievement System

## Overview
Expand the achievement system from 9 Journey-only achievements to ~35 achievements spanning all game modes. Add visible progress tracking on the mode select screen to motivate players to engage with every mode.

---

## 1. New Data Layer

### `src/data/globalStats.ts` (new file)
Define `GlobalGameStats` type tracking per-mode lifetime stats:
- **Per mode** (arcade, flagRunner, jeopardy, aroundTheWorld): games played, total correct, best score, best streak, mode-specific fields (combo, earnings, board clears, etc.)
- **Global aggregates**: total flags answered, unique countries correct (stored as string array), total games played, days active (for streaks)
- **Achievements**: `Record<string, number | null>` (id → unlock timestamp) — same pattern as existing journey achievements

Store in localStorage as `global-game-stats` key.

### `src/data/globalAchievements.ts` (new file)
~35 achievement definitions, each with:
- `id`, `name`, `description`, `icon`, `category` (journey/arcade/flag-runner/jeopardy/around-the-world/global)
- `check(ctx)` function returning boolean
- `progressMax` and `progressCurrent(ctx)` for progress bar display

**Achievement list:**

| # | Category | ID | Name | Condition | Progress |
|---|----------|-----|------|-----------|----------|
| 1 | journey | first-steps | First Steps | Complete first level | - |
| 2 | journey | perfect-score | Perfect Score | 100% on any level | - |
| 3 | journey | star-collector-10 | Star Collector | Earn 10 stars | 0/10 |
| 4 | journey | star-collector-30 | Star Hoarder | Earn 30 stars | 0/30 |
| 5 | journey | star-collector-50 | Star Master | Earn 50 stars | 0/50 |
| 6 | journey | world-traveler | World Traveler | One level in every region | 0/5 |
| 7 | journey | all-stars | All Stars | 3 stars on every level | 0/20 |
| 8 | journey | speed-demon | Speed Demon | 5 levels in a row | 0/5 |
| 9 | journey | perfectionist | Perfectionist | 3 stars on 10 levels | 0/10 |
| 10 | arcade | arcade-debut | Arcade Debut | Complete first Arcade game | - |
| 11 | arcade | arcade-veteran | Arcade Veteran | Complete 10 Arcade games | 0/10 |
| 12 | arcade | hot-streak | Hot Streak | 10-flag streak in Arcade | 0/10 |
| 13 | arcade | on-fire | On Fire | 25-flag streak in Arcade | 0/25 |
| 14 | arcade | arcade-ace | Arcade Ace | 100% accuracy in Arcade | - |
| 15 | arcade | point-hunter | Point Hunter | Score 10,000 in one game | 0/10000 |
| 16 | flag-runner | runner-debut | Runner Debut | Play first Flag Runner game | - |
| 17 | flag-runner | combo-king | Combo King | 10x combo | 0/10 |
| 18 | flag-runner | marathon-runner | Marathon Runner | Reach level 10 | 0/10 |
| 19 | flag-runner | high-roller | High Roller | Score 10,000 | 0/10000 |
| 20 | flag-runner | untouchable | Untouchable | Level 5 without losing a life | 0/5 |
| 21 | flag-runner | runner-legend | Runner Legend | Score 25,000 | 0/25000 |
| 22 | jeopardy | jeopardy-debut | Jeopardy Debut | Complete first board | - |
| 23 | jeopardy | daily-double-win | Lucky Double | Win a Daily Double | - |
| 24 | jeopardy | jeopardy-champion | Jeopardy Champion | Score $15,000 on one board | 0/15000 |
| 25 | jeopardy | clean-sweep | Clean Sweep | Clear entire board | - |
| 26 | jeopardy | big-earner | Big Earner | $50,000 lifetime earnings | 0/50000 |
| 27 | around-the-world | globe-trotter | Globe Trotter | Identify 10 countries | 0/10 |
| 28 | around-the-world | continent-master | Continent Master | 100% on one continent | - |
| 29 | around-the-world | world-explorer | World Explorer | 50 unique countries | 0/50 |
| 30 | around-the-world | atlas-pro | Atlas Pro | 100 unique countries | 0/100 |
| 31 | around-the-world | global-citizen | Global Citizen | Answer from every continent | 0/6 |
| 32 | global | multi-mode | Multi-Mode | Play 3+ different modes | 0/3 |
| 33 | global | flag-scholar | Flag Scholar | 500 correct answers total | 0/500 |
| 34 | global | daily-player | Daily Player | Play 7 days in a row | 0/7 |
| 35 | global | flag-encyclopedia | Flag Encyclopedia | 150 unique countries correct | 0/150 |

### `src/hooks/useGlobalStats.ts` (new file)
Core hook managing global stats:
- `stats` — current GlobalGameStats from localStorage
- `recordEvent(event: GameEvent)` — updates per-mode stats + global aggregates
- `checkAchievements()` — returns newly unlocked achievement IDs
- `getProgressForCategory(category)` — returns `{unlocked, total}` for a mode

---

## 2. Event Recording Integration

Add `recordEvent()` calls at end-of-game in each screen. **Do NOT modify game hooks** — emit events at the Screen/Route level.

| File | Trigger | Event Data |
|------|---------|------------|
| `src/screens/ArcadeScreen.tsx` ~line 134 | `phase === 'summary'` | score, correct, total, bestStreak |
| `src/screens/FlagRunnerScreen.tsx` ~line 195 | `phase === 'game-over'` | score, combo, level, livesRemaining |
| `src/screens/JeopardyScreen.tsx` | `gameOver === true` | score, boardCleared, dailyDoubleResult |
| `src/screens/AroundTheWorldScreen.tsx` | summary shown / back pressed | correct, answered, countryCodes, continentStats |
| `src/contexts/GameContext.tsx` ~line 140 | existing journey complete | Forward journey results to globalStats |

---

## 3. UI Changes

### 3a. Mode Select: Per-Mode Achievement Progress
**File: `src/components/GameModeSelect.tsx`**

Add below each mode card's description:
```
[==========-------] 3/6 achievements
```
- Thin (4px) retro-styled progress bar
- `X/Y achievements` in small text
- New component: `src/components/ModeAchievementProgress.tsx`
- Also show a list of next achievable achievements for the mode (name + progress bar) below the mode card description, giving players specific goals

### 3b. Mode Select: Achievement Preview Section
Below each mode card (when expanded/hovered or always visible), show the next 1-2 unfinished achievements with their individual progress:
```
  Next: Hot Streak [=======---] 7/10
        Arcade Ace - Get 100% accuracy
```
This is the main motivator — players see exactly what they can work toward in each mode.

### 3c. Achievements Page Overhaul
**Move from `src/components/journey/AchievementsPage.tsx` → `src/components/AchievementsPage.tsx`**

- Add category filter tabs: All | Journey | Arcade | Flag Runner | Jeopardy | Around the World | Global
- For achievements with `progressMax`: show progress bar + `X/Y` text below description
- Unlocked achievements: gold border, full icon, unlock date
- In-progress achievements (>0%): normal border, icon visible, progress bar
- Locked achievements (0%): grey, ❓ icon

### 3d. NavBar Badge
**File: `src/components/NavBar.tsx`**

Update achievements menu item in profile drawer:
```
🏆 Achievements  12/35
```

### 3e. End-of-Game Achievement Cards
**New component: `src/components/AchievementUnlockCards.tsx`**

When achievements unlock at end of game, show them in the summary screen (all modes). Reuses the retro-window card styling. Each card shows icon, name, "Achievement Unlocked!" label.

Add this component to:
- `ArcadeScreen.tsx` summary phase
- `FlagRunnerScreen.tsx` game-over overlay
- `JeopardySummary.tsx`
- `AroundTheWorldScreen.tsx` summary

---

## 4. Cloud Sync

### Supabase migration
Add column to `user_progress` table:
```sql
ALTER TABLE user_progress ADD COLUMN game_stats JSONB DEFAULT '{}'::jsonb;
```

### SyncContext changes
**File: `src/contexts/SyncContext.tsx`**
- Add `global-game-stats` to watched localStorage keys
- Include `game_stats` in push/pull payloads
- Merge strategy: keep the record with higher `global.totalFlagsAnswered`

---

## 5. Implementation Order

### Step 1: Data layer
- Create `src/data/globalStats.ts` (types + initial state)
- Create `src/data/globalAchievements.ts` (all 35 definitions)
- Create `src/hooks/useGlobalStats.ts` (localStorage + check logic)

### Step 2: Event recording
- Add `useGlobalStats()` to GameContext provider
- Wire `recordEvent()` into each game screen's end-of-game flow
- Verify stats accumulate in localStorage

### Step 3: Mode select UI
- Create `src/components/ModeAchievementProgress.tsx`
- Integrate into `GameModeSelect.tsx` cards
- Show per-mode progress bars + next achievements

### Step 4: Achievements page
- Move and refactor `AchievementsPage.tsx` with category tabs + progress bars
- Update NavBar with achievement count badge

### Step 5: End-of-game displays
- Create `AchievementUnlockCards.tsx`
- Add to all game mode summary screens
- Add achievement toast support for non-journey modes

### Step 6: Cloud sync
- Supabase migration for `game_stats` column
- Update SyncContext push/pull

---

## Files Modified
- `src/components/GameModeSelect.tsx` — add progress badges per mode
- `src/screens/ArcadeScreen.tsx` — record event + show unlocks in summary
- `src/screens/FlagRunnerScreen.tsx` — record event + show unlocks
- `src/screens/AroundTheWorldScreen.tsx` — record event + show unlocks
- `src/screens/JeopardyScreen.tsx` — record event + show unlocks
- `src/components/JeopardySummary.tsx` — show unlocks
- `src/components/journey/AchievementsPage.tsx` → `src/components/AchievementsPage.tsx` — overhaul with tabs + progress
- `src/components/NavBar.tsx` — achievement count in drawer
- `src/contexts/GameContext.tsx` — provide globalStats, forward journey events
- `src/contexts/SyncContext.tsx` — sync game_stats to cloud
- `src/routes/AchievementsRoute.tsx` — use new AchievementsPage

## New Files
- `src/data/globalStats.ts`
- `src/data/globalAchievements.ts`
- `src/hooks/useGlobalStats.ts`
- `src/components/ModeAchievementProgress.tsx`
- `src/components/AchievementUnlockCards.tsx`

## Verification
- Play each game mode, complete a game, verify stats appear in localStorage `global-game-stats`
- Check mode select page shows correct progress bars per mode
- Unlock an achievement in each mode, verify toast + card appears
- Check achievements page shows all 35 with correct progress bars
- Sign in, verify stats sync to Supabase, sign in on another device and confirm sync
