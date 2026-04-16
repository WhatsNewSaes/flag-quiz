---
name: Territory Data Enrichment
description: Bring the 49 territory pages up to parity with country pages — flag features, descriptions, fun facts, Factbook data, similar flags, and continent peers.
type: PRD
status: active
---

# Territory Data Enrichment — PRD

## Goal

Territory pages today render ~4 sections (flag display, partial Quick Facts from REST Countries, sovereign info, sibling-territory grid). Country pages render ~9 (Quick Facts, About This Flag, flag features, Fun Facts, Bordering, Similar Looking Flags, Owned Territories, Continent peers, Organizations). This PRD closes that gap for all 49 territories.

Goal: every territory page should look and feel like a country page, with graceful degradation when a given field is genuinely unknown or unreliable (render `N/A` / hide the section, don't fabricate).

## Scope

**In** — 49 territories across 11 sovereigns + Antarctica + Western Sahara (see `src/data/territories.ts`).

**Out**
- New territories / boundary disputes not already in `territories.ts`
- Changes to country-page rendering (this is purely a territory uplift)
- Quiz integration for territories (remains countries-only)

## Decisions (confirmed before drafting)

1. **Data coverage** — find data for *every* territory where the source is reliable; use `N/A` (or hide the section) only where no trustworthy source exists. No invention to fill gaps.
2. **Similar Looking Flags** — compute across the full 246-flag set (countries + territories combined). Territory pages can show country matches; country pages can show territory matches. Update `flagFeatures.ts` as the unified pool.
3. **Continent peers grid** — mix countries and territories. Show the 12 most relevant entries from the same continent regardless of type, with a subtle type indicator.
4. **Bordering** — render land-border links whether the neighbor is a sovereign state or another territory (e.g., French Guiana ↔ Brazil + Suriname; Gibraltar ↔ Spain).

## Data strategy per field

| Field | Source | Coverage expected | Fallback |
|---|---|---|---|
| Population, area, capital, langs, currencies, driving side, timezones, borders, demonym, subregion | REST Countries v3.1 | ~45/49 | hide row |
| Government type, religions, independence | CIA Factbook (extend slug map) | ~15/49 major territories | hide row |
| Flag colors + patterns | Manual visual inspection (mechanical) | 49/49 | — |
| Flag description + color/pattern meaning + adopted year | AI-generated via extended `generate-flag-descriptions.ts`; **only** when reliable historical sources confirm. If uncertain → `N/A` on adopted; skip speculative meanings. | varies | hide section if no confident content |
| Fun Facts | AI-generated, strictly from verifiable facts; reviewer (user) approves batches; halt if sources thin. | 30–40/49 expected | hide section |
| Similar Looking Flags | Computed from unified `flagFeatures` | 49/49 | — |
| Continent peers | Computed from `countries` + `territories` | 49/49 | — |

### Anti-hallucination rules for Phase 4 (descriptions + fun facts)

- Every claim must be verifiable against a mainstream source (Wikipedia, government site, CIA Factbook, vexillology references).
- If the adopted year is disputed or unknown, output `adopted: 'unknown'` and skip the year-specific sentence.
- If the symbolism of a color/pattern is contested or sourceless, skip it rather than inventing.
- No fun facts where the only "source" is folklore, blog posts, or AI memory. Reviewer (user) will spot-check batches — halt generation if error rate exceeds ~10%.

## Page structure (post-enrichment)

`src/pages/TerritoryFlagPage.tsx` mirrors `CountryFlagPage.tsx`:

1. Breadcrumbs + flag hero + emoji
2. Quick Facts (hides any row with no data)
3. Sovereign info card (already present)
4. About This Flag — description + color/pattern meaning + adopted year (hidden if no confident content)
5. Flag features (colors + patterns as clickable tags)
6. Fun Facts (hidden if empty)
7. Bordering Countries/Territories (hidden if landlocked/island)
8. Similar Looking Flags (top 5 from the full 246-flag set)
9. Other Territories of {sovereign} (existing)
10. Continent peers — countries + territories mixed (12 entries)
11. Footer nav

Every parity section is wrapped in a `hasData?` check so a sparse territory (Bouvet, Antarctica) just collapses rather than showing empty scaffolding.

## Schema additions

`src/data/territories.ts` — add optional fields to match `Country`:

```ts
interface Territory {
  // existing: name, code, continent, sovereignCode, sovereignName
  difficulty?: Difficulty;       // optional; for future quiz integration
  alternateNames?: string[];     // optional; for search
}
```

`src/data/flagFeatures.ts` — add entries keyed by territory code (same shape as countries).

`src/data/flagDescriptions.ts` — add entries keyed by territory code (same shape).

`src/data/countryFacts.ts` — already keyed by ISO alpha-2; extend Factbook slug map in `scripts/fetch-country-data.ts` to cover Factbook-tracked territories.

## SSG / sitemap

No changes needed — `scripts/generate-seo-pages.ts` already pre-renders all 49 territory pages and includes them in the sitemap. Enriched data flows through automatically once it lands in the data files.

## Order of execution

1. **Schema + graceful fallback** — extend `Territory` interface; rewrite `TerritoryFlagPage.tsx` to render all parity sections, each guarded by a `hasData?` check. Ship before data lands so progressive enrichment just lights up sections.
2. **Flag features** — mechanical inspection of all 49 territory flags; add colors + patterns to `flagFeatures.ts`. Unlocks similar-flags + feature tag sections.
3. **Factbook extension** — add `TERRITORY_FACTBOOK_SLUGS` map in `scripts/fetch-country-data.ts`; re-run `sync-data`; verify `countryFacts.ts` picks up Factbook fields for PR, Greenland, HK, Macao, Faroe Islands, Gibraltar, New Caledonia, French Polynesia, Aruba, Curaçao, Bermuda, Cayman Islands, Réunion, Guadeloupe, Martinique (~15 territories).
4. **Flag descriptions + fun facts** — extend `scripts/generate-flag-descriptions.ts` to accept territory codes; generate in batches (e.g., 10 at a time), user reviews each batch; halt if hallucination rate is unacceptable. Use the anti-hallucination rules above.
5. **Similar flags + continent peers** — flip the computation in `CountryFlagPage.tsx` and `TerritoryFlagPage.tsx` to draw from the unified `countries + territories` pool; add type indicator to mixed-grid entries.

Each phase is reviewable before moving to the next, same cadence as the religion-pages PRD.

## Discoverability

Territory pages remain discoverable from:
- `/flags/territories` index (already linked from site nav)
- Sovereign country pages (via "Owned Territories" section)
- Continent peer grid on country pages once mixed (new surface)
- Similar Looking Flags on country pages once unified (new surface)

## Decisions log

- **Find-first, N/A as fallback** — reliability is the bar, not completeness. No fabrication.
- **Unified 246-flag pool for similar flags** — a real user looking at the Cook Islands should see New Zealand and Niue as similar, not just countries.
- **Mixed continent peers** — reinforces territory-as-flag-first-class without forcing quiz parity.
- **Bordering works both ways** — land borders are geographic, not political; rendering them regardless of entity type is truthful.
- **Graceful fallback before data** — shipping Phase 1 first means progressive enrichment visibly improves the site; avoids a big-bang reveal.
- **Reviewable batches for AI content** — same cadence that worked for religion blurbs.

## Territory inventory (for reference)

Data-rich (expected full parity): Puerto Rico, Greenland, Hong Kong, Macao, Guam, US Virgin Islands, Northern Mariana Islands, American Samoa, French Polynesia, New Caledonia, Réunion, Mayotte, Guadeloupe, Martinique, French Guiana, Aruba, Curaçao, Sint Maarten, Faroe Islands, Gibraltar, Bermuda, Cayman Islands, BVI, Turks & Caicos, Isle of Man, Jersey, Guernsey, Cook Islands, Åland Islands.

Sparse (graceful-fallback expected): Pitcairn Islands, BIOT, Bouvet Island, Svalbard & Jan Mayen, Christmas Island, Cocos Islands, Norfolk Island, Tokelau, Niue, Saint Pierre & Miquelon, Saint Barthélemy, Saint Martin, Wallis & Futuna, Saint Helena, Montserrat, Anguilla, Caribbean Netherlands, Antarctica, Western Sahara.
