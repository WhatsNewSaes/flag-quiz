# PRD: Enrich Country & Territory Pages with Reliable Facts + Flag Actions

**Status:** Approved, ready to implement
**Created:** 2026-04-16
**Owner:** Seth Coelen

## Context

FlagArcade currently has 197 country pages and 49 territory pages. Each page has a flag emoji, a written description, fun facts, and limited structured data (capital, year flag adopted). Most country pages have ~100-150 words of unique content.

**Two problems this addresses:**

1. **SEO — thin content.** Google Search Console shows 209 pages "Discovered – currently not indexed." A leading cause is insufficient unique content per page. Adding 100-200 words of structured factual data per page directly addresses this.

2. **Product — usefulness.** A flag site that doesn't let users grab the flag (copy emoji, download SVG) misses its most basic utility ask. Visitors searching "France flag PNG" or "copy USA flag emoji" should land here and convert.

## All decisions already made (do not re-ask)

| Decision | Choice |
|---|---|
| Data source for general facts | REST Countries v3.1 (`restcountries.com/v3.1/all`) |
| Data source for government type + religion | Factbook JSON (`github.com/factbook/factbook.json`) |
| Fields to capture | population, area, capital, languages, currencies, demonym, drivingSide, timezones, borders, subregion, independence, governmentType, religions |
| Fields explicitly **excluded** | calling code, top-level domain, coordinates |
| Borders rendering | Flag emoji + country name, linked to `/flags/{slug}` |
| Copy emoji button | Yes, both country and territory pages |
| Download flag button | Yes, SVG only (one format), both country and territory pages |
| Button placement | Top of page in flag display area, subtle (ghost style, small) |
| Flag image hosting | Self-host under `/public/flag-images/` (SEO ownership, no third-party leak) |
| Flag image source | One-time fetch from flagcdn.com SVGs at build time |
| Flag image filenames | SEO-friendly: `flag-united-states.svg`, not `us.svg` |
| Cache flag images in repo? | Yes — commit them. ~250 files, ~3MB total, vector |

## Workstream 1: Country & Territory Facts Data

### New file: `scripts/fetch-country-data.ts`

One-time/manual build script. Hits two upstream sources, merges, writes a typed TS data file.

**REST Countries fetch:**
- Endpoint: `https://restcountries.com/v3.1/all?fields=cca2,name,capital,population,area,languages,currencies,demonyms,car,timezones,borders,subregion,independent`
- Returns array; key by `cca2` (ISO alpha-2)
- Map fields:
  - `population` → `population`
  - `area` → `area`
  - `capital[0]` → `capital`
  - `Object.values(languages)` → `languages` (array of strings)
  - `currencies` → `[{ code, name, symbol }]`
  - `demonyms.eng.m` → `demonym`
  - `car.side` → `drivingSide` ('left' | 'right')
  - `timezones` → `timezones` (array)
  - `borders` → `borders` (array of ISO alpha-3 — convert to alpha-2 using REST Countries `cca3` lookup)
  - `subregion` → `subregion`

**Factbook fetch:**
- Repo: `https://github.com/factbook/factbook.json`
- Path pattern: `https://raw.githubusercontent.com/factbook/factbook.json/master/{region}/{country-slug}.json`
- Region directories: `africa`, `central-asia`, `east-n-southeast-asia`, `europe`, `middle-east`, `north-america`, `oceania`, `south-america`, `south-asia`, `central-america-n-caribbean`
- Build a region+slug lookup table — start by fetching `https://raw.githubusercontent.com/factbook/factbook.json/master/factbook.json` (the index) if it exists, otherwise iterate regions
- For each country JSON, extract:
  - `Government → 'Government type' → text` → `governmentType` (clean up — strip leading "Government type: ")
  - `People and Society → Religions → text` → parse to `[{ name: string, percent?: number }]`
- **Religions parsing:** the field is a comma-separated string like `"Roman Catholic 50.4%, Protestant 26.3%, other Christian 5.6%, Muslim 3.5%, ..."`. Parse with a regex: `/([A-Za-z][A-Za-z\s\-']+?)\s+(\d+(?:\.\d+)?)%/g`. Cap at top 5 religions. Truncate names cleanly.

**Output: `src/data/countryFacts.ts`**

```ts
export interface CountryFacts {
  population?: number;
  area?: number;
  capital?: string;
  languages?: string[];
  currencies?: { code: string; name: string; symbol: string }[];
  demonym?: string;
  drivingSide?: 'left' | 'right';
  timezones?: string[];
  borders?: string[];        // ISO alpha-2 codes
  subregion?: string;
  independence?: string;
  governmentType?: string;
  religions?: { name: string; percent?: number }[];
}

export const countryFacts: Record<string, CountryFacts> = { /* keyed by ISO alpha-2 */ };

export function getCountryFacts(code: string): CountryFacts | undefined {
  return countryFacts[code.toUpperCase()];
}
```

