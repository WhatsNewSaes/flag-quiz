/**
 * One-time/manual data sync script.
 *
 * Fetches structured country facts from:
 *   1. REST Countries v3.1 — population, area, capital, languages, currencies,
 *      demonyms, driving side, timezones, borders, subregion
 *   2. CIA World Factbook (factbook.json mirror) — government type, religions
 *
 * Merges both, keys by ISO alpha-2, and writes src/data/countryFacts.ts.
 *
 * Usage: tsx scripts/fetch-country-data.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const OUT_PATH = path.resolve(import.meta.dirname, '..', 'src', 'data', 'countryFacts.ts');

// ---------------------------------------------------------------------------
// Types (mirror what we'll write to disk)
// ---------------------------------------------------------------------------

interface CountryFacts {
  population?: number;
  area?: number;
  capital?: string;
  languages?: string[];
  currencies?: { code: string; name: string; symbol: string }[];
  demonym?: string;
  drivingSide?: 'left' | 'right';
  timezones?: string[];
  borders?: string[]; // ISO alpha-2 codes
  subregion?: string;
  independence?: string;
  governmentType?: string;
  religions?: { name: string; percent?: number }[];
}

// ---------------------------------------------------------------------------
// REST Countries
// ---------------------------------------------------------------------------

interface RestCountry {
  cca2: string;
  cca3: string;
  name: { common: string; official: string };
  capital?: string[];
  population?: number;
  area?: number;
  languages?: Record<string, string>;
  currencies?: Record<string, { name: string; symbol?: string }>;
  demonyms?: { eng?: { m?: string; f?: string } };
  car?: { side?: 'left' | 'right' };
  timezones?: string[];
  borders?: string[];
  subregion?: string;
  independent?: boolean;
}

async function fetchRestCountries(): Promise<{
  byCca2: Map<string, CountryFacts>;
  alpha3ToAlpha2: Map<string, string>;
  nameToCca2: Map<string, string>;
}> {
  console.log('Fetching REST Countries…');
  // The API limits to 10 fields per request, so split into two calls and merge.
  const url1 =
    'https://restcountries.com/v3.1/all?fields=cca2,cca3,name,capital,population,area,languages,currencies,demonyms,subregion';
  const url2 =
    'https://restcountries.com/v3.1/all?fields=cca2,car,timezones,borders,independent';

  const [res1, res2] = await Promise.all([fetch(url1), fetch(url2)]);
  if (!res1.ok) throw new Error(`REST Countries fetch (1) failed: ${res1.status}`);
  if (!res2.ok) throw new Error(`REST Countries fetch (2) failed: ${res2.status}`);
  const data1 = (await res1.json()) as RestCountry[];
  const data2 = (await res2.json()) as RestCountry[];

  // Index second batch by cca2 and merge into first
  const extras = new Map<string, RestCountry>();
  for (const c of data2) {
    if (c.cca2) extras.set(c.cca2.toUpperCase(), c);
  }
  const data: RestCountry[] = data1.map((c) => ({
    ...c,
    ...(extras.get(c.cca2?.toUpperCase() ?? '') ?? {}),
  }));
  console.log(`  got ${data.length} entries`);

  const byCca2 = new Map<string, CountryFacts>();
  const alpha3ToAlpha2 = new Map<string, string>();
  const nameToCca2 = new Map<string, string>();

  for (const c of data) {
    if (!c.cca2) continue;
    const code = c.cca2.toUpperCase();
    if (c.cca3) alpha3ToAlpha2.set(c.cca3.toUpperCase(), code);
    nameToCca2.set(c.name.common.toLowerCase(), code);

    const facts: CountryFacts = {};
    if (typeof c.population === 'number') facts.population = c.population;
    if (typeof c.area === 'number') facts.area = c.area;
    if (c.capital && c.capital.length > 0) facts.capital = c.capital[0];
    if (c.languages) {
      const langs = Object.values(c.languages);
      if (langs.length > 0) facts.languages = langs;
    }
    if (c.currencies) {
      const currencies = Object.entries(c.currencies).map(([codeKey, val]) => ({
        code: codeKey,
        name: val.name,
        symbol: val.symbol ?? '',
      }));
      if (currencies.length > 0) facts.currencies = currencies;
    }
    if (c.demonyms?.eng?.m) facts.demonym = c.demonyms.eng.m;
    if (c.car?.side === 'left' || c.car?.side === 'right') facts.drivingSide = c.car.side;
    if (c.timezones && c.timezones.length > 0) facts.timezones = c.timezones;
    if (c.borders && c.borders.length > 0) facts.borders = c.borders.map((b) => b.toUpperCase());
    if (c.subregion) facts.subregion = c.subregion;

    byCca2.set(code, facts);
  }

  // Resolve borders alpha-3 → alpha-2 (do it now that we have full lookup)
  for (const facts of byCca2.values()) {
    if (facts.borders) {
      facts.borders = facts.borders
        .map((alpha3) => alpha3ToAlpha2.get(alpha3))
        .filter((x): x is string => Boolean(x));
      if (facts.borders.length === 0) delete facts.borders;
    }
  }

  return { byCca2, alpha3ToAlpha2, nameToCca2 };
}

// ---------------------------------------------------------------------------
// Factbook
// ---------------------------------------------------------------------------

const FACTBOOK_REGIONS = [
  'africa',
  'australia-oceania',
  'central-america-n-caribbean',
  'central-asia',
  'east-n-southeast-asia',
  'europe',
  'middle-east',
  'north-america',
  'south-america',
  'south-asia',
];

// Manual ISO alpha-2 → factbook (region, gec_slug) overrides for ones whose
// names don't match cleanly. The factbook uses the GEC (Geopolitical Entity
// Code) for filenames, which often differs from ISO 3166. Filled in
// iteratively as we discover misses.
const FACTBOOK_OVERRIDES: Record<string, { region: string; slug: string }> = {
  US: { region: 'north-america', slug: 'us' },
  GB: { region: 'europe', slug: 'uk' },
  CI: { region: 'africa', slug: 'iv' }, // Cote d'Ivoire
  CD: { region: 'africa', slug: 'cg' }, // DRC (Congo, Democratic Republic of the)
  CG: { region: 'africa', slug: 'cf' }, // Republic of the Congo (Brazzaville)
  TD: { region: 'africa', slug: 'cd' }, // Chad
  CF: { region: 'africa', slug: 'ct' }, // Central African Republic
  CV: { region: 'africa', slug: 'cv' }, // Cape Verde
  KM: { region: 'africa', slug: 'cn' }, // Comoros
  GQ: { region: 'africa', slug: 'ek' }, // Equatorial Guinea
  ER: { region: 'africa', slug: 'er' },
  SZ: { region: 'africa', slug: 'wz' }, // Eswatini
  GW: { region: 'africa', slug: 'pu' }, // Guinea-Bissau
  LS: { region: 'africa', slug: 'lt' }, // Lesotho
  LR: { region: 'africa', slug: 'li' }, // Liberia
  MW: { region: 'africa', slug: 'mi' }, // Malawi
  MZ: { region: 'africa', slug: 'mz' },
  NE: { region: 'africa', slug: 'ng' }, // Niger
  NG: { region: 'africa', slug: 'ni' }, // Nigeria
  ZA: { region: 'africa', slug: 'sf' }, // South Africa
  SS: { region: 'africa', slug: 'od' }, // South Sudan
  SD: { region: 'africa', slug: 'su' }, // Sudan
  TZ: { region: 'africa', slug: 'tz' },
  TG: { region: 'africa', slug: 'to' }, // Togo
  TN: { region: 'africa', slug: 'ts' }, // Tunisia
  ZM: { region: 'africa', slug: 'za' }, // Zambia
  ZW: { region: 'africa', slug: 'zi' }, // Zimbabwe
  EH: { region: 'africa', slug: 'wi' }, // Western Sahara
  AF: { region: 'south-asia', slug: 'af' },
  BD: { region: 'south-asia', slug: 'bg' }, // Bangladesh
  BT: { region: 'south-asia', slug: 'bt' },
  IN: { region: 'south-asia', slug: 'in' },
  MV: { region: 'south-asia', slug: 'mv' },
  NP: { region: 'south-asia', slug: 'np' },
  PK: { region: 'south-asia', slug: 'pk' },
  LK: { region: 'south-asia', slug: 'ce' }, // Sri Lanka (Ceylon)
  KZ: { region: 'central-asia', slug: 'kz' },
  KG: { region: 'central-asia', slug: 'kg' },
  TJ: { region: 'central-asia', slug: 'ti' }, // Tajikistan
  TM: { region: 'central-asia', slug: 'tx' }, // Turkmenistan
  UZ: { region: 'central-asia', slug: 'uz' },
  CN: { region: 'east-n-southeast-asia', slug: 'ch' }, // China
  JP: { region: 'east-n-southeast-asia', slug: 'ja' },
  KP: { region: 'east-n-southeast-asia', slug: 'kn' }, // North Korea
  KR: { region: 'east-n-southeast-asia', slug: 'ks' }, // South Korea
  MN: { region: 'east-n-southeast-asia', slug: 'mg' }, // Mongolia
  TW: { region: 'east-n-southeast-asia', slug: 'tw' },
  BN: { region: 'east-n-southeast-asia', slug: 'bx' }, // Brunei
  KH: { region: 'east-n-southeast-asia', slug: 'cb' }, // Cambodia
  ID: { region: 'east-n-southeast-asia', slug: 'id' },
  LA: { region: 'east-n-southeast-asia', slug: 'la' },
  MY: { region: 'east-n-southeast-asia', slug: 'my' },
  MM: { region: 'east-n-southeast-asia', slug: 'bm' }, // Myanmar (Burma)
  PH: { region: 'east-n-southeast-asia', slug: 'rp' }, // Philippines
  SG: { region: 'east-n-southeast-asia', slug: 'sn' }, // Singapore
  TH: { region: 'east-n-southeast-asia', slug: 'th' },
  TL: { region: 'east-n-southeast-asia', slug: 'tt' }, // Timor-Leste
  VN: { region: 'east-n-southeast-asia', slug: 'vm' }, // Vietnam
  AL: { region: 'europe', slug: 'al' },
  AD: { region: 'europe', slug: 'an' }, // Andorra
  AT: { region: 'europe', slug: 'au' }, // Austria
  BY: { region: 'europe', slug: 'bo' }, // Belarus
  BE: { region: 'europe', slug: 'be' },
  BA: { region: 'europe', slug: 'bk' }, // Bosnia
  BG: { region: 'europe', slug: 'bu' }, // Bulgaria
  HR: { region: 'europe', slug: 'hr' },
  CZ: { region: 'europe', slug: 'ez' }, // Czechia
  DK: { region: 'europe', slug: 'da' },
  EE: { region: 'europe', slug: 'en' }, // Estonia
  FI: { region: 'europe', slug: 'fi' },
  FR: { region: 'europe', slug: 'fr' },
  DE: { region: 'europe', slug: 'gm' }, // Germany
  GR: { region: 'europe', slug: 'gr' },
  HU: { region: 'europe', slug: 'hu' },
  IS: { region: 'europe', slug: 'ic' }, // Iceland
  IE: { region: 'europe', slug: 'ei' }, // Ireland
  IT: { region: 'europe', slug: 'it' },
  XK: { region: 'europe', slug: 'kv' }, // Kosovo
  LV: { region: 'europe', slug: 'lg' }, // Latvia
  LI: { region: 'europe', slug: 'ls' }, // Liechtenstein
  LT: { region: 'europe', slug: 'lh' }, // Lithuania
  LU: { region: 'europe', slug: 'lu' },
  MT: { region: 'europe', slug: 'mt' },
  MD: { region: 'europe', slug: 'md' },
  MC: { region: 'europe', slug: 'mn' }, // Monaco
  ME: { region: 'europe', slug: 'mj' }, // Montenegro
  NL: { region: 'europe', slug: 'nl' },
  MK: { region: 'europe', slug: 'mk' }, // North Macedonia
  NO: { region: 'europe', slug: 'no' },
  PL: { region: 'europe', slug: 'pl' },
  PT: { region: 'europe', slug: 'po' }, // Portugal
  RO: { region: 'europe', slug: 'ro' },
  RU: { region: 'central-asia', slug: 'rs' }, // Russia
  SM: { region: 'europe', slug: 'sm' },
  RS: { region: 'europe', slug: 'ri' }, // Serbia
  SK: { region: 'europe', slug: 'lo' }, // Slovakia (Loveckia? actually 'lo' is Slovakia)
  SI: { region: 'europe', slug: 'si' },
  ES: { region: 'europe', slug: 'sp' }, // Spain
  SE: { region: 'europe', slug: 'sw' }, // Sweden
  CH: { region: 'europe', slug: 'sz' }, // Switzerland
  UA: { region: 'europe', slug: 'up' }, // Ukraine
  VA: { region: 'europe', slug: 'vt' }, // Vatican
  AM: { region: 'middle-east', slug: 'am' },
  AZ: { region: 'middle-east', slug: 'aj' }, // Azerbaijan
  BH: { region: 'middle-east', slug: 'ba' }, // Bahrain
  CY: { region: 'europe', slug: 'cy' },
  GE: { region: 'middle-east', slug: 'gg' }, // Georgia
  IR: { region: 'middle-east', slug: 'ir' },
  IQ: { region: 'middle-east', slug: 'iz' }, // Iraq
  IL: { region: 'middle-east', slug: 'is' }, // Israel
  JO: { region: 'middle-east', slug: 'jo' },
  KW: { region: 'middle-east', slug: 'ku' }, // Kuwait
  LB: { region: 'middle-east', slug: 'le' }, // Lebanon
  OM: { region: 'middle-east', slug: 'mu' }, // Oman
  PS: { region: 'middle-east', slug: 'we' }, // West Bank/Palestine — closest match
  QA: { region: 'middle-east', slug: 'qa' },
  SA: { region: 'middle-east', slug: 'sa' },
  SY: { region: 'middle-east', slug: 'sy' },
  TR: { region: 'middle-east', slug: 'tu' }, // Turkey
  AE: { region: 'middle-east', slug: 'ae' },
  YE: { region: 'middle-east', slug: 'ym' }, // Yemen
  CA: { region: 'north-america', slug: 'ca' },
  MX: { region: 'north-america', slug: 'mx' },
  AU: { region: 'australia-oceania', slug: 'as' }, // Australia
  FJ: { region: 'australia-oceania', slug: 'fj' },
  KI: { region: 'australia-oceania', slug: 'kr' }, // Kiribati
  MH: { region: 'australia-oceania', slug: 'rm' }, // Marshall Islands
  FM: { region: 'australia-oceania', slug: 'fm' },
  NR: { region: 'australia-oceania', slug: 'nr' }, // Nauru
  NZ: { region: 'australia-oceania', slug: 'nz' },
  PW: { region: 'australia-oceania', slug: 'ps' }, // Palau
  PG: { region: 'east-n-southeast-asia', slug: 'pp' }, // Papua New Guinea
  WS: { region: 'australia-oceania', slug: 'ws' },
  SB: { region: 'australia-oceania', slug: 'bp' }, // Solomon Islands
  TO: { region: 'australia-oceania', slug: 'tn' }, // Tonga
  TV: { region: 'australia-oceania', slug: 'tv' },
  VU: { region: 'australia-oceania', slug: 'nh' }, // Vanuatu (New Hebrides)
  AR: { region: 'south-america', slug: 'ar' },
  BO: { region: 'south-america', slug: 'bl' }, // Bolivia
  BR: { region: 'south-america', slug: 'br' },
  CL: { region: 'south-america', slug: 'ci' }, // Chile
  CO: { region: 'south-america', slug: 'co' },
  EC: { region: 'south-america', slug: 'ec' },
  GY: { region: 'south-america', slug: 'gy' },
  PY: { region: 'south-america', slug: 'pa' }, // Paraguay
  PE: { region: 'south-america', slug: 'pe' },
  SR: { region: 'south-america', slug: 'ns' }, // Suriname
  UY: { region: 'south-america', slug: 'uy' },
  VE: { region: 'south-america', slug: 've' },
  AG: { region: 'central-america-n-caribbean', slug: 'ac' }, // Antigua
  BS: { region: 'central-america-n-caribbean', slug: 'bf' }, // Bahamas
  BB: { region: 'central-america-n-caribbean', slug: 'bb' },
  BZ: { region: 'central-america-n-caribbean', slug: 'bh' }, // Belize
  CR: { region: 'central-america-n-caribbean', slug: 'cs' }, // Costa Rica
  CU: { region: 'central-america-n-caribbean', slug: 'cu' },
  DM: { region: 'central-america-n-caribbean', slug: 'do' }, // Dominica
  DO: { region: 'central-america-n-caribbean', slug: 'dr' }, // Dominican Republic
  SV: { region: 'central-america-n-caribbean', slug: 'es' }, // El Salvador
  GD: { region: 'central-america-n-caribbean', slug: 'gj' }, // Grenada
  GT: { region: 'central-america-n-caribbean', slug: 'gt' },
  HT: { region: 'central-america-n-caribbean', slug: 'ha' }, // Haiti
  HN: { region: 'central-america-n-caribbean', slug: 'ho' }, // Honduras
  JM: { region: 'central-america-n-caribbean', slug: 'jm' },
  NI: { region: 'central-america-n-caribbean', slug: 'nu' }, // Nicaragua
  PA: { region: 'central-america-n-caribbean', slug: 'pm' }, // Panama
  KN: { region: 'central-america-n-caribbean', slug: 'sc' }, // St Kitts and Nevis
  LC: { region: 'central-america-n-caribbean', slug: 'st' }, // St Lucia
  VC: { region: 'central-america-n-caribbean', slug: 'vc' },
  TT: { region: 'central-america-n-caribbean', slug: 'td' }, // Trinidad
  DZ: { region: 'africa', slug: 'ag' }, // Algeria
  AO: { region: 'africa', slug: 'ao' },
  BJ: { region: 'africa', slug: 'bn' }, // Benin
  BW: { region: 'africa', slug: 'bc' }, // Botswana
  BF: { region: 'africa', slug: 'uv' }, // Burkina Faso
  BI: { region: 'africa', slug: 'by' }, // Burundi
  CM: { region: 'africa', slug: 'cm' },
  DJ: { region: 'africa', slug: 'dj' },
  EG: { region: 'africa', slug: 'eg' },
  ET: { region: 'africa', slug: 'et' },
  GA: { region: 'africa', slug: 'gb' }, // Gabon
  GM: { region: 'africa', slug: 'ga' }, // Gambia
  GH: { region: 'africa', slug: 'gh' },
  GN: { region: 'africa', slug: 'gv' }, // Guinea
  KE: { region: 'africa', slug: 'ke' },
  LY: { region: 'africa', slug: 'ly' },
  MG: { region: 'africa', slug: 'ma' }, // Madagascar
  ML: { region: 'africa', slug: 'ml' },
  MR: { region: 'africa', slug: 'mr' },
  MU: { region: 'africa', slug: 'mp' }, // Mauritius
  MA: { region: 'africa', slug: 'mo' }, // Morocco
  NA: { region: 'africa', slug: 'wa' }, // Namibia
  RW: { region: 'africa', slug: 'rw' },
  ST: { region: 'africa', slug: 'tp' }, // São Tomé
  SN: { region: 'africa', slug: 'sg' }, // Senegal
  SC: { region: 'africa', slug: 'se' }, // Seychelles
  SL: { region: 'africa', slug: 'sl' },
  SO: { region: 'africa', slug: 'so' },
  UG: { region: 'africa', slug: 'ug' },
};

// Factbook GEC slugs for dependent territories the CIA World Factbook tracks
// separately from their sovereign country. Overseas France regions (RE, YT,
// GP, MQ, GF, BL, MF, PM), Caribbean Netherlands (BQ), Bouvet (BV), and
// Åland (AX) are not tracked separately and so are omitted here — their
// territory pages render without Factbook-sourced fields (government type,
// religions, independence).
const TERRITORY_FACTBOOK_OVERRIDES: Record<string, { region: string; slug: string }> = {
  // US
  PR: { region: 'central-america-n-caribbean', slug: 'rq' },
  GU: { region: 'australia-oceania', slug: 'gq' },
  VI: { region: 'central-america-n-caribbean', slug: 'vq' },
  AS: { region: 'australia-oceania', slug: 'aq' },
  MP: { region: 'australia-oceania', slug: 'cq' },
  // UK — Overseas Territories + Crown Dependencies
  BM: { region: 'north-america', slug: 'bd' },
  VG: { region: 'central-america-n-caribbean', slug: 'vi' },
  KY: { region: 'central-america-n-caribbean', slug: 'cj' },
  GI: { region: 'europe', slug: 'gi' },
  FK: { region: 'south-america', slug: 'fk' },
  TC: { region: 'central-america-n-caribbean', slug: 'tk' },
  MS: { region: 'central-america-n-caribbean', slug: 'mh' },
  AI: { region: 'central-america-n-caribbean', slug: 'av' },
  SH: { region: 'africa', slug: 'sh' },
  PN: { region: 'australia-oceania', slug: 'pc' },
  IO: { region: 'south-asia', slug: 'io' },
  IM: { region: 'europe', slug: 'im' },
  JE: { region: 'europe', slug: 'je' },
  GG: { region: 'europe', slug: 'gk' },
  // France — only overseas collectivities the Factbook covers separately
  NC: { region: 'australia-oceania', slug: 'nc' },
  PF: { region: 'australia-oceania', slug: 'fp' },
  WF: { region: 'australia-oceania', slug: 'wf' },
  // Netherlands
  AW: { region: 'central-america-n-caribbean', slug: 'aa' },
  CW: { region: 'central-america-n-caribbean', slug: 'uc' },
  SX: { region: 'central-america-n-caribbean', slug: 'nn' },
  // Denmark
  GL: { region: 'north-america', slug: 'gl' },
  FO: { region: 'europe', slug: 'fo' },
  // Australia
  CX: { region: 'australia-oceania', slug: 'kt' },
  CC: { region: 'australia-oceania', slug: 'ck' },
  NF: { region: 'australia-oceania', slug: 'nf' },
  // New Zealand
  CK: { region: 'australia-oceania', slug: 'cw' },
  NU: { region: 'australia-oceania', slug: 'ne' },
  TK: { region: 'australia-oceania', slug: 'tl' },
  // China
  HK: { region: 'east-n-southeast-asia', slug: 'hk' },
  MO: { region: 'east-n-southeast-asia', slug: 'mc' },
  // Norway
  SJ: { region: 'europe', slug: 'sv' },
};

// Merge territories into the main overrides map so fetchFactbookEntry finds them
Object.assign(FACTBOOK_OVERRIDES, TERRITORY_FACTBOOK_OVERRIDES);

interface FactbookData {
  governmentType?: string;
  religions?: { name: string; percent?: number }[];
  independence?: string;
}

function parseReligions(text: string): { name: string; percent?: number }[] {
  // Use only the first paragraph — Factbook often appends a second snapshot
  // separated by <br><br> (e.g. UY has a 2023 summary after the detailed list).
  // Mixing them produces incoherent results like "Roman Catholic 42%" from
  // one snapshot and "Protestant 5%" from the other.
  const firstPara = text.split(/<br\s*\/?>\s*<br\s*\/?>/i)[0];
  // Pre-process: clean common Factbook artifacts
  const preprocessed = firstPara
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;\s*/g, '') // "< 0.1%" → "0.1%"
    .replace(/&gt;\s*/g, '')
    .replace(/(\d+)\/(\d+)%/g, '$1.$2%') // "93/1%" typo → "93.1%"
    .replace(/<br\s*\/?>/gi, ' ');
  // Strip parenthetical years/notes/sub-breakdowns. Apply iteratively so nested
  // parens like "Protestant 5% (Evangelical (non-specific) 4.6%, ...)" collapse
  // fully — otherwise sub-entries leak as duplicate top-level religions.
  let stripped = preprocessed;
  let prev: string;
  do {
    prev = stripped;
    stripped = stripped.replace(/\([^()]*\)/g, ' ');
  } while (stripped !== prev);
  const cleaned = stripped.replace(/\s+/g, ' ').trim();
  // Match "Name 12.3%", "Name 12%", "Name 81-90%" (range), or "Name 12" (missing %).
  // Allow comma between name and number for stray-comma entries like "Muslim, 1.3%".
  // Require % OR a following comma/end-of-string to avoid matching stray numbers.
  const re = /([A-Za-z][A-Za-z\s\-'/.]+?)[,\s]+(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?(?:%|(?=\s*,|\s*$))/g;
  const out: { name: string; percent?: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    let name = m[1].trim().replace(/^[, ]+/, '').replace(/\s+(or|and)\s+\S+$/, '').trim();
    // Strip leading "or " (from list fragments like "or other traditional African religions")
    name = name.replace(/^or\s+/i, '');
    // Strip trailing qualifiers from numbers ("Roman Catholic more than 90%")
    name = name.replace(/\s+(more than|less than|approximately|about)$/i, '').trim();
    const normalized = normalizeReligionName(name);
    if (normalized === null) {
      // Drop garbage entries (parser artifacts like "less than", "note - ...")
      continue;
    }
    name = normalized;
    const lo = parseFloat(m[2]);
    const hi = m[3] !== undefined ? parseFloat(m[3]) : undefined;
    const percent = hi !== undefined ? Math.round(((lo + hi) / 2) * 10) / 10 : lo;
    if (name.length > 0 && name.length < 100 && percent <= 100) {
      out.push({ name, percent });
    }
    if (out.length >= 12) break;
  }
  // Dedupe: after normalization, multiple raw entries can collapse onto the
  // same canonical bucket (e.g. "other Christian" → "Protestant" alongside an
  // existing "Protestant"). Sum so the combined share is preserved.
  const byKey = new Map<string, { name: string; percent: number }>();
  for (const r of out) {
    if (typeof r.percent !== 'number') continue;
    const key = r.name.toLowerCase();
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { name: r.name, percent: r.percent });
    } else {
      existing.percent = Math.round((existing.percent + r.percent) * 10) / 10;
    }
  }
  return Array.from(byKey.values());
}

