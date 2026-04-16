---
name: Religion Pages
description: Build a landing page for each major world religion + index, surfaced from the religion bar legend on country pages.
type: PRD
status: active
---

# Religion Pages — PRD

## Goal

Give each major religion its own landing page (`/religions/:slug`) with a factual blurb plus a ranked list of countries where that religion is practiced (by share of population). Surface them from the existing religion bar legend on country pages and from a new `/religions` index. Drives SEO long tail and gives users somewhere to land when they want to learn about a religion encountered on a country page.

## Scope

**In** — 23 religion pages + 1 index page

| # | Religion | Slug | Phase |
|---|---|---|---|
| 1 | Christian | `christian` | 1 |
| 2 | Roman Catholic | `roman-catholic` | 1 |
| 3 | Protestant | `protestant` | 1 |
| 4 | Orthodox | `orthodox` | 1 |
| 5 | Muslim | `muslim` | 1 |
| 6 | Hindu | `hindu` | 1 |
| 7 | Buddhist | `buddhist` | 1 |
| 8 | Jewish | `jewish` | 1 |
| 9 | Greek Orthodox | `greek-orthodox` | 2 (✅ done) |
| 10 | Russian Orthodox | `russian-orthodox` | 2 |
| 11 | Armenian Apostolic | `armenian-apostolic` | 2 |
| 12 | Lutheran | `lutheran` | 2 |
| 13 | Evangelical | `evangelical` | 2 |
| 14 | Pentecostal | `pentecostal` | 2 |
| 15 | Adventist | `adventist` | 2 |
| 16 | Latter-day Saint | `latter-day-saint` | 2 |
| 17 | Jehovah's Witness | `jehovahs-witness` | 2 |
| 18 | Sikh | `sikh` | 3 |
| 19 | Baha'i | `bahai` | 3 |
| 20 | Taoist | `taoist` | 3 |
| 21 | Rastafarian | `rastafarian` | 3 |
| 22 | Vodou | `vodou` | 3 |
| 23 | Druze | `druze` | 3 |

**Out**
- Folk / traditional / Animist / Spiritism / Badimo — culturally distinct labels, no consolidation.
- Country-specific churches (Kiribati Uniting Church, FJKM Madagascar, Awakening Churches Cameroon, etc.).
- Sub-1% denominational fragments (Apostolic, Methodist, Anglican mentions).
- Metadata buckets (None, Unspecified, Other, Believer, Agnostic, Atheist).

## Match patterns

Strict, anchored regex per bucket — same approach as `/^greek orthodox$/i`. Combine same-denomination variants where relevant:

- `/^(evangelical )?lutheran$/i` (Lutheran + Evangelical Lutheran are the same tradition)
- `/^(seventh[- ]day )?adventist$/i`

No "Christian" sweep that absorbs Catholic/Protestant — strict only, otherwise the percentages on the country lists become meaningless.

## Page structure (already implemented)

`src/pages/ReligionPage.tsx`:
- Header card: name + blurb (~140–170 words)
- Ranked country list: flag emoji, country name, percent (sorted desc)
- Breadcrumbs + SEOHead
- Bottom nav links (All Flags, Quiz)

## Index page

`/religions` — `src/pages/ReligionsIndexPage.tsx`
- Alphabetical list of all 23 religions
- Each entry: name, country count, one-line tagline (~10–15 words)
- Same retro card aesthetic

## Blurb voice

Factual and neutral, ~140–170 words. Each blurb covers:
1. Origins (when, where, founder if applicable)
2. Core beliefs / central scripture
3. Central practice / worship form
4. Structure / authority
5. Rough adherent count

For sensitive entries (Vodou, Latter-day Saint, Jehovah's Witness, Druze, Rastafari): straight descriptive theology and history. No value judgments. Don't sanitize, don't editorialize.

## Discoverability

- Religion bar legend on country page → individual page (✅ existing)
- `/religions` index linked from bottom of religion pages and About page
- **No top-level nav placement** (per user) — discoverability comes from legend + bottom links

## SSG / sitemap (`scripts/generate-seo-pages.ts`)

- Pre-render all 23 religion pages + the index → 24 new HTML files
- Add 24 new URLs to sitemap at priority 0.6
- Static HTML mirrors React component structure

## Bucket cleanup completed

Pre-work done before this PRD was finalized — these renames apply both in `scripts/fetch-country-data.ts` (RELIGION_NAME_MAP) and in already-generated `src/data/countryFacts.ts`:

- `Animiste` → `Animist`
- `Evangelical Christian` → `Evangelical`
- `other Protestant` → `Protestant`
- `Lamaistic Buddhist` → `Buddhist`
- `Church of Jesus Christ` → `Latter-day Saint`

## Order of execution

1. ✅ Bucket cleanup
2. **Catalog skeleton** — 23 entries with slug + name + matchPattern + tagline + stub blurb (~30 words)
3. **Index page** + route
4. **SSG + sitemap** for index + all 23 entries
5. **Fill in full blurbs in batches** — Phase 1 (8) → Phase 2 (8) → Phase 3 (6); reviewable in batches before moving on

## Decisions log

- **Strict match (no "Christian" sweep)** — preserves country-list percentages
- **No nav placement** — religion is a niche topic; legend + bottom links sufficient
- **Folk/traditional kept separate** — combining would erase distinct cultural traditions
- **Country-specific churches excluded** — no audience for one-country pages, low SEO value
- **Lutheran + Evangelical Lutheran combined** — same tradition, different country naming
- **Adventist matches both forms** — Seventh-day Adventist is the formal name; "Adventist" is the bucket label
