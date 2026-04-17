---
name: Leaderboards
description: Global per-mode leaderboards with anonymous participation, claim-on-signup, and country boards. Extends existing Supabase scaffolding in `useLeaderboard.ts`. Includes mock-data plan so each board is testable before going live.
type: PRD
status: active
---

# Leaderboards — PRD

## Goal

Every competitive game mode gets a global leaderboard that anonymous players can participate in immediately, with the option to claim their history by creating an account later. Leaderboards are surfaced at the moments players are already asking "how did I do?" — not as a permanent fixture that crowds the UI. Each board should be testable end-to-end with mock data before any production deploy.

## Scope

**In** — Global all-time + monthly + daily boards for:
- **Arcade Standard** (multiple-choice + flag-picker)
- **Arcade Hardcore** (type-ahead)
- **Around the World** (complete-the-world speed challenge)
- **Jeopardy Standard** (pick-the-name + pick-the-flag)
- **Jeopardy Hardcore** (type-ahead)
- **Flag Runner** (endless runner)

Six boards total, across four modes. The structure is symmetric: every mode with a type-ahead variant splits into Standard (recognition) + Hardcore (recall); modes without one get a single board. Anonymous-by-default participation with a device UUID + auto-generated handle. Account creation merges device history. Country/regional boards layered on top of each global board. End-of-run summary rank line, lobby "today's top" line, and a single `/leaderboards` page.

**Out**
- **Journey Mode** — progression/collection experience, not a skill-ranked competition. No board.
- **Presentation Mode** — communal use, not skill-based. No board.
- Friends-only / social leaderboards — defer.
- Skill-rated matchmaking / Elo — defer.
- Ranked/Unranked badge UX — *removed*. Filter changes are free; the score formula handles fairness natively (see "Session shape + anti-grind" below).
- Daily Challenge as its own *new* mode — defer; daily period on existing modes is the first step.

## Decisions (confirmed)