**Run:** `tsx scripts/fetch-country-data.ts`. Add npm script: `"sync-data": "tsx scripts/fetch-country-data.ts"`. Don't run on every build — manual refresh only.

**Coverage:**
- Countries: REST Countries covers all 195+. Factbook covers all.
- Territories: REST Countries covers ~30/49. Factbook covers most. Accept gaps — render only fields that have values.

## Workstream 2: Self-Hosted Flag Images

### New file: `scripts/fetch-flag-images.ts`

One-time fetch of all flag SVGs from flagcdn.com.

**Logic:**
1. Iterate all country codes from `src/data/countries.ts` and territory codes from `src/data/territories.ts`
2. For each: fetch `https://flagcdn.com/{code-lowercase}.svg`
3. Save to `public/flag-images/flag-{slug}.svg` where slug is from the country/territory name (e.g., `flag-united-states.svg`)
4. Skip if file already exists (idempotent)
5. Log any failed fetches (likely 1-3 obscure territories) — those entries hide the download button gracefully

**Run:** `tsx scripts/fetch-flag-images.ts`. Add npm script: `"sync-flags": "tsx scripts/fetch-flag-images.ts"`.

**Commit the resulting SVGs to the repo.** Total ~3MB.

**Verification before commit:** check `public/flag-images/` has roughly 244 files (197 + 49 minus a few coverage gaps).

## Workstream 3: New UI Components

### New file: `src/components/QuickFacts.tsx`

```tsx
interface QuickFactsProps {
  facts: CountryFacts;
  countryName: string;          // for "X borders Y" rendering
}
```

**Layout:** Single card matching existing retro-surface style. 2-column grid (1-column on mobile). Skip empty fields entirely. Render in this order:

| Field | Format |
|---|---|
| Capital | "Paris" |
| Population | "67,400,000" — formatted with thousands separator |
| Area | "643,801 km²" |
| Languages | comma-joined: "French, Occitan" |
| Currencies | "Euro (€) — EUR" |
| Demonym | "French" |
| Government | "Semi-presidential republic" |
| Subregion | "Western Europe" |
| Driving side | "Right" |
| Timezones | first 2: "UTC, UTC+1" — append "+N more" if longer |
| Independence | "1776" |

**Religions:** below the grid, as a sub-section. Render as horizontal stacked bar with labels. Skip if empty.

**Borders:** below religions, as a sub-section labeled `France borders {N} countries`. Render as flex-wrap of pills:
```tsx
<Link to={`/flags/${slug}`} className="...pill...">
  {getFlagEmoji(borderCode)} {borderCountryName}
</Link>
```
Skip section entirely if `borders` is empty (island nations).

### New file: `src/components/FlagActions.tsx`

```tsx
interface FlagActionsProps {
  emoji: string;             // already-computed flag emoji
  flagFilename: string;      // e.g., "flag-united-states.svg"
  countryName: string;
  hasDownloadable: boolean;  // false for territories without flagcdn coverage
}
```

**UI:** Two small ghost-style buttons in a row, centered under the existing flag emoji and country name in the existing flag display card:

```
[ 🇺🇸 Copy ]   [ ⬇ Download SVG ]
```

**Copy button:** `navigator.clipboard.writeText(emoji)`. Show "Copied!" replacement text for 2 seconds, then revert. No external toast library needed.

**Download:** `<a href={`/flag-images/${flagFilename}`} download={flagFilename}>` — browser handles natively.

**Hide download button** if `hasDownloadable === false`.

**Style:** small (`text-sm`), `border border-retro-border/40 hover:border-retro-border bg-transparent px-3 py-1.5 font-body`. Subtle — don't compete with the main heading.

### Update: `src/pages/CountryFlagPage.tsx`

1. Import `getCountryFacts`, `QuickFacts`, `FlagActions`.
2. In the "Flag Display" card (currently lines 85-95), add `<FlagActions />` below the country name `<p>`.
3. After the "Flag Display" card and before the "Description" section, add:
   ```tsx
   {facts && <QuickFacts facts={facts} countryName={country.name} />}
   ```
4. Compute `flagFilename` from country slug. Determine `hasDownloadable` by checking if the file exists at build time, or just attempt the download — flagcdn covers all 197 countries reliably.

### Update: `src/pages/TerritoryFlagPage.tsx`

Same pattern as CountryFlagPage. Use the same `getCountryFacts(territory.code)` lookup. Render the same components.

## Workstream 4: SSG Integration

### Update: `scripts/generate-seo-pages.ts`

