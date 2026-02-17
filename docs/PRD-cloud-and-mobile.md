# PRD: Flag Arcade — Cloud Sync, Accounts & Mobile

## 0. Rebrand

| | Old | New |
|---|-----|-----|
| **App name** | Fantastic Flags | Flag Arcade |
| **Domain** | — | flagarcade.com |
| **Also register** | — | flagarcade.io, flagarcade.gg (defensive) |
| **Tagline** | "Test your knowledge of flags from around the world!" | TBD (keep or update) |

The retro pixel arcade theme already runs through the UI (pixel borders, Press Start 2P font, retro-window chrome). "Flag Arcade" makes the brand match the aesthetic.

**Rebrand touches:** App title in header, HTML `<title>`, Open Graph meta tags, share text in Daily Five, app store listings.

## 1. Overview

Upgrade Flag Arcade from a client-only web app to a cross-platform product with user accounts, cloud-synced progress, leaderboards, and native mobile apps.

**Current state:** Single-page React/TS app. All data in localStorage. No backend. Deployed as a static site.

**Target state:** Web + iOS + Android apps sharing a Supabase backend. Users sign in with Google or Apple, progress syncs across devices, and per-mode leaderboards drive competition.

## 2. Goals

| Goal | Metric |
|------|--------|
| Users can play on any device and pick up where they left off | 100% of persisted state syncs within 5 seconds of sign-in |
| Leaderboards motivate continued play | Leaderboard page accessible from every mode |
| Mobile apps feel native enough for App Store approval | Capacitor-wrapped app passes Apple/Google review |
| Existing users don't lose progress | Guest-to-account migration preserves all localStorage data |

## 3. Non-Goals (for now)

- Head-to-head multiplayer
- Friend lists / social features
- Push notifications
- In-app purchases or monetization
- Offline-first with conflict resolution (simple last-write-wins is acceptable)

## 4. User Flows

### 4.1 Guest Play (existing behavior, preserved)
1. User opens app (web or mobile)
2. Plays without signing in — all data stored locally
3. Periodic prompt: "Sign in to save your progress across devices"
4. Leaderboards visible but cannot submit scores without an account

### 4.2 Sign Up / Sign In
1. User taps "Sign In" (available from mode select screen and leaderboards)
2. Chooses Google or Apple
3. Supabase Auth handles OAuth flow
4. On first sign-in: if localStorage has progress, migrate it to their new account
5. On subsequent sign-in: pull cloud data, merge with any local changes (cloud wins on conflict)

### 4.3 Cloud Sync
1. On every state change (level complete, achievement unlock, settings change): write to Supabase
2. On app open: pull latest from Supabase, update local state
3. If offline: queue writes locally, flush when connection returns
4. Simple last-write-wins per-field — no complex merge

### 4.4 Leaderboards
1. User navigates to Leaderboards from mode select or post-game screens
2. Sees tabs: Journey | Campaign | Jeopardy | Around the World
3. Each tab has sub-tabs: All-Time | This Month
4. User's own rank highlighted
5. Top 100 shown per board

## 5. Architecture

