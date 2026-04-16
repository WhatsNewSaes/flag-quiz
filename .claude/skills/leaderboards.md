---
name: Leaderboards
description: Global per-mode leaderboards with anonymous participation, claim-on-signup, and country boards. Extends existing Supabase scaffolding in `useLeaderboard.ts`. Includes mock-data plan so each mode is testable before going live.
type: PRD
status: active
---

# Leaderboards — PRD

## Goal

Every game mode gets a global leaderboard that anonymous players can participate in immediately, with the option to claim their history by creating an account later. Leaderboards are surfaced at the moments players are already asking "how did I do?" — not as a permanent fixture that crowds the UI. Each mode should be testable end-to-end with mock data before any production deploy.

## Scope

**In** — Global all-time + monthly + daily boards for every competitive mode (Arcade, Around the World, Jeopardy, Journey, Flag Runner). Anonymous-by-default participation with a device UUID + auto-generated handle. Account creation merges device history. Country/regional boards layered on top of each global board. End-of-run summary rank line, lobby "today's top" line, and a single `/leaderboards` page.

**Out**
- Presentation Mode (communal use, not skill-based) — no board.
- Friends-only / social leaderboards — defer.
- Skill-rated matchmaking / Elo — defer.
- Per-filter micro-boards (e.g. "Africa-only Hard") — defer; one global board per mode is enough.
- Daily Challenge as its own *new* mode — defer; daily period on existing modes is the first step.

## Decisions (confirmed before drafting)

1. **One global board per mode**, not per filter combo. Filter context (continent set, difficulty set) is captured in `metadata` so we can slice later if needed, but rankings are unified.
2. **Anonymous participation on the global board** — scores submit immediately under an auto-generated handle. No visual distinction between anonymous and claimed entries. Sign-up is a *claim* action, never a gate.
3. **Three time horizons** per mode: `all_time`, `monthly`, `daily`. Existing schema has `all_time` + `monthly`; add `daily`.
4. **Country boards layered on top** — every global board has a sibling "in your country" view. Country is self-reported on first run (cheap viral hook, low cheat impact).
5. **Trust the score, not the identity** — anti-cheat lives in score validation (rate limits, plausibility checks, deterministic seeds for daily) since anonymous identities are recyclable.
6. **Show your rank, not the top 10** — every leaderboard surface leads with the player's rank + percentile, then top 5, then ±2 around the player.
7. **Mock-data first** — every mode must have a seed script that fills realistic leaderboard data so we can test all surfaces (rank line, lobby teaser, `/leaderboards`) before letting real submissions in.

## What already exists (to extend, not rebuild)

- `src/hooks/useLeaderboard.ts` — Supabase RPC + upsert flow for all-time + monthly. Currently **gated on `if (!user) return`** — this is the central thing we change.
- `src/contexts/AuthContext.tsx` — auth + user object.
- Supabase tables: `leaderboard_scores`, `leaderboard_monthly`. RPCs: `get_leaderboard`, `get_monthly_leaderboard`, `get_user_rank`.
- Existing mode enum: `'journey' | 'campaign' | 'jeopardy' | 'around_the_world'`. Missing: `'arcade'`, `'flag_runner'`. (Open question: is `'campaign'` distinct from `'journey'`? Resolve in Phase 1.)

## Per-mode leaderboard spec

Every mode submits a single canonical `score` field (sortable integer) plus a `metadata` JSON blob capturing the run shape so the UI can render context (e.g. "5,200 · 92% accuracy · Africa only"). The `metadata` is *displayed*, never used to filter rankings — boards stay unified.

### 1. Arcade — `mode: 'arcade'`

**Score formula**: `totalScore` from `useArcade.ts:13` — already includes streak multiplier × difficulty base points.

**Metadata**:
```json
{
  "accuracy": 87,
  "best_streak": 9,
  "total_flags": 30,
  "continents": ["Africa", "Europe"],
  "difficulties": [1, 2, 3],
  "quiz_mode": "multiple-choice"
}
```

**Submit trigger**: `phase === 'summary'` in `useArcade.ts`. Submit `summary.totalScore`.

**Display**: "5,240 pts · 87% · 30 flags"