For both `generateCountryPage()` and `generateTerritoryPage()`:

1. Import `countryFacts` from `../src/data/countryFacts`.
2. Look up facts for the current country/territory.
3. Build a "Quick Facts" HTML section (vanilla HTML, matching the React component output structure) and inject it after the description section in `bodyHtml`.
4. Inject borders pills as plain `<a>` tags (Googlebot reads these as internal links — significant SEO benefit).
5. Add the Copy/Download buttons as plain HTML — they won't be functional in pre-render (no JS yet), but the SVG download link will work pre-hydration. Copy needs JS so render it as a placeholder; React replaces it on hydration.
6. Optionally: add `image_outboundlink` JSON-LD pointing at the SVG so it shows up in image search.

**Critically:** the bordering country links pass internal link equity to neighbors. This is a strong SEO signal beyond just the content increase.

## Workstream 5: SSG content extension (optional polish)

Once Quick Facts is rendering in the static HTML, the per-page word count jumps from ~150 → ~300 words. This should significantly reduce "Discovered – currently not indexed" entries in GSC over the following 2-4 weeks.

After deploy, manually request reindexing in Search Console for 5-10 representative pages (e.g., /flags/peru, /flags/japan, /flags/territories/hong-kong) to nudge re-crawl.

## Implementation Order

1. **`scripts/fetch-country-data.ts`** + run + verify `src/data/countryFacts.ts` looks reasonable (spot-check 5 entries: USA, France, Japan, Antarctica, a small territory like Pitcairn)
2. **`scripts/fetch-flag-images.ts`** + run + verify `public/flag-images/` has ~244 SVG files
3. **`src/components/FlagActions.tsx`** (smaller, isolated)
4. **`src/components/QuickFacts.tsx`**
5. **Wire into `CountryFlagPage.tsx`** — view in dev server, verify on a few countries (Peru, Japan, India)
6. **Wire into `TerritoryFlagPage.tsx`** — verify on Hong Kong, Puerto Rico
7. **`generate-seo-pages.ts` SSG integration** — `npm run build`, grep dist/flags/peru/index.html for new content
8. **Add npm scripts:** `sync-data`, `sync-flags` in `package.json`
9. **Type check:** `npx tsc --noEmit`
10. **Commit + push** in logical chunks (data sync scripts → components → page integration → SSG)

## Verification

- [ ] `src/data/countryFacts.ts` has entries for all 197 countries
- [ ] `src/data/countryFacts.ts` has entries for ≥40 of the 49 territories
- [ ] `public/flag-images/` has SEO-friendly SVG filenames
- [ ] Visit `/flags/france` — see Quick Facts with population, capital, government type, religions, borders (Belgium, Germany, Italy, Spain, Switzerland, etc.) as clickable flag pills
- [ ] Click a border pill — navigates to that country's page
- [ ] Click "Copy" — emoji is in clipboard, button briefly says "Copied!"
- [ ] Click "Download SVG" — browser downloads `flag-france.svg`
- [ ] Visit `/flags/territories/hong-kong` — same pattern, parent country = China
- [ ] `npm run build` succeeds
- [ ] `dist/flags/france/index.html` contains "Quick Facts", border country names, and the SVG download link with our domain
- [ ] `npx tsc --noEmit` passes
- [ ] Lighthouse / quick visual sanity on mobile

## Things to NOT do

- Don't add API-call-at-runtime logic — all data fetching is build-time.
- Don't add a backend/API route — this is a static site.
- Don't add image conversion (PNG generation) — SVG only.
- Don't pre-render copy-emoji button as functional — it needs JS, render as placeholder.
- Don't optimize SVGs further than what flagcdn provides — they're already small.
- Don't add a "share" button or social card generator — out of scope.
- Don't regenerate `og/*.jpg` images — those already exist.
- Don't change tailwind config or fonts.

## Known risks / edge cases

- **Factbook URL slugs** don't always match REST Countries names. Need a manual mapping for awkward cases (e.g., "United States" → `north-america/us.json`, "Cote d'Ivoire" → `africa/iv.json`). Build the mapping iteratively — log misses, hand-fix the lookup table.
- **Some territories return 404 from flagcdn** (mostly Caribbean micro-territories). Log and continue. The 5-10 missing ones gracefully hide the download button.
- **REST Countries' `borders` field is alpha-3 codes**. Need to build an alpha-3 → alpha-2 lookup from the same fetch (cca2 + cca3 from each entry).
- **Religion data can be sparse for territories** — for many territories, factbook either has no entry or has minimal data. Render section only when present.
- **Render order matters in SSG** — Quick Facts goes between "About This Flag" and "Colors & Design" so the most useful info is highest on the page.