1. **Boards split by discipline, not by filter combo.** Within a board, all filter settings (continents, difficulties, Jeopardy's distractor tier) are free to change — scoring handles fairness through multipliers. Boards only split when the *kind of skill* is different: recognition (multiple-choice, pick-the-flag) vs. recall (type-ahead). Every mode that offers both gets a Standard + Hardcore split; modes without a type-ahead variant stay as a single board.
2. **Session = one-shot.** Every ranked run plays through its pool to completion, then submits. Best-of upsert — only your top single-session score counts. No accumulation across sessions.
3. **Score formula combines volume + skill signals** so easy filters can't outscore hard filters through grinding. Difficulty base × streak multiplier × speed multiplier, across a finite pool. Small easy pool = small ceiling; full hard pool with streaks + speed = large ceiling. The gap is enormous on purpose.
4. **Anonymous participation on the global board** — scores submit immediately under an auto-generated handle. No visual distinction between anonymous and claimed entries. Sign-up is a *claim* action, never a gate.
5. **Three time horizons** per board: `all_time`, `monthly`, `daily`. Existing schema has `all_time` + `monthly`; add `daily`.
6. **Country boards layered on top** — every global board has a sibling "in your country" view. Country is self-reported on first run (cheap viral hook, low cheat impact).
7. **Trust the score, not the identity** — anti-cheat lives in score validation (rate limits, plausibility checks, deterministic seeds for daily) since anonymous identities are recyclable.
8. **Show your rank, not the top 10** — every leaderboard surface leads with the player's rank + percentile, then top 5, then ±2 around the player.
9. **Mock-data first** — every board has a seed script that fills realistic leaderboard data so we can test all surfaces (rank line, lobby teaser, `/leaderboards`) before letting real submissions in.

## Session shape + anti-grind philosophy

All ranked boards use **per-session best-of upsert**: your top single-session score is the only thing stored per board. Grinding many sessions doesn't accumulate.

Within a session, the score formula is designed so that *skill signals scale faster than volume signals*. Two things make this work:

1. **Finite pool per session** — whatever filters the player picks, the session plays through that pool once and ends. Easy+Africa = ~10 flags, game over. All-continents-all-difficulties = ~197 flags. The pool size itself caps the volume component.
2. **Multiplicative skill bonuses on every correct answer**:
   - **Difficulty base points** (already in `useArcade.ts:49`): `basePoints = difficulty × 100`.
   - **Streak multiplier** (already in `useArcade.ts:42`): ×1.0 → ×1.5 → ×2.0 → ×3.0 at 0 / 3+ / 5+ / 10+ streak.
   - **Speed multiplier** (new): answer in ≤4 seconds → ×1.25, else ×1.0. Same threshold across modes for consistency.

Net effect: the player who plays the full pool at hard difficulty with a sustained streak and fast recognition scores an order of magnitude higher than the player who picks the easy subset and grinds. *Choosing* the hardest ranked config becomes the optimal strategy, not a required one.

## What already exists (to extend, not rebuild)

- `src/hooks/useLeaderboard.ts` — Supabase RPC + upsert flow for all-time + monthly. Currently **gated on `if (!user) return`** — this is the central thing we change.
- `src/contexts/AuthContext.tsx` — auth + user object.
- Supabase tables: `leaderboard_scores`, `leaderboard_monthly`. RPCs: `get_leaderboard`, `get_monthly_leaderboard`, `get_user_rank`.
- Existing mode enum: `'journey' | 'campaign' | 'jeopardy' | 'around_the_world'`. Replace with per-board tokens (see below).

### Board token inventory (replaces existing enum)

```ts
type LeaderboardBoard =
  | 'arcade_standard'       // multiple-choice + flag-picker
  | 'arcade_hardcore'       // type-ahead
  | 'around_the_world'
  | 'jeopardy_standard'     // pick-the-name + pick-the-flag
  | 'jeopardy_hardcore'     // type-ahead
  | 'flag_runner'
```

Migration in Phase 1: archive any existing `'campaign'` / `'journey'` rows (Journey is out of scope). Any existing `'jeopardy'` rows migrate to `'jeopardy_standard'` or `'jeopardy_hardcore'` based on `quiz_mode` in their metadata (drop rows where metadata is missing — small population).

## Per-board spec

Every board submits a single canonical `score` field (sortable integer) plus a `metadata` JSON blob capturing the run shape so the UI can render context. The `metadata` is *displayed*, never used to filter rankings — the board is unified.

### 1. Arcade Standard — `board: 'arcade_standard'`

Recognition-based play. Covers both `multiple-choice` (flag shown, pick name) and `flag-picker` (name shown, pick flag). Both are 4-option recognition tasks and compete on the same board.

**Score formula** — extend existing in `useArcade.ts`:
```
pointsForQuestion = basePoints(difficulty)
                  × streakMultiplier(streak)
                  × speedMultiplier(elapsedMs)

where speedMultiplier = elapsedMs <= 4000 ? 1.25 : 1.0
```

Apply only on correct answers. Submit `totalScore` at summary phase.

**Metadata**:
```json
{
  "accuracy": 87,
  "best_streak": 9,
  "total_flags": 30,
  "continents": ["Africa", "Europe"],
  "difficulties": [1, 2, 3],
  "fast_answers": 22
}
```

**Submit trigger**: `phase === 'summary'` in `useArcade.ts` when `quizMode === 'multiple-choice'` or `quizMode === 'flag-picker'`.

**Display**: "5,240 pts · 87% · 30 flags · ⚡ 22 fast"

**Mock seed**: 200 entries, scores 500–18,000 (power-law distribution), accuracy 50–98%, mixed filter combos.

### 2. Arcade Hardcore — `board: 'arcade_hardcore'`

Type-ahead input — player types the country name. Recall-intensive.

**Score formula**: identical to Arcade Standard. The type-ahead friction alone produces meaningfully different distributions; no explicit multiplier needed.

**Metadata**: same shape as Standard.

**Submit trigger**: `phase === 'summary'` in `useArcade.ts` when `quizMode === 'type-ahead'`.

**Display**: same as Standard.

**Mock seed**: 200 entries, scores 300–12,000 (tighter ceiling than Standard — typing is slower).

### 3. Around the World — `board: 'around_the_world'`

Redefined as a **complete-the-world speed challenge**. Session ends when the player has answered every country in the current pool (`mapCountries` from `useAroundTheWorld.ts:69`).

**Score formula** (new, replaces missing score in `useAroundTheWorld.ts`):
```
score = correct_count × 1000
      + fast_answers × 100                    // answers in ≤4s
      + max(0, 900 - elapsed_seconds) × 10    // time bonus, decays after 15 min
      - wrong_answers × 200                   // accuracy penalty
```

Track `sessionStartedAt` and `questionStartedAt` in state. On completion (all pool countries answered), freeze the score and submit.

**Metadata**:
```json
{
  "correct_count": 162,
  "wrong_count": 16,
  "accuracy": 91,
  "elapsed_seconds": 687,
  "fast_answers": 98,
  "pool_size": 178,
  "continents": ["Africa", "Asia", "Europe", "North America", "South America", "Oceania"],
  "difficulties": [1, 2, 3, 4, 5]
}
```

**Submit trigger**: when `answeredCountries.size === mapCountries.length` (pool exhausted). Add new `phase: 'complete'` to `useAroundTheWorld.ts` — today the mode loops infinitely, which breaks the one-shot model.

**Display**: "171,840 pts · 162/178 · 11m 27s · ⚡ 98 fast"

**Mock seed**: 200 entries, scores 5,000–220,000 (wide spread from speed + accuracy dominating).

### 4. Jeopardy Standard — `board: 'jeopardy_standard'`

Recognition-based play. Covers both `pick-the-name` (flag shown, pick name from 4 options) and `pick-the-flag` (name shown, pick flag from 4 options). Both are 4-option recognition tasks and compete on the same board.

**New mechanic: per-question countdown timer.** Without it, Jeopardy is trivially cheatable via lookup.
- Easy: 15 seconds
- Medium: 10 seconds
- Hard: 7 seconds
- Extra-Hard: 5 seconds
- Daily Double: +5 seconds (wager phase pauses the clock)

On expiry, treat as wrong answer: subtract `cell.value × difficultyMultiplier` and mark cell used. No speed bonus layered on top — the timer itself is the speed signal.

**Score formula** — extend existing in `useJeopardy.ts:236`:
```
pointsForCell = cell.value × difficultyMultiplier(gameDifficulty)

where difficultyMultiplier:
  easy: 0.75
  medium: 1.0
  hard: 1.5
  extra-hard: 2.0
```

Applied on correct (gain) *and* wrong/timeout (loss). Preserves Jeopardy's risk/reward feel, and easy-mode grinders naturally can't outscore hard-mode skilled play on the same board.

**Metadata**:
```json
{
  "game_difficulty": "medium",
  "quiz_mode": "pick-the-name",
  "daily_double_correct": true,
  "cells_correct": 24,
  "cells_total": 30,
  "cells_timed_out": 3,
  "avg_answer_ms": 4200
}
```

**Submit trigger**: `gameOver === true` in `useJeopardy.ts` when `quizMode === 'pick-the-name'` or `quizMode === 'pick-the-flag'`.

**Display**: "$8,400 · 24/30 cells · Medium · 4.2s avg"

**Mock seed**: 200 entries, scores -6,000 to +30,000 (wide spread from the difficulty multiplier + daily-double swings).

### 5. Jeopardy Hardcore — `board: 'jeopardy_hardcore'`

Type-ahead recall. Player types country names under the timer.

**Score formula**: identical to Jeopardy Standard including `difficultyMultiplier`. Timer durations same per gameDifficulty. No extra multiplier for typing — the input friction alone separates the distributions.

**Metadata**: same shape as Standard.

**Submit trigger**: `gameOver === true` in `useJeopardy.ts` when `quizMode === 'type-ahead'`.

**Display**: same as Standard.

**Mock seed**: 200 entries, scores -8,000 to +22,000 (tighter ceiling than Standard — typing under the timer is punishing).

### 6. Flag Runner — `board: 'flag_runner'`

Endless runner, already grind-resistant (`SPEED_INCREMENT` per level + 3 lives).

**Score formula**: existing `score` in `useFlagRunner.ts:62`. Add combo weighting so sustained runs beat scattered survival: `bonus = combo_length_cubed / 8` added on combo break. A 50-combo = 15,625 bonus; a 10-combo = 125. Rewards skill clusters.

**Metadata**:
```json
{
  "level_reached": 7,
  "best_combo": 12,
  "continents": ["Asia", "Europe"],
  "difficulties": [1, 2, 3]
}
```

**Submit trigger**: `phase === 'game-over'` in `useFlagRunner.ts`.

**Display**: "1,840 pts · Level 7 · 12 combo"

**Mock seed**: 200 entries, scores 50–12,000 (steep falloff typical of endless runners with combo bonuses).

## Anonymous identity + claim flow

### Identity model

- On first visit, generate a UUID (`crypto.randomUUID()`) stored in localStorage as `flag-arcade-device-id`.
- Generate a random handle on first visit (e.g. `BraveTiger47`) using a fixed adjective + animal + 2-digit-number list. Store as `flag-arcade-handle`.
- Self-reported country code stored as `flag-arcade-country` — prompted on first leaderboard rank surface, dismissible.
- Player can rename their handle freely while anonymous. After claim/signup, renames rate-limited to once per week.

### Database changes

Extend `leaderboard_scores` and `leaderboard_monthly` (and new `leaderboard_daily`):

```sql
-- existing: id, user_id, mode, score, metadata, achieved_at
ALTER TABLE leaderboard_scores
  RENAME COLUMN mode TO board;

ALTER TABLE leaderboard_scores
  ADD COLUMN device_id uuid,             -- anonymous identity, nullable
  ADD COLUMN display_name text,          -- snapshot of handle at submit time
  ADD COLUMN country_code text,          -- self-reported, nullable
  ADD COLUMN claimed_user_id uuid;       -- set when device merges into account

ALTER TABLE leaderboard_scores ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE leaderboard_scores
  ADD CONSTRAINT identity_present CHECK (user_id IS NOT NULL OR device_id IS NOT NULL);
```

Mirror on `leaderboard_monthly` and new `leaderboard_daily` (with a `day` column). Update the enum constraint on the `board` column to the new token list.

### Submit flow (replaces gated `if (!user) return`)

```
identity = user?.id ? { user_id: user.id } : { device_id: deviceUUID }
displayName = user?.user_metadata.display_name ?? localHandle
upsert into leaderboard_scores using identity as the conflict key
  (composite unique: COALESCE(user_id, device_id) + board)
```

### Claim flow

When a previously anonymous device signs up:

1. On successful signup, `AuthContext` reads `flag-arcade-device-id` from localStorage.
2. Server-side claim function `claim_device_scores(device_id, user_id)`:
   - For each of `leaderboard_scores`, `leaderboard_monthly`, `leaderboard_daily`: update rows where `device_id = $1 AND user_id IS NULL`, setting `user_id = $2` and `claimed_user_id = $2`.
   - If both anonymous and account rows exist for the same board, keep the higher score.
3. Client clears `flag-arcade-handle` (account display name takes over).
4. Show toast: "Claimed your history — N runs across M boards saved to your account."

### When to nudge claim

Never on first run. Fire on **earned moments** (handled by a small `useClaimPrompt` hook):
- After 3rd completed run on any board
- When player breaks into the global top 10% on any board
- When player beats their own personal best
- When player attempts to leave a session with notable history (≥5 runs)

Frame as protect/claim, never as gate: *"Claim BraveTiger47 and protect your #847 ranking →"*

## Surfaces

Three placements, in priority order. Implement in this order — each is shippable on its own.

### 1. Summary-screen rank line (highest ROI)

Add to existing summary screens for every mode. Single line under the existing score:

```
🏆 Rank #847 globally as BraveTiger47 · #12 in 🇺🇸 today
   You beat 78% of players · View leaderboard →
```

For Arcade, route to `arcade_standard` or `arcade_hardcore` based on `quizMode`. For Jeopardy, route to `jeopardy_standard` or `jeopardy_hardcore` based on `quizMode`.

If the player isn't on the board yet (first run while data is loading), show a loading shimmer rather than nothing. If not signed in and they're top 25%, append the claim prompt inline.

### 2. Lobby "today's top" line

Inside each mode's lobby (`useArcade.phase === 'lobby'`, `useAroundTheWorld.phase === 'lobby'`, etc.), single row above the Start button:

```
Today's top: 9,840 by @flagsensei · Your best: 6,200
```

For Arcade and Jeopardy, reflect the currently-selected quiz mode's board (Standard vs. Hardcore). If no daily entries yet, fall back to monthly. If never played, hide.

### 3. `/leaderboards` page + one nav entry

One route, tabs by board (6 tabs: Arcade Standard, Arcade Hardcore, Around the World, Jeopardy Standard, Jeopardy Hardcore, Flag Runner), sub-tabs by period (Today / This Month / All Time) and region (Global / 🇺🇸 USA — auto-set to player's country, switchable).

Layout:
- Player's rank card at the top (rank, percentile, score, last submitted)
- Top 5 entries below
- Then ±2 around the player (if not in top 5)
- "Show top 100" expandable section for the diggers

**Do not put leaderboards on the home page.** The single allowed exception: if/when a Daily Challenge mode ships, one tile may surface its top score and player count.

## Anti-cheat

Trust scores, not identities. Anonymous identities are recyclable, so all defenses go on the score path:

- **Per-device rate limit**: max 1 submission per board per 30 seconds.
- **Plausibility ceilings per board**: e.g. Arcade Standard cap ~30,000; Around the World cap ~300,000; Jeopardy Standard cap ~40,000 (with Extra-Hard 2.0× multiplier + daily double); Flag Runner cap ~20,000. Reject exceeding.
- **Time-floor checks**: Around the World can't submit with `elapsed_seconds < 60` on a full pool; Arcade can't submit with `avg_answer_ms < 500`.
- **Jeopardy timer enforcement**: server rejects submissions with `avg_answer_ms` exceeding the per-difficulty ceiling (Easy 15s / Medium 10s / Hard 7s / Extra-Hard 5s). Catches scenarios where the timer was bypassed client-side.
- **Daily-period determinism**: when daily challenges land, server generates the day's seed; client must echo it back with the score.
- **Display-name moderation**: profanity filter on handle creation/rename (client + server, deny list).
- **No expensive privileges for anonymous identities**: score submission only — no custom messages, no avatars, no comments.

## Mock-data strategy

Every board must be testable end-to-end before live submissions are accepted.

### Approach

1. **`scripts/seed-leaderboard.ts`** — generates and inserts mock entries. Use an `is_mock boolean` column with RLS isolating from prod queries by default. Idempotent — can re-run.
2. **Mock data toggle** — `VITE_LEADERBOARD_USE_MOCK=true` in `.env.local` makes the hook read mock-inclusive. Off in prod.
3. **Realistic distributions** — per-board mock seed targets above. Use power-law / exponential decay.
4. **Realistic handles + countries** — pull from a fake-handle list and weight country distribution by world population.
5. **Realistic timestamps** — spread `achieved_at` across last 30 days with recency bias.
6. **Insert "you" at varying ranks** — debug toggle to position the test player at rank #1, #50, #500, #2000, and at percentile 99 / 75 / 50 / 25 / 1.

### Test matrix per board

For each of the 6 boards, verify:
- [ ] Summary rank line renders for: top 10, top 25%, middle, bottom 25%, no data yet, anonymous, claimed
- [ ] Lobby "today's top" renders with: ≥1 daily entry, no daily entries (falls back to monthly), no entries at all (hidden)
- [ ] `/leaderboards` tab renders at: today / month / all-time × global / country
- [ ] Empty-state rendering when a tab has no entries
- [ ] Sort order correct (highest first; Jeopardy can include negatives)
- [ ] Display name + country flag emoji render correctly
- [ ] Player's rank card matches rank shown in the list
- [ ] Arcade routes submissions to `standard` vs `hardcore` by quizMode correctly
- [ ] Jeopardy routes submissions to `standard` vs `hardcore` by quizMode correctly
- [ ] Jeopardy `difficultyMultiplier` applied on both correct and wrong/timeout

## Phases (each shippable + reviewable)

### Phase 1 — Schema + identity foundation
- Migration: rename `mode` column → `board`; update enum to new token list; add `device_id`, `display_name`, `country_code`, `claimed_user_id`, `is_mock`. Create `leaderboard_daily`. Drop `NOT NULL` on `user_id`. Add identity CHECK constraint.
- Archive/drop legacy `'campaign'` / `'journey'` rows.
- Add `useDeviceIdentity` hook: lazily reads/creates UUID + handle + country in localStorage.
- Update `useLeaderboard.submitScore` to accept `device_id` fallback when `!user`. Remove the early return. Rename signature from `mode` to `board`.
- Add `claim_device_scores` Postgres function.

**Reviewable**: anonymous submissions land in DB; signing up merges them.

### Phase 2 — Scoring mechanics + session shape
- Add `questionStartedAt: number` state to `useArcade.ts`, `useAroundTheWorld.ts`. Reset on new question. Compute elapsed in `checkAnswer`, apply `×1.25` if ≤4000ms.
- Redefine Around the World as one-shot: add `phase: 'complete'`, detect pool exhaustion, compute final score per formula, expose summary.
- Add Jeopardy per-question timer: 15s Easy / 10s Medium / 7s Hard / 5s Extra-Hard. Countdown state + UI ring. On expire, treat as wrong answer. Pause during Daily Double wager step.
- Add Jeopardy `difficultyMultiplier` to score math: 0.75 / 1.0 / 1.5 / 2.0 applied to `cell.value` on both correct gain and wrong/timeout loss.
- Add combo-cubed bonus on combo break in `useFlagRunner.ts`.

**Reviewable**: all four mode hooks compute the new canonical scores correctly; UI shows timer / speed indicators.

### Phase 3 — Mock-data seed system
- `scripts/seed-leaderboard.ts` populating mock entries with realistic distributions per board spec. Use `is_mock = true`.
- `VITE_LEADERBOARD_USE_MOCK` env switch reads both real and mock rows in dev.
- Debug toggle for inserting "you" at arbitrary rank/percentile.

**Reviewable**: can render every leaderboard surface against varied mock data without touching prod rankings.

### Phase 4 — Per-board submission wiring
- Wire `submitScore` into the right triggers:
  - Arcade summary → `arcade_standard` or `arcade_hardcore` by `quizMode`
  - Around the World `'complete'` phase → `around_the_world`
  - Jeopardy `gameOver` → `jeopardy_standard` or `jeopardy_hardcore` by `quizMode`
  - Flag Runner `'game-over'` → `flag_runner`
- Build canonical `metadata` blob per board.

**Reviewable**: every completed run produces a correctly-routed leaderboard entry.

### Phase 5 — Surfaces
- Summary rank line component (`<LeaderboardRankLine board="arcade_standard" score={...} />`) — wired into all mode summary screens.
- Lobby "today's top" line — wired into all mode lobbies, reflecting current quizMode/gameDifficulty selection.
- `/leaderboards` page with 7 tabs, period sub-tabs, region toggle, player rank card, top 5, ±2 around player, expandable top 100.
- One `Leaderboards` link in `SiteNav.tsx`.

**Reviewable**: all three surfaces visible and functional with mock data.

### Phase 6 — Claim flow + nudges
- `useClaimPrompt` hook with trigger logic (3rd run, top 10%, PB, leaving with ≥5 runs).
- Inline claim CTA on summary screen for unclaimed top performers.
- Post-signup toast confirming merged history.
- Country-prompt UX on first leaderboard surface (dismissible).

**Reviewable**: anonymous → signup flow merges history end-to-end; nudges fire at the right moments without nagging.

### Phase 7 — Anti-cheat hardening + go live
- Per-device rate limit RPC.
- Score plausibility caps per board (server-side rejection).
- Session-duration / avg-answer-time checks.
- Display-name profanity filter.
- Flip `VITE_LEADERBOARD_USE_MOCK=false` in prod.

**Reviewable**: known cheat patterns rejected; dashboard query confirms no mock data in prod boards.

## Decisions log

- **Anonymous on the board, not behind a sign-up wall** — loss aversion ("protect your rank") converts better than aspiration ("sign up to compete"). Lets boards look populated immediately.
- **Journey excluded** — it's a progression/collection experience, not a skill competition. Shoehorning it into a leaderboard dilutes the mode's fantasy.
- **Boards split by discipline, not by filter** — filters within a board are knobs. The one discipline split that matters is recognition (multiple-choice / flag-picker / pick-the-name / pick-the-flag) vs. recall (type-ahead). Every mode with a type-ahead variant gets a Standard + Hardcore pair; modes without one stay as a single board. Six boards total.
- **Jeopardy uses a `difficultyMultiplier` instead of a separate board per gameDifficulty** — same pattern as Arcade's continent/difficulty filters. Easy 0.75× / Medium 1.0× / Hard 1.5× / Extra-Hard 2.0× applied to cell values on both gains and losses. Keeps Standard/Hardcore split symmetric with Arcade and avoids board sprawl.
- **No ranked/unranked badge** — simpler UX and unnecessary; scoring math naturally makes easy filters uncompetitive at the top.
- **One-shot sessions, finite pools, best-of upsert** — the combined anti-grind discipline. No path to accumulate points across sessions; no path to grow score indefinitely within one.
- **Speed bonus = flat 1.25× at ≤4s threshold** — binary is easier for players to feel and tune. Can make it a curve later if data warrants.
- **Jeopardy gets a per-question timer** — without it the mode is trivially cheatable via lookup. Difficulty tier sets the clock length.
- **Country boards but not friend boards (yet)** — country is the cheapest viral hook with no social-graph cost.
- **Trust scores, not identities** — anonymous identity is recyclable on purpose; defenses live on the score path so they hold regardless.
- **Mock-data first** — same discipline as the territory PRD. Lets every surface be reviewed in isolation.
- **Three time horizons, no "weekly"** — daily creates habit, monthly creates seasonal drama, all-time creates legacy. Weekly competes with both without adding much.
- **No home-page leaderboards** — first-time visitors haven't earned a reason to care; permanent widgets become wallpaper.
- **Show your rank before top 10** — top 10 is wallpaper; your rank is personal.