// Canonical religion-name buckets. Maps lowercased raw labels to a display
// name; returns null for parser artifacts that should be dropped entirely.
const RELIGION_NAME_MAP: Record<string, string> = {
  // Religion vs adherent normalization
  'islam': 'Muslim',
  'christianity': 'Christian',
  'buddhism': 'Buddhist',
  'hinduism': 'Hindu',
  'judaism': 'Jewish',
  // Catholic
  'catholic': 'Roman Catholic',
  // Orthodox (generic — keep national orthodox churches like Greek/Russian distinct)
  'eastern orthodox': 'Orthodox',
  'eastern orthodox christian': 'Orthodox',
  'christian orthodox': 'Orthodox',
  // Muslim sub-categories
  'sunni muslim': 'Muslim',
  // Other Christian → Protestant (per user request)
  'other christian': 'Protestant',
  'other christians': 'Protestant',
  'other christians and traditions related to christ': 'Protestant',
  // Other Evangelical Churches → Evangelical
  'other evangelical churches': 'Evangelical',
  'evangelical christian': 'Evangelical',
  // Other minor consolidations
  'other protestant': 'Protestant',
  'animiste': 'Animist',
  'lamaistic buddhist': 'Buddhist',
  // Factbook "Church of Jesus Christ" = The Church of Jesus Christ of
  // Latter-day Saints (LDS / Mormon). Use the church's own modern self-name,
  // which is also more specific than the bare "Church of Jesus Christ".
  'church of jesus christ': 'Latter-day Saint',
  // Jehovah's Witness spelling fix
  'jehovah witness': "Jehovah's Witness",
  // Vodou spelling
  'vodoun': 'Vodou',
  // None bucket — explicit no religion / non-believers
  'none': 'None',
  'no religion': 'None',
  'nothing in particular': 'None',
  'non-believers': 'None',
  'non-believer': 'None',
  'non-believer/agnostic': 'None',
  'nonbeliever/agnostic': 'None',
  'none/atheist': 'None',
  // Agnostic / atheist — capitalize for visual consistency with other buckets
  'agnostic': 'Agnostic',
  'agnostics': 'Agnostic',
  'atheist': 'Atheist',
  'agnostic/atheist': 'Agnostic',
  // Unspecified bucket — didn't answer / unknown
  'unspecified': 'Unspecified',
  'unknown': 'Unspecified',
  'no answer': 'Unspecified',
  'no response': 'Unspecified',
  "don't know/refused": 'Unspecified',
  "don't know/no answer": 'Unspecified',
  "don't know/no response": 'Unspecified',
  'unspecified/no answer': 'Unspecified',
  'unspecified/none': 'Unspecified',
  'none/unspecified': 'Unspecified',
  'not stated': 'Unspecified',
  'not applicable': 'Unspecified',
  'other/not stated': 'Unspecified',
  'undeclared': 'Unspecified',
  'undeclared/no answer': 'Unspecified',
  'objected to answering': 'Unspecified',
  'refused to answer': 'Unspecified',
  // Unaffiliated belongs here, not None — many "unaffiliated" respondents are
  // non-denominational believers (personal faith outside any formal church),
  // distinct from explicitly nonreligious "none" respondents.
  'unaffiliated': 'Unspecified',
  // Other (capitalize and consolidate variants)
  'other': 'Other',
  'other religion': 'Other',
  'other religions': 'Other',
  'other religions and traditional spirituality': 'Other',
  'other/none/unspecified': 'Other',
  'other non-christian': 'Other',
  // Believer (capitalize)
  'believer': 'Believer',
  'believer but not belonging to a church': 'Believer',
  'believers unaffiliated with a religious society': 'Believer',
  // Animist case
  'animist': 'Animist',
};

