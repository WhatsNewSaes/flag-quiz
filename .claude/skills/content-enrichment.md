# FlagArcade Content Enrichment — PRD

**Last updated:** April 14, 2026
**Status:** In Progress
**Depends on:** programmatic-seo.md (Workstream 1, Priority 2)
**File to modify:** `src/data/flagDescriptions.ts`

---

## Problem

All 197 country pages use identical template text with names swapped in. Every `description` reads "The flag of {X} features {colors}. It is a distinctive symbol representing the nation located in {continent}." Every `meaning` field is "The colors of the {X} flag reflect the nation's history, values, and cultural identity." Every `funFacts` entry is just "{X} is located in {continent} with its capital at {city}."

This is duplicate content across 197 pages — a negative SEO signal. Google sees these as thin/low-quality pages, which hurts indexing and ranking potential for every country page on the site.

## Goal

Replace all 197 entries in `flagDescriptions.ts` with unique, factual, 150-300 word content per country. Each entry should give Google enough distinct text to treat the page as a standalone, rankable piece of content for `{country} flag` queries.

## Data Model

```typescript
export interface FlagDescription {
  description: string;   // Rendered in "About This Flag" section
  meaning: string;       // EXISTS BUT NOT RENDERED — still enrich for future use
  adopted: string;       // Year current flag adopted
  funFacts: string[];    // Rendered as bullet list
  capitalCity: string;   // Rendered below description
}
```

**Note:** The `meaning` field is defined but never displayed in the React component or static page generator. We should still write good content for it since it may be surfaced later, but the `description` and `funFacts` fields are what Google actually sees.

## Content Requirements Per Country

### `description` (primary — this is what Google indexes)
- **Length:** 2-4 sentences, ~80-150 words
- **Must cover:**
  - Accurate layout description (e.g., "three equal vertical bands of blue, white, and red" not just "vertical stripes in blue, white, and red")
  - Any symbols/emblems on the flag (crescent, star, coat of arms, etc.)
  - What the specific colors/symbols represent *for that country* (not generic "reflects history and values")
  - When the current design was adopted and brief context (independence, revolution, redesign)
- **Tone:** Encyclopedic but accessible. Factual, not promotional.
- **No filler:** Every sentence should add information. No "It is a distinctive symbol representing the nation."

### `meaning` (not rendered but worth enriching)
- **Length:** 1-2 sentences, ~30-60 words
- **Must cover:** Specific symbolic meaning of colors and elements for this country

### `adopted` (keep as-is or correct if wrong)
- **Format:** Year string, e.g., "1962"
- **Verify:** Spot-check adoption years for accuracy

### `funFacts` (rendered as bullet list)
- **Count:** 3-5 facts per country (currently 2 generic ones)
- **Must be genuinely interesting**, not restatements of the description
- **Good examples:**
  - "Chad and Romania have nearly identical flags — the only difference is a slight shade variation in the blue stripe."
  - "Nepal is the only country with a non-rectangular national flag."
  - "The Danish flag (Dannebrog) is the oldest state flag still in use, dating to 1219."
- **Bad examples (current):**
  - "Algeria is located in Africa with its capital at Algiers." (not a fun fact)
  - "The current design of the Algeria flag was adopted in 1962." (duplicate of `adopted` field)

### `capitalCity` (keep as-is or correct if wrong)

## Batching Strategy

197 countries split into 8 batches by continent, processed in order:

### Batch 1: Africa (54 countries)
- [ ] DZ (Algeria), AO (Angola), BJ (Benin), BW (Botswana), BF (Burkina Faso)
- [ ] BI (Burundi), CM (Cameroon), CV (Cape Verde), CF (Central African Republic), TD (Chad)
- [ ] KM (Comoros), CD (DR Congo), CG (Congo), DJ (Djibouti), EG (Egypt)
- [ ] GQ (Equatorial Guinea), ER (Eritrea), SZ (Eswatini), ET (Ethiopia), GA (Gabon)
- [ ] GM (Gambia), GH (Ghana), GN (Guinea), GW (Guinea-Bissau), CI (Ivory Coast)
- [ ] KE (Kenya), LS (Lesotho), LR (Liberia), LY (Libya), MG (Madagascar)
- [ ] MW (Malawi), ML (Mali), MR (Mauritania), MU (Mauritius), MA (Morocco)
- [ ] MZ (Mozambique), NA (Namibia), NE (Niger), NG (Nigeria), RW (Rwanda)
- [ ] ST (Sao Tome and Principe), SN (Senegal), SC (Seychelles), SL (Sierra Leone), SO (Somalia)
- [ ] ZA (South Africa), SS (South Sudan), SD (Sudan), TZ (Tanzania), TG (Togo)
- [ ] TN (Tunisia), UG (Uganda), ZM (Zambia), ZW (Zimbabwe)

### Batch 2: Asia (50 countries)
- [ ] AF (Afghanistan), AM (Armenia), AZ (Azerbaijan), BH (Bahrain), BD (Bangladesh)
- [ ] BT (Bhutan), BN (Brunei), KH (Cambodia), CN (China), CY (Cyprus)
- [ ] GE (Georgia), IN (India), ID (Indonesia), IR (Iran), IQ (Iraq)
- [ ] IL (Israel), JP (Japan), JO (Jordan), KZ (Kazakhstan), KW (Kuwait)
- [ ] KG (Kyrgyzstan), LA (Laos), LB (Lebanon), MY (Malaysia), MV (Maldives)
- [ ] MN (Mongolia), MM (Myanmar), NP (Nepal), KP (North Korea), OM (Oman)
- [ ] PK (Pakistan), PS (Palestine), PH (Philippines), QA (Qatar), SA (Saudi Arabia)
- [ ] SG (Singapore), KR (South Korea), LK (Sri Lanka), SY (Syria), TW (Taiwan)
- [ ] TJ (Tajikistan), TH (Thailand), TL (Timor-Leste), TR (Turkey), TM (Turkmenistan)
- [ ] AE (UAE), UZ (Uzbekistan), VN (Vietnam), YE (Yemen)