```
┌────────────────────────────────────────────────────┐
│                  React / TypeScript                 │
│              (shared codebase, Vite build)          │
├──────────┬──────────┬──────────────────────────────┤
│  Web     │  iOS     │  Android                     │
│  (Vite)  │  (Capacitor)  │  (Capacitor)            │
├──────────┴──────────┴──────────────────────────────┤
│             Supabase JS Client                      │
├─────────────────────────────────────────────────────┤
│                    Supabase                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │   Auth   │  │ Postgres │  │  Edge Functions    │ │
│  │(Google/  │  │ (data +  │  │  (leaderboard     │ │
│  │ Apple)   │  │  RLS)    │  │   aggregation)    │ │
│  └──────────┘  └──────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 5.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Mobile wrapper | Capacitor 6 |
| Backend | Supabase (hosted Postgres + Auth + Edge Functions) |
| Auth | Supabase Auth — Google OAuth + Sign in with Apple |
| Database | PostgreSQL via Supabase |
| Native plugins | `@capacitor/google-auth`, `@capacitor/sign-in-with-apple` |

## 6. Database Schema

### 6.1 `profiles`

Created automatically on first sign-in via a Supabase trigger.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | References `auth.users.id` |
| `display_name` | `text` | From OAuth provider |
| `avatar_url` | `text` | From OAuth provider |
| `created_at` | `timestamptz` | Default `now()` |

### 6.2 `user_progress`

Single row per user. Stores the full journey + settings blob.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | References `profiles.id` |
| `journey_progress` | `jsonb` | Full `JourneyProgressData` object (level_results, total_stars, current_rank, achievements, unlocked_modes, completion_streak) |
| `settings` | `jsonb` | `{ quiz_mode, enabled_continents, enabled_difficulties, presentation_continents, presentation_difficulties }` |
| `updated_at` | `timestamptz` | Auto-updated on write |

**Why JSONB:** The progress structure is deeply nested and only ever read/written as a whole unit by one user. JSONB avoids over-normalizing 20+ level results into separate rows while still allowing indexed queries for leaderboard aggregation.

### 6.3 `leaderboard_scores`

One row per user per mode. Updated when a user achieves a new personal best.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | Auto-generated |
| `user_id` | `uuid` FK | References `profiles.id` |
| `mode` | `text` | `journey` \| `campaign` \| `jeopardy` \| `around_the_world` |
| `score` | `integer` | Mode-specific (see scoring below) |
| `metadata` | `jsonb` | Mode-specific details for display |
| `achieved_at` | `timestamptz` | When the score was set |
| **Unique** | | `(user_id, mode)` — one best per user per mode |

**Scoring per mode:**

| Mode | Score value | Metadata |
|------|-----------|----------|
| Journey | Total stars (0-60) | `{ rank, levels_completed }` |
| Campaign | Overall percentage (0-100) | `{ level_scores: {...} }` |
| Jeopardy | Dollar score | `{ difficulty }` |
| Around the World | Correct percentage (0-100) | `{ total_answered, total_correct }` |

### 6.4 `leaderboard_monthly`

Separate table for monthly boards. Truncated on the 1st of each month via a cron Edge Function.

| Column | Type | Notes |
|--------|------|-------|
| Same schema as `leaderboard_scores` | | Plus `month` column (`date`, first of month) |

### 6.5 Row-Level Security Policies

```
profiles:       SELECT any, UPDATE own
user_progress:  SELECT own, INSERT own, UPDATE own
leaderboard_*:  SELECT any, INSERT own, UPDATE own
```

## 7. Data Migration (localStorage to Cloud)

When a guest signs in for the first time:

1. Read all 7 localStorage keys
2. Check if `user_progress` row exists for this user
3. If no cloud data: INSERT localStorage data as-is
4. If cloud data exists (signed in on another device first): compare `updated_at` — keep the one with more total stars (or prompt user to choose)
5. After successful migration: local state switches to cloud-backed mode
6. localStorage continues as a cache layer for offline access

## 8. Client Data Layer Refactor

### Current Architecture
```
Component → useLocalStorage('key') → localStorage
```

### New Architecture
```
Component → useCloudState('key') → local cache (useState)
                                  ↕ (sync)
                                  Supabase