// Names that are parser artifacts, not real religions — drop entirely.
const RELIGION_DROP_PATTERNS: RegExp[] = [
  /^(less than|more than|approximately|about)$/i,
  /^note\b/i,
];

function normalizeReligionName(rawName: string): string | null {
  const trimmed = rawName.trim();
  if (!trimmed) return null;
  for (const re of RELIGION_DROP_PATTERNS) {
    if (re.test(trimmed)) return null;
  }
  const mapped = RELIGION_NAME_MAP[trimmed.toLowerCase()];
  return mapped ?? trimmed;
}

function parseIndependence(text: string): string | undefined {
  // Look for a 4-digit year
  const m = text.match(/\b(1[5-9]\d{2}|20\d{2})\b/);
  return m ? m[1] : undefined;
}

function cleanGovernmentType(text: string): string {
  // Take only the first sentence/clause and strip trailing notes
  const firstClause = text.split(/[;.\n]/)[0].trim();
  // Strip trailing "(formal/short form...)" parens
  return firstClause.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

async function fetchFactbookEntry(region: string, slug: string): Promise<FactbookData | null> {
  const url = `https://raw.githubusercontent.com/factbook/factbook.json/master/${region}/${slug}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as any;

    const out: FactbookData = {};

    const govType = data?.Government?.['Government type']?.text;
    if (typeof govType === 'string' && govType.trim()) {
      out.governmentType = cleanGovernmentType(govType);
    }

    const religions = data?.['People and Society']?.Religions?.text;
    if (typeof religions === 'string' && religions.trim()) {
      const parsed = parseReligions(religions);
      if (parsed.length > 0) out.religions = parsed;
    }

    const indep = data?.Government?.Independence?.text;
    if (typeof indep === 'string' && indep.trim()) {
      const year = parseIndependence(indep);
      if (year) out.independence = year;
    }

    return out;
  } catch {
    return null;
  }
}

async function fetchAllFactbook(
  cca2List: string[],
): Promise<Map<string, FactbookData>> {
  console.log('Fetching Factbook entries…');
  const out = new Map<string, FactbookData>();
  const misses: string[] = [];

  // Fetch in batches of 8 to be polite to GitHub
  const BATCH = 8;
  for (let i = 0; i < cca2List.length; i += BATCH) {
    const batch = cca2List.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (cca2) => {
        const override = FACTBOOK_OVERRIDES[cca2];
        if (!override) return { cca2, data: null as FactbookData | null };
        const data = await fetchFactbookEntry(override.region, override.slug);
        return { cca2, data };
      }),
    );
    for (const { cca2, data } of results) {
      if (data) out.set(cca2, data);
      else misses.push(cca2);
    }
    process.stdout.write(`  ${Math.min(i + BATCH, cca2List.length)}/${cca2List.length}\r`);
  }
  console.log(`\n  got ${out.size} factbook entries (${misses.length} misses)`);
  if (misses.length > 0) {
    console.log(`  missing: ${misses.join(', ')}`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function serializeFacts(facts: CountryFacts): string {
  const lines: string[] = [];
  if (facts.population !== undefined) lines.push(`    population: ${facts.population}`);
  if (facts.area !== undefined) lines.push(`    area: ${facts.area}`);
  if (facts.capital) lines.push(`    capital: ${JSON.stringify(facts.capital)}`);
  if (facts.languages) lines.push(`    languages: ${JSON.stringify(facts.languages)}`);
  if (facts.currencies) lines.push(`    currencies: ${JSON.stringify(facts.currencies)}`);
  if (facts.demonym) lines.push(`    demonym: ${JSON.stringify(facts.demonym)}`);
  if (facts.drivingSide) lines.push(`    drivingSide: ${JSON.stringify(facts.drivingSide)}`);
  if (facts.timezones) lines.push(`    timezones: ${JSON.stringify(facts.timezones)}`);
  if (facts.borders) lines.push(`    borders: ${JSON.stringify(facts.borders)}`);
  if (facts.subregion) lines.push(`    subregion: ${JSON.stringify(facts.subregion)}`);
  if (facts.independence) lines.push(`    independence: ${JSON.stringify(facts.independence)}`);
  if (facts.governmentType) lines.push(`    governmentType: ${JSON.stringify(facts.governmentType)}`);
  if (facts.religions) lines.push(`    religions: ${JSON.stringify(facts.religions)}`);
  return lines.join(',\n');
}

async function main() {
  const { byCca2 } = await fetchRestCountries();

  // Pull list of country/territory codes from the project's data files so we
  // include territories too (REST Countries does cover most of them).
  const projectCountries = await import('../src/data/countries.js');
  const projectTerritories = await import('../src/data/territories.js');
  const allCodes = new Set<string>([
    ...projectCountries.countries.map((c: any) => c.code),
    ...projectTerritories.territories.map((t: any) => t.code),
  ]);

  // Factbook covers all sovereign countries plus the dependent territories
  // enumerated in TERRITORY_FACTBOOK_OVERRIDES. Territories not in that map
  // (e.g. overseas France regions folded into the France entry, Caribbean
  // Netherlands, Antarctica) are skipped and render Factbook fields as absent.
  const sovereignCodes = projectCountries.countries.map((c: any) => c.code);
  const territoryFactbookCodes = Object.keys(TERRITORY_FACTBOOK_OVERRIDES);
  const factbookByCca2 = await fetchAllFactbook([...sovereignCodes, ...territoryFactbookCodes]);

  // Merge
  const merged = new Map<string, CountryFacts>();
  for (const code of allCodes) {
    const upper = code.toUpperCase();
    const rest = byCca2.get(upper);
    const fb = factbookByCca2.get(upper);
    if (!rest && !fb) continue;
    const facts: CountryFacts = { ...(rest ?? {}) };
    if (fb?.governmentType) facts.governmentType = fb.governmentType;
    if (fb?.religions) facts.religions = fb.religions;
    if (fb?.independence) facts.independence = fb.independence;
    merged.set(upper, facts);
  }

  // Sort keys alphabetically for stable diffs
  const sorted = [...merged.entries()].sort(([a], [b]) => a.localeCompare(b));

  const body =
    sorted
      .map(([code, facts]) => `  ${JSON.stringify(code)}: {\n${serializeFacts(facts)},\n  }`)
      .join(',\n') + (sorted.length ? ',' : '');

  const out = `// Auto-generated by scripts/fetch-country-data.ts.
// Do not edit by hand — re-run \`npm run sync-data\` to refresh.
//
// Sources:
//   - REST Countries v3.1 (restcountries.com)
//   - CIA World Factbook via factbook/factbook.json on GitHub

export interface CountryFacts {
  population?: number;
  area?: number;
  capital?: string;
  languages?: string[];
  currencies?: { code: string; name: string; symbol: string }[];
  demonym?: string;
  drivingSide?: 'left' | 'right';
  timezones?: string[];
  borders?: string[]; // ISO alpha-2 codes
  subregion?: string;
  independence?: string;
  governmentType?: string;
  religions?: { name: string; percent?: number }[];
}

export const countryFacts: Record<string, CountryFacts> = {
${body}
};

export function getCountryFacts(code: string): CountryFacts | undefined {
  return countryFacts[code.toUpperCase()];
}
`;

  fs.writeFileSync(OUT_PATH, out, 'utf-8');
  console.log(`\nWrote ${OUT_PATH} — ${sorted.length} entries`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