**Mock seed target**: 200 fake entries, scores between 800 and 12,000 (long-tail distribution), accuracy 50–98%, mixed filter combos.

### 2. Around the World — `mode: 'around_the_world'`

**Score formula**: `totalCorrect × 100 + accuracyBonus`. There's no native score in `useAroundTheWorld.ts` today — derive one. Suggested: `score = totalCorrect * 100 + Math.round((totalCorrect / totalAnswered) * 1000)`. Captures both volume and precision.

**Metadata**:
```json
{
  "total_correct": 162,
  "total_answered": 178,
  "accuracy": 91,
  "continents_completed": 4,
  "continent_stats": { "Africa": {"correct": 48, "total": 54}, ... }
}
```

**Submit trigger**: When the player exits a session via `backToLobby()` (or after every N answers, debounced) — Around the World has no natural "summary" moment. Submit on session end + best-of upsert.

**Display**: "162 / 178 · 91% accuracy"

**Mock seed**: 200 entries, totalCorrect 20–197, accuracy 40–99%.

### 3. Jeopardy — `mode: 'jeopardy'`

**Score formula**: Final `score` from `useJeopardy.ts:21` — already a signed integer (can go negative).

**Metadata**:
```json
{
  "game_difficulty": "medium",
  "quiz_mode": "pick-the-name",
  "daily_double_correct": true,
  "cells_correct": 24,
  "cells_total": 30
}
```

**Submit trigger**: `gameOver === true` in `useJeopardy.ts`. Submit final `score`.

**Display**: "$8,400 · 24/30 cells · Medium"

**Mock seed**: 200 entries, scores -2,000 to 18,000, mix of easy/medium/hard.

### 4. Journey — `mode: 'journey'`

**Score formula**: Total stars across all completed levels. (Each `JourneyLevel` awards 1–3 stars based on accuracy.) Compute from `useJourneyProgress` aggregate, not per-run.

**Metadata**:
```json
{
  "total_stars": 87,
  "max_stars": 144,
  "levels_completed": 28,
  "perfect_levels": 12,
  "current_world": 4
}
```

**Submit trigger**: After any level completion that improves the player's total stars. (This is a collection board, not a per-run board — submit on aggregate change.)

**Display**: "⭐ 87 / 144 · 28 levels · 12 perfect"

**Mock seed**: 200 entries, total_stars 5–140 with realistic distribution (most players in 30–80 range).

### 5. Flag Runner — `mode: 'flag_runner'`

**Score formula**: Final `score` from `useFlagRunner.ts:62`. Endless runner — score grows with survival.

**Metadata**:
```json
{
  "level_reached": 7,
  "best_combo": 12,
  "lives_remaining": 0,
  "continents": ["Asia", "Europe"],
  "difficulties": [1, 2, 3]
}
```

**Submit trigger**: `phase === 'game-over'` in `useFlagRunner.ts`. Submit final `score`.

**Display**: "1,840 pts · Level 7 · 12 combo"

**Mock seed**: 200 entries, scores 50–8,000 (steep falloff curve typical of endless runners).

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
  ADD COLUMN device_id uuid,             -- anonymous identity, nullable for legacy rows
  ADD COLUMN display_name text,          -- snapshot of handle at submit time
  ADD COLUMN country_code text,          -- self-reported, nullable
  ADD COLUMN claimed_user_id uuid;       -- set when device merges into account

-- user_id becomes nullable; either user_id OR device_id must be set (CHECK constraint)
ALTER TABLE leaderboard_scores ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE leaderboard_scores
  ADD CONSTRAINT identity_present CHECK (user_id IS NOT NULL OR device_id IS NOT NULL);
```

Mirror on `leaderboard_monthly` and new `leaderboard_daily` (with a `day` column).

### Submit flow (replaces gated `if (!user) return`)

```
identity = user?.id ? { user_id: user.id } : { device_id: deviceUUID }
displayName = user?.user_metadata.display_name ?? localHandle
upsert into leaderboard_scores using identity as the conflict key
  (composite unique: COALESCE(user_id, device_id) + mode)