```

**`useCloudState` hook behavior:**
- On mount: read from local cache (fast), then fetch from Supabase (async update)
- On write: update local cache immediately, debounced write to Supabase (500ms)
- If not signed in: falls back to localStorage only (current behavior)
- Exposes `isSyncing` and `lastSyncedAt` for UI feedback

### Implementation approach
1. Create a `SyncProvider` context that wraps the app
2. `SyncProvider` manages auth state, Supabase client, and sync queue
3. Replace `useLocalStorage` calls with `useCloudState` calls
4. `useCloudState` reads from `SyncProvider` context — if no user, delegates to localStorage

## 9. Leaderboard UI

### 9.1 Leaderboard Page
- Accessible from a "Leaderboards" button on the mode select screen
- Tab bar: Journey | Campaign | Jeopardy | Around the World
- Sub-tabs: All-Time | This Month
- Shows rank, avatar, display name, score
- Current user's row highlighted (sticky at bottom if not in top 100)
- Pull-to-refresh on mobile

### 9.2 Post-Game Leaderboard Prompt
- After completing a Journey level, Campaign run, Jeopardy game, or AtW session:
  - If signed in and new personal best: "New personal best! You're ranked #X"
  - If not signed in and score would place in top 100: "Sign in to claim your spot on the leaderboard"

## 10. Capacitor / Mobile

### 10.1 Setup
- Add Capacitor to existing Vite project
- Configure iOS and Android projects
- Native splash screen and app icon (retro pixel art style matching the theme)

### 10.2 Native Auth
- **Google Sign-In:** `@codetrix-studio/capacitor-google-auth` plugin for native flow on mobile, standard OAuth redirect on web
- **Sign in with Apple:** `@capacitor-community/apple-sign-in` plugin (required for iOS App Store if offering other social logins)
- Auth flow abstracted behind a platform-agnostic `signIn(provider)` function

### 10.3 Mobile-Specific Considerations
- Safe area insets (notch, home indicator) — add `safe-area-inset-*` padding
- Status bar styling — light content on sky blue background
- Haptic feedback on correct/incorrect answers (Capacitor Haptics plugin)
- App review prompts after positive moments (3-star level completion)
- Deep links for sharing leaderboard position (future)

### 10.4 App Store Requirements
- **iOS:** Apple Developer Program ($99/yr), privacy policy URL, App Store screenshots (6.7", 6.1", iPad), app review description
- **Android:** Google Play Developer account ($25 one-time), privacy policy URL, feature graphic, screenshots

## 11. Milestones

### Milestone 1: Web with Accounts & Cloud Sync
**Scope:** Supabase project setup, auth UI, data layer refactor, guest-to-account migration

| Work item | Details |
|-----------|---------|
| Supabase project + schema | Create tables, RLS policies, auth providers |
| Auth UI | Sign-in button, account menu, sign-out |
| `SyncProvider` + `useCloudState` | Replace `useLocalStorage` with cloud-backed hook |
| Migration flow | localStorage → cloud on first sign-in |
| Offline fallback | Queue writes when offline, flush on reconnect |

**Ship criteria:** Users can sign in on web, progress syncs to cloud, works offline with local fallback.

### Milestone 2: Leaderboards
**Scope:** Leaderboard tables, score submission, leaderboard UI, monthly reset cron

| Work item | Details |
|-----------|---------|
| Score submission | Write to `leaderboard_scores` on personal best |
| Leaderboard queries | Top 100 per mode, user rank lookup |
| Leaderboard page UI | Tabs, rows, current user highlight |
| Monthly reset | Edge Function cron copies scores to `leaderboard_monthly`, optionally archives |
| Post-game prompt | "You're ranked #X" or "Sign in to compete" |

**Ship criteria:** Per-mode leaderboards visible on web with all-time and monthly views.

### Milestone 3: Mobile Apps
**Scope:** Capacitor integration, native auth, mobile polish, app store submission

| Work item | Details |
|-----------|---------|
| Capacitor setup | Add iOS + Android projects, configure build |
| Native auth plugins | Google and Apple sign-in on device |
| Mobile polish | Safe areas, status bar, haptics, responsive tweaks |
| App icons + splash | Pixel art assets matching retro theme |
| App store prep | Screenshots, descriptions, privacy policy |
| Build pipeline | Automated builds (Fastlane or EAS) |
| Submit to stores | Apple App Store + Google Play |

**Ship criteria:** Apps approved and live on both stores, auth and sync working on device.

## 12. Open Questions

| # | Question | Impact |
|---|----------|--------|
| 1 | Should we add a username/handle system or just use OAuth display names? | Affects profile table and leaderboard display |
| 2 | Do we need a privacy policy page? (Yes for app stores — where to host it?) | Required for Milestone 3 |
| 3 | Should leaderboard scores be validated server-side to prevent cheating? | Edge Function to validate score against game rules |
| 4 | Do we want analytics (Posthog, Supabase analytics, etc.)? | Separate concern but worth deciding early |
| 5 | Should Around the World progress (which countries answered) sync, or just the percentage? | Affects `user_progress` JSONB size |

## 13. Future: Daily Five (Social Daily Game)

> **Status:** Tabled for a future milestone, after Milestones 1-3 ship.

### Concept

A daily flag challenge inspired by Wordle's share mechanic. Same 5 flags for everyone worldwide each day. One attempt per day. Shareable emoji result grid.

### Per-Flag Guess Flow

Each flag gives you up to 3 guesses with increasing help. The guess you get it on determines your emoji:

| Guess | Format | Emoji | Meaning |
|-------|--------|-------|---------|
| 1st | Type-ahead (no help) | `🟩` | You just knew it |
| 2nd | 8-option multiple choice | `🟨` | Recognized it with help |
| 3rd | 4-option multiple choice | `🟧` | Got it with a nudge |
| Miss | Answer revealed | `⬛` | Didn't get it |

### Daily Difficulty Mix

Each puzzle is seeded from the date and pulls a fixed distribution:

| Slot | Difficulty | Example |
|------|-----------|---------|
| 1 | Easy (difficulty 1) | USA, Japan, Canada |
| 2 | Medium (difficulty 2) | Argentina, Thailand |
| 3 | Medium (difficulty 3) | Ivory Coast, Cambodia |
| 4 | Hard (difficulty 4) | Eswatini, Comoros |
| 5 | Very Hard (difficulty 5) | Nauru, Tuvalu |

Accessible enough that most people get 3+/5, but a perfect `🟩🟩🟩🟩🟩` is rare and brag-worthy.

### Share Format

```
Flag Arcade Daily #142