### Batch 3: Europe (44 countries)
- [ ] AL (Albania), AD (Andorra), AT (Austria), BY (Belarus), BE (Belgium)
- [ ] BA (Bosnia and Herzegovina), BG (Bulgaria), HR (Croatia), CZ (Czech Republic), DK (Denmark)
- [ ] EE (Estonia), FI (Finland), FR (France), DE (Germany), GR (Greece)
- [ ] HU (Hungary), IS (Iceland), IE (Ireland), IT (Italy), XK (Kosovo)
- [ ] LV (Latvia), LI (Liechtenstein), LT (Lithuania), LU (Luxembourg), MT (Malta)
- [ ] MD (Moldova), MC (Monaco), ME (Montenegro), NL (Netherlands), MK (North Macedonia)
- [ ] NO (Norway), PL (Poland), PT (Portugal), RO (Romania), RU (Russia)
- [ ] SM (San Marino), RS (Serbia), SK (Slovakia), SI (Slovenia), ES (Spain)
- [ ] SE (Sweden), CH (Switzerland), UA (Ukraine), GB (United Kingdom), VA (Vatican City)

### Batch 4: North America (23 countries)
- [ ] AG (Antigua and Barbuda), BS (Bahamas), BB (Barbados), BZ (Belize), CA (Canada)
- [ ] CR (Costa Rica), CU (Cuba), DM (Dominica), DO (Dominican Republic), SV (El Salvador)
- [ ] GD (Grenada), GT (Guatemala), HT (Haiti), HN (Honduras), JM (Jamaica)
- [ ] MX (Mexico), NI (Nicaragua), PA (Panama), KN (Saint Kitts and Nevis), LC (Saint Lucia)
- [ ] VC (Saint Vincent and the Grenadines), TT (Trinidad and Tobago), US (United States)

### Batch 5: South America (12 countries)
- [ ] AR (Argentina), BO (Bolivia), BR (Brazil), CL (Chile), CO (Colombia)
- [ ] EC (Ecuador), GY (Guyana), PY (Paraguay), PE (Peru), SR (Suriname)
- [ ] UY (Uruguay), VE (Venezuela)

### Batch 6: Oceania (14 countries)
- [ ] AU (Australia), FJ (Fiji), KI (Kiribati), MH (Marshall Islands), FM (Micronesia)
- [ ] NR (Nauru), NZ (New Zealand), PW (Palau), PG (Papua New Guinea), WS (Samoa)
- [ ] SB (Solomon Islands), TO (Tonga), TV (Tuvalu), VU (Vanuatu)

## Quality Bar — Example Entry

Here's what a good entry looks like vs the current state:

### Current (Algeria):
```typescript
DZ: {
  description: "The flag of Algeria features vertical stripes in green, white, and red. It is a distinctive symbol representing the nation located in Africa.",
  meaning: "The colors of the Algeria flag reflect the nation's history, values, and cultural identity.",
  adopted: "1962",
  funFacts: [
    "Algeria is located in Africa with its capital at Algiers.",
    "The current design of the Algeria flag was adopted in 1962."
  ],
  capitalCity: "Algiers",
},
```

### Target (Algeria):
```typescript
DZ: {
  description: "The flag of Algeria consists of two equal vertical bands of green and white, with a red crescent and five-pointed red star centered on the boundary between the two colors. The green represents Islam and the fertile land, the white stands for peace and purity, and the red crescent and star are traditional symbols of Islam. The current flag was adopted on July 3, 1962, upon independence from France, though its design originated with the national liberation movement of the 1940s and 1950s.",
  meaning: "Green symbolizes Islam and the country's agricultural wealth, white represents peace, and the red crescent and star are symbols of the Islamic faith central to Algerian identity.",
  adopted: "1962",
  funFacts: [
    "Algeria is the largest country in Africa by land area, making its flag one of the most widely flown on the continent.",
    "The flag's design was inspired by the banner used by Emir Abdel Kadir in the 19th century during resistance against French colonization.",
    "Algeria's flag was officially enshrined in Article 6 of the country's constitution."
  ],
  capitalCity: "Algiers",
},
```

## Accuracy Notes

- **High confidence:** Major countries (G20, EU members, well-known nations) — flag history and symbolism is well-documented
- **Medium confidence:** Smaller nations, Pacific islands, newer countries (South Sudan, Kosovo) — some details should be spot-checked
- **Verify when uncertain:** If an adoption year or specific symbolic meaning is uncertain, note it in the PR for review rather than guessing

## Acceptance Criteria

- [ ] All 197 entries have unique `description` text (no two countries share phrasing)
- [ ] All descriptions are 80-150 words (2-4 sentences of substance)
- [ ] All `meaning` fields are specific to the country (not generic template text)
- [ ] All `funFacts` arrays have 3-5 genuinely interesting facts (no restatements of other fields)
- [ ] Adoption years verified or flagged for review
- [ ] Capital cities verified or flagged for review
- [ ] File compiles without TypeScript errors
- [ ] Site builds successfully after changes

## Progress Tracker

| Batch | Continent | Countries | Status |
|-------|-----------|-----------|--------|
| 1 | Africa | 54 | Done |
| 2 | Asia | 49 | Done |
| 3 | Europe | 45 | Done |
| 4 | North America | 23 | Done |
| 5 | South America | 12 | Done |
| 6 | Oceania | 14 | Done |
| **Total** | | **197** | **197/197 complete** |