```

### Claim flow

When a previously anonymous device signs up:

1. On successful signup, `AuthContext` reads `flag-arcade-device-id` from localStorage.
2. Server-side claim function `claim_device_scores(device_id, user_id)`:
   - For each of `leaderboard_scores`, `leaderboard_monthly`, `leaderboard_daily`: update rows where `device_id = $1 AND user_id IS NULL`, setting `user_id = $2` and `claimed_user_id = $2`.
   - If both anonymous and account rows exist for the same mode, keep the higher score.
3. Client clears `flag-arcade-handle` (account display name takes over).
4. Show toast: "Claimed your history — N runs across M modes saved to your account."

### When to nudge claim

Never on first run. Fire on **earned moments** (handled by a small `useClaimPrompt` hook):
- After 3rd completed run on any mode
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

If the player isn't on the board yet (first run while data is loading), show a loading shimmer rather than nothing. If not signed in and they're top 25%, append the claim prompt inline.

### 2. Lobby "today's top" line

Inside each mode's lobby (`useArcade.phase === 'lobby'`, `useAroundTheWorld.phase === 'lobby'`, etc.), single row above the Start button:

```
Today's top: 9,840 by @flagsensei · Your best: 6,200
```

If no daily entries yet, fall back to monthly. If never played, hide.

### 3. `/leaderboards` page + one nav entry

One route, tabs by mode (Arcade / Around the World / Jeopardy / Journey / Flag Runner), sub-tabs by period (Today / This Month / All Time) and region (Global / 🇺🇸 USA — auto-set to player's country, switchable).

Layout:
- Player's rank card at the top (rank, percentile, score, last submitted)
- Top 5 entries below
- Then ±2 around the player (if not in top 5)
- "Show top 100" expandable section for the diggers

**Do not put leaderboards on the home page.** The single allowed exception: if/when a Daily Challenge mode ships, one tile may surface its top score and player count.

## Anti-cheat

Trust scores, not identities. Anonymous identities are recyclable, so all defenses go on the score path:

- **Per-device rate limit**: max 1 submission per mode per 30 seconds (Supabase RLS policy or RPC-side check).
- **Plausibility ceiling per mode**: e.g. Arcade score impossible above ~25,000 with current multipliers; reject anything exceeding a hard cap.
- **Time-floor checks**: Around the World can't submit 100 correct in <30 seconds (track session start client-side, send `session_duration_ms` in metadata, reject implausible runs server-side).
- **Daily-period determinism**: when daily challenges land, server generates the day's seed; client must echo it back with the score.
- **Display-name moderation**: profanity filter on handle creation/rename (client + server, deny list approach).
- **No expensive privileges for anonymous identities**: anonymous players get score submission only — no custom messages, no avatars, no comments.

## Mock-data strategy

Every mode must be testable end-to-end before live submissions are accepted. Build a seed system, not just one-off fixtures.

### Approach

1. **`scripts/seed-leaderboard.ts`** — generates and inserts mock entries into a `leaderboard_*_mock` schema (or a `is_mock = true` column with RLS isolating it from prod queries by default). Idempotent — can re-run.
2. **Mock data toggle** — `VITE_LEADERBOARD_USE_MOCK=true` in `.env.local` makes the hook read from mock tables. Off in prod.
3. **Realistic distributions** — see per-mode "Mock seed" specs above. Use power-law / exponential decay for scores so the leaderboard *looks* like a real one (a few outlier scores at the top, fat middle, long tail).
4. **Realistic handles + countries** — pull from a list of fake handles and weight country distribution by world population (US, India, China, Brazil, etc. heavier).
5. **Realistic timestamps** — spread `achieved_at` across the last 30 days with a recency bias (more recent = denser).
6. **Insert "you" at varying ranks** — a debug toggle that lets us position the test player at rank #1, #50, #500, #2000, and at percentile 99 / 75 / 50 / 25 / 1 to verify every surface variant renders correctly.

### Test matrix per mode

For each of the 5 modes, verify:
- [ ] Summary rank line renders for: top 10, top 25%, middle, bottom 25%, no data yet, anonymous, claimed
- [ ] Lobby "today's top" renders with: ≥1 daily entry, no daily entries (falls back to monthly), no entries at all (hidden)
- [ ] `/leaderboards` tab renders for the mode at: today / month / all-time × global / country
- [ ] Empty-state rendering when a tab has no entries
- [ ] Sort order is correct (highest first; Jeopardy can include negatives)
- [ ] Display name + country flag emoji render correctly
- [ ] Player's rank card matches rank shown in the list

## Phases (each shippable + reviewable)

### Phase 1 — Schema + identity foundation
- Migration: add `device_id`, `display_name`, `country_code`, `claimed_user_id` to `leaderboard_scores` and `leaderboard_monthly`. Create `leaderboard_daily` with same shape + `day` column. Drop `NOT NULL` on `user_id`. Add identity CHECK constraint.
- Add `'arcade'` and `'flag_runner'` to the `LeaderboardMode` type and any DB enums. Resolve `'campaign'` vs `'journey'` (likely consolidate to `'journey'`).
- Add `useDeviceIdentity` hook: lazily reads/creates UUID + handle + country in localStorage.
- Update `useLeaderboard.submitScore` to accept `device_id` fallback when `!user`. Remove the early return.
- Add `claim_device_scores` Postgres function.

**Reviewable**: anonymous submissions land in DB; signing up merges them.

### Phase 2 — Mock-data seed system
- `scripts/seed-leaderboard.ts` populating mock tables with realistic distributions per mode spec above.
- `VITE_LEADERBOARD_USE_MOCK` env switch.
- Debug toggle for inserting "you" at arbitrary rank/percentile.

**Reviewable**: can render every leaderboard surface against varied mock data without touching prod.

### Phase 3 — Per-mode submission wiring
- For each of the 5 modes, wire `submitScore` into the appropriate trigger (summary phase, game-over, level completion, session end).
- Compute the canonical `score` per the per-mode spec above (notably: derive Around the World's score, derive Journey's aggregate stars).
- Build the canonical `metadata` blob per mode.

**Reviewable**: every completed run produces a leaderboard entry with correct score + metadata.

### Phase 4 — Surfaces
- Summary rank line component (`<LeaderboardRankLine mode="arcade" score={...} />`) — wired into all 5 mode summary screens.
- Lobby "today's top" line — wired into all 5 mode lobbies.
- `/leaderboards` page with mode tabs, period sub-tabs, region toggle, player rank card, top 5, ±2 around player, expandable top 100.
- One `Leaderboards` link added to `SiteNav.tsx`.

**Reviewable**: all three surfaces visible and functional with mock data.

### Phase 5 — Claim flow + nudges
- `useClaimPrompt` hook with the trigger logic (3rd run, top 10%, PB, leaving with ≥5 runs).
- Inline claim CTA on summary screen for unclaimed top performers.
- Post-signup toast confirming merged history.
- Country-prompt UX on first leaderboard surface (dismissible).

**Reviewable**: anonymous → signup flow merges history end-to-end; nudges fire at the right moments without nagging.

### Phase 6 — Anti-cheat hardening + go live
- Per-device rate limit RPC.
- Score plausibility caps per mode (server-side rejection).
- Session-duration check for Around the World.
- Display-name profanity filter.
- Flip `VITE_LEADERBOARD_USE_MOCK=false` in prod.

**Reviewable**: known cheat patterns rejected; dashboard query confirms no mock data leaks into prod tables.

## Decisions log

- **Anonymous on the board, not behind a sign-up wall** — loss aversion ("protect your rank") converts better than aspiration ("sign up to compete"). Lets boards look populated immediately.
- **One global board per mode, not per filter combo** — prestige isn't dilutable across infinite micro-boards. Filter context lives in metadata for display, not ranking.
- **Country boards but not friend boards (yet)** — country is the cheapest viral hook with no social-graph cost. Friends can come if/when there's a sign-in graph worth using.
- **Trust scores, not identities** — anonymous identity is recyclable on purpose; defenses live on the score path so they hold regardless.
- **Mock-data first** — same discipline as the territory PRD: graceful scaffolding before real data. Lets every surface be reviewed in isolation.
- **Three time horizons, no "weekly"** — daily creates habit, monthly creates seasonal drama, all-time creates legacy. Weekly competes with both without adding much.
- **No home-page leaderboards** — first-time visitors haven't earned a reason to care; permanent widgets become wallpaper. Reserve home for one Daily Challenge tile if/when that mode ships.
- **Show your rank before top 10** — top 10 is wallpaper; your rank is personal. Drives engagement on every surface.