🟩🟨🟩⬛🟧  3/5

flagarcade.com/daily
```

Copies to clipboard on tap. Five squares, one per flag, left to right. No spoilers — colors show *how* you got each one, not which flags they were.

### Features

- **One attempt per day:** If you close the app mid-game, you resume where you left off. Cannot replay.
- **Streak tracking:** "Current streak: 12 days" on the results screen. Consecutive days with at least 1/5 correct.
- **Countdown timer:** "Next puzzle in 4h 23m" shown after completion.
- **Puzzle seeding:** Deterministic from the date (`daily-seed-YYYY-MM-DD`), so no server endpoint needed. Same seed = same 5 flags + same multiple choice options for everyone.
- **History calendar:** Grid showing past results (colored dots per day, like GitHub contribution graph).

### Data Model Addition

```
daily_results (localStorage initially, cloud-synced later)
{
  date: "2026-02-13",
  results: ["green", "yellow", "green", "miss", "orange"],
  score: 3,
  completed: true,
  current_streak: 12,
  longest_streak: 24
}
```

### Implementation Notes

- Puzzle generation uses a seeded PRNG (e.g., `mulberry32` from date string hash) to deterministically select flags and generate multiple choice options. No server required.
- Multiple choice distractors for guess 2 (8 options) should include same-region flags to keep it challenging. Guess 3 (4 options) can be more forgiving.
- The type-ahead on guess 1 should use the same `TypeAhead` component already in the app.
- Could add a dedicated "Daily" button on the mode select screen with a notification dot when today's puzzle is unplayed.

### Why This Works

- **Same puzzle for all** creates shared experience and conversation
- **Emoji grid** is spoiler-free, compact, and works in any messaging app
- **Descending difficulty per guess** means the emoji colors tell a story — everyone's grid is different even with the same score
- **Daily cadence** drives retention without requiring long sessions
- **No server needed initially** — seeded from date, results stored locally

---

## 14. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Capacitor webview performance on low-end Android | Medium | Medium | Test on budget devices early; optimize CSS animations |
| Apple rejects app as "not enough native experience" | Low | High | Add haptics, native transitions, follow HIG for tab bars |
| Leaderboard cheating (fake scores via API) | Medium | Medium | Server-side score validation in Edge Function before writing to leaderboard |
| JSONB progress blob grows large over time | Low | Low | Progress is bounded (20 levels, 14 achievements) — max ~5KB |
| OAuth token refresh edge cases on mobile | Medium | Low | Supabase client handles refresh; add retry logic |
