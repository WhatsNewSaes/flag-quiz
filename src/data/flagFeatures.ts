// Visual features for flag similarity matching in Jeopardy hard mode

export type FlagColor = 'red' | 'blue' | 'green' | 'yellow' | 'white' | 'black' | 'orange' | 'maroon';
export type FlagPattern = 'horizontal-stripes' | 'vertical-stripes' | 'diagonal' | 'cross' | 'canton' | 'solid' | 'complex';

export interface FlagFeatures {
  colors: FlagColor[];
  patterns: FlagPattern[];
}

// Map of country code to flag features
export const flagFeatures: Record<string, FlagFeatures> = {
  // Africa
  DZ: { colors: ['green', 'white', 'red'], patterns: ['vertical-stripes'] },
  AO: { colors: ['red', 'black', 'yellow'], patterns: ['horizontal-stripes'] },
  BJ: { colors: ['green', 'yellow', 'red'], patterns: ['vertical-stripes'] },
  BW: { colors: ['blue', 'white', 'black'], patterns: ['horizontal-stripes'] },
  BF: { colors: ['red', 'green', 'yellow'], patterns: ['horizontal-stripes'] },
  BI: { colors: ['red', 'green', 'white'], patterns: ['diagonal'] },
  CM: { colors: ['green', 'red', 'yellow'], patterns: ['vertical-stripes'] },
  CV: { colors: ['blue', 'white', 'red'], patterns: ['horizontal-stripes'] },
  CF: { colors: ['blue', 'white', 'green', 'yellow', 'red'], patterns: ['horizontal-stripes'] },
  TD: { colors: ['blue', 'yellow', 'red'], patterns: ['vertical-stripes'] },
  KM: { colors: ['green', 'white', 'red', 'blue', 'yellow'], patterns: ['horizontal-stripes'] },
  CD: { colors: ['blue', 'red', 'yellow'], patterns: ['diagonal'] },
  CG: { colors: ['green', 'yellow', 'red'], patterns: ['diagonal'] },
  DJ: { colors: ['blue', 'green', 'white', 'red'], patterns: ['complex'] },
  EG: { colors: ['red', 'white', 'black'], patterns: ['horizontal-stripes'] },
  GQ: { colors: ['green', 'white', 'red', 'blue'], patterns: ['horizontal-stripes'] },
  ER: { colors: ['green', 'blue', 'red'], patterns: ['diagonal'] },
  SZ: { colors: ['blue', 'yellow', 'red', 'black', 'white'], patterns: ['horizontal-stripes'] },
  ET: { colors: ['green', 'yellow', 'red', 'blue'], patterns: ['horizontal-stripes'] },
  GA: { colors: ['green', 'yellow', 'blue'], patterns: ['horizontal-stripes'] },
  GM: { colors: ['red', 'blue', 'green', 'white'], patterns: ['horizontal-stripes'] },
  GH: { colors: ['red', 'yellow', 'green', 'black'], patterns: ['horizontal-stripes'] },
  GN: { colors: ['red', 'yellow', 'green'], patterns: ['vertical-stripes'] },
  GW: { colors: ['red', 'yellow', 'green', 'black'], patterns: ['vertical-stripes'] },
  CI: { colors: ['orange', 'white', 'green'], patterns: ['vertical-stripes'] },
  KE: { colors: ['black', 'red', 'green', 'white'], patterns: ['horizontal-stripes'] },
  LS: { colors: ['blue', 'white', 'green', 'black'], patterns: ['horizontal-stripes'] },
  LR: { colors: ['red', 'white', 'blue'], patterns: ['horizontal-stripes', 'canton'] },
  LY: { colors: ['red', 'black', 'green', 'white'], patterns: ['horizontal-stripes'] },
  MG: { colors: ['red', 'green', 'white'], patterns: ['vertical-stripes'] },
  MW: { colors: ['black', 'red', 'green'], patterns: ['horizontal-stripes'] },
  ML: { colors: ['green', 'yellow', 'red'], patterns: ['vertical-stripes'] },
  MR: { colors: ['green', 'yellow', 'red'], patterns: ['solid'] },
  MU: { colors: ['red', 'blue', 'yellow', 'green'], patterns: ['horizontal-stripes'] },
  MA: { colors: ['red', 'green'], patterns: ['solid'] },
  MZ: { colors: ['green', 'black', 'yellow', 'white', 'red'], patterns: ['horizontal-stripes'] },
  NA: { colors: ['blue', 'red', 'green', 'white', 'yellow'], patterns: ['diagonal'] },
  NE: { colors: ['orange', 'white', 'green'], patterns: ['horizontal-stripes'] },
  NG: { colors: ['green', 'white'], patterns: ['vertical-stripes'] },
  RW: { colors: ['blue', 'yellow', 'green'], patterns: ['horizontal-stripes'] },
  ST: { colors: ['green', 'yellow', 'red', 'black'], patterns: ['horizontal-stripes'] },
  SN: { colors: ['green', 'yellow', 'red'], patterns: ['vertical-stripes'] },
  SC: { colors: ['blue', 'yellow', 'red', 'white', 'green'], patterns: ['diagonal'] },
  SL: { colors: ['green', 'white', 'blue'], patterns: ['horizontal-stripes'] },
  SO: { colors: ['blue', 'white'], patterns: ['solid'] },
  ZA: { colors: ['red', 'blue', 'green', 'yellow', 'black', 'white'], patterns: ['complex'] },
  SS: { colors: ['black', 'red', 'green', 'white', 'blue', 'yellow'], patterns: ['horizontal-stripes'] },
  SD: { colors: ['red', 'white', 'black', 'green'], patterns: ['horizontal-stripes'] },
  TZ: { colors: ['green', 'blue', 'black', 'yellow'], patterns: ['diagonal'] },
  TG: { colors: ['green', 'yellow', 'red', 'white'], patterns: ['horizontal-stripes', 'canton'] },
  TN: { colors: ['red', 'white'], patterns: ['solid'] },
  UG: { colors: ['black', 'yellow', 'red', 'white'], patterns: ['horizontal-stripes'] },
  ZM: { colors: ['green', 'red', 'black', 'orange'], patterns: ['solid'] },
  ZW: { colors: ['green', 'yellow', 'red', 'black', 'white'], patterns: ['horizontal-stripes'] },

  // Asia
  AF: { colors: ['black', 'red', 'green', 'white'], patterns: ['vertical-stripes'] },
  AM: { colors: ['red', 'blue', 'orange'], patterns: ['horizontal-stripes'] },
  AZ: { colors: ['blue', 'red', 'green', 'white'], patterns: ['horizontal-stripes'] },
  BH: { colors: ['red', 'white'], patterns: ['vertical-stripes'] },
  BD: { colors: ['green', 'red'], patterns: ['solid'] },
  BT: { colors: ['orange', 'yellow', 'white'], patterns: ['diagonal'] },
  BN: { colors: ['yellow', 'white', 'black', 'red'], patterns: ['diagonal'] },
  KH: { colors: ['blue', 'red', 'white'], patterns: ['horizontal-stripes'] },
  CN: { colors: ['red', 'yellow'], patterns: ['solid'] },
  CY: { colors: ['white', 'orange', 'green'], patterns: ['solid'] },
  GE: { colors: ['white', 'red'], patterns: ['cross'] },
  IN: { colors: ['orange', 'white', 'green', 'blue'], patterns: ['horizontal-stripes'] },
  ID: { colors: ['red', 'white'], patterns: ['horizontal-stripes'] },
  IR: { colors: ['green', 'white', 'red'], patterns: ['horizontal-stripes'] },
  IQ: { colors: ['red', 'white', 'black', 'green'], patterns: ['horizontal-stripes'] },
  IL: { colors: ['blue', 'white'], patterns: ['horizontal-stripes'] },
  JP: { colors: ['white', 'red'], patterns: ['solid'] },
  JO: { colors: ['black', 'white', 'green', 'red'], patterns: ['horizontal-stripes'] },
  KZ: { colors: ['blue', 'yellow'], patterns: ['solid'] },
  KW: { colors: ['green', 'white', 'red', 'black'], patterns: ['horizontal-stripes'] },
  KG: { colors: ['red', 'yellow'], patterns: ['solid'] },
  LA: { colors: ['red', 'blue', 'white'], patterns: ['horizontal-stripes'] },
  LB: { colors: ['red', 'white', 'green'], patterns: ['horizontal-stripes'] },
  MY: { colors: ['red', 'white', 'blue', 'yellow'], patterns: ['horizontal-stripes', 'canton'] },
  MV: { colors: ['red', 'green', 'white'], patterns: ['solid'] },
  MN: { colors: ['red', 'blue', 'yellow'], patterns: ['vertical-stripes'] },
  MM: { colors: ['yellow', 'green', 'red', 'white'], patterns: ['horizontal-stripes'] },
  NP: { colors: ['red', 'blue', 'white'], patterns: ['complex'] },
  KP: { colors: ['blue', 'red', 'white'], patterns: ['horizontal-stripes'] },
  OM: { colors: ['red', 'white', 'green'], patterns: ['vertical-stripes'] },
  PK: { colors: ['green', 'white'], patterns: ['vertical-stripes'] },
  PS: { colors: ['black', 'white', 'green', 'red'], patterns: ['horizontal-stripes'] },
  PH: { colors: ['blue', 'red', 'white', 'yellow'], patterns: ['horizontal-stripes'] },
  QA: { colors: ['maroon', 'white'], patterns: ['vertical-stripes'] },
  SA: { colors: ['green', 'white'], patterns: ['solid'] },
  SG: { colors: ['red', 'white'], patterns: ['horizontal-stripes'] },
  KR: { colors: ['white', 'red', 'blue', 'black'], patterns: ['solid'] },
  LK: { colors: ['maroon', 'orange', 'yellow', 'green'], patterns: ['complex'] },
  SY: { colors: ['red', 'white', 'black', 'green'], patterns: ['horizontal-stripes'] },
  TW: { colors: ['red', 'blue', 'white'], patterns: ['canton'] },
  TJ: { colors: ['red', 'white', 'green', 'yellow'], patterns: ['horizontal-stripes'] },
  TH: { colors: ['red', 'white', 'blue'], patterns: ['horizontal-stripes'] },
  TL: { colors: ['red', 'yellow', 'black', 'white'], patterns: ['complex'] },
  TR: { colors: ['red', 'white'], patterns: ['solid'] },
  TM: { colors: ['green', 'red', 'white'], patterns: ['solid'] },
  AE: { colors: ['red', 'green', 'white', 'black'], patterns: ['horizontal-stripes'] },
  UZ: { colors: ['blue', 'white', 'green', 'red'], patterns: ['horizontal-stripes'] },
  VN: { colors: ['red', 'yellow'], patterns: ['solid'] },
  YE: { colors: ['red', 'white', 'black'], patterns: ['horizontal-stripes'] },

  // Europe
  AL: { colors: ['red', 'black'], patterns: ['solid'] },
  AD: { colors: ['blue', 'yellow', 'red'], patterns: ['vertical-stripes'] },
  AT: { colors: ['red', 'white'], patterns: ['horizontal-stripes'] },
  BY: { colors: ['red', 'green', 'white'], patterns: ['horizontal-stripes'] },
  BE: { colors: ['black', 'yellow', 'red'], patterns: ['vertical-stripes'] },
  BA: { colors: ['blue', 'yellow', 'white'], patterns: ['diagonal'] },
  BG: { colors: ['white', 'green', 'red'], patterns: ['horizontal-stripes'] },
  HR: { colors: ['red', 'white', 'blue'], patterns: ['horizontal-stripes'] },
  CZ: { colors: ['white', 'red', 'blue'], patterns: ['horizontal-stripes'] },
  DK: { colors: ['red', 'white'], patterns: ['cross'] },
  EE: { colors: ['blue', 'black', 'white'], patterns: ['horizontal-stripes'] },
  FI: { colors: ['white', 'blue'], patterns: ['cross'] },
  FR: { colors: ['blue', 'white', 'red'], patterns: ['vertical-stripes'] },
  DE: { colors: ['black', 'red', 'yellow'], patterns: ['horizontal-stripes'] },
  GR: { colors: ['blue', 'white'], patterns: ['horizontal-stripes', 'canton', 'cross'] },
  HU: { colors: ['red', 'white', 'green'], patterns: ['horizontal-stripes'] },
  IS: { colors: ['blue', 'white', 'red'], patterns: ['cross'] },
  IE: { colors: ['green', 'white', 'orange'], patterns: ['vertical-stripes'] },
  IT: { colors: ['green', 'white', 'red'], patterns: ['vertical-stripes'] },
  XK: { colors: ['blue', 'yellow', 'white'], patterns: ['solid'] },
  LV: { colors: ['maroon', 'white'], patterns: ['horizontal-stripes'] },
  LI: { colors: ['blue', 'red', 'yellow'], patterns: ['horizontal-stripes'] },
  LT: { colors: ['yellow', 'green', 'red'], patterns: ['horizontal-stripes'] },
  LU: { colors: ['red', 'white', 'blue'], patterns: ['horizontal-stripes'] },
  MT: { colors: ['white', 'red'], patterns: ['vertical-stripes'] },
  MD: { colors: ['blue', 'yellow', 'red'], patterns: ['vertical-stripes'] },
  MC: { colors: ['red', 'white'], patterns: ['horizontal-stripes'] },
  ME: { colors: ['red', 'yellow'], patterns: ['solid'] },
  NL: { colors: ['red', 'white', 'blue'], patterns: ['horizontal-stripes'] },
  MK: { colors: ['red', 'yellow'], patterns: ['solid'] },
  NO: { colors: ['red', 'white', 'blue'], patterns: ['cross'] },
  PL: { colors: ['white', 'red'], patterns: ['horizontal-stripes'] },
  PT: { colors: ['green', 'red', 'yellow'], patterns: ['vertical-stripes'] },
  RO: { colors: ['blue', 'yellow', 'red'], patterns: ['vertical-stripes'] },
  RU: { colors: ['white', 'blue', 'red'], patterns: ['horizontal-stripes'] },
  SM: { colors: ['white', 'blue'], patterns: ['horizontal-stripes'] },
  RS: { colors: ['red', 'blue', 'white'], patterns: ['horizontal-stripes'] },
  SK: { colors: ['white', 'blue', 'red'], patterns: ['horizontal-stripes'] },
  SI: { colors: ['white', 'blue', 'red'], patterns: ['horizontal-stripes'] },
  ES: { colors: ['red', 'yellow'], patterns: ['horizontal-stripes'] },
  SE: { colors: ['blue', 'yellow'], patterns: ['cross'] },
  CH: { colors: ['red', 'white'], patterns: ['solid'] },
  UA: { colors: ['blue', 'yellow'], patterns: ['horizontal-stripes'] },
  GB: { colors: ['red', 'white', 'blue'], patterns: ['cross'] },
  VA: { colors: ['yellow', 'white'], patterns: ['vertical-stripes'] },

  // North America
  AG: { colors: ['red', 'black', 'blue', 'yellow', 'white'], patterns: ['complex'] },
  BS: { colors: ['blue', 'yellow', 'black'], patterns: ['horizontal-stripes'] },
  BB: { colors: ['blue', 'yellow', 'black'], patterns: ['vertical-stripes'] },
  BZ: { colors: ['blue', 'red', 'white'], patterns: ['horizontal-stripes'] },
  CA: { colors: ['red', 'white'], patterns: ['vertical-stripes'] },
  CR: { colors: ['blue', 'white', 'red'], patterns: ['horizontal-stripes'] },
  CU: { colors: ['blue', 'white', 'red'], patterns: ['horizontal-stripes'] },
  DM: { colors: ['green', 'yellow', 'black', 'white', 'red'], patterns: ['cross'] },
  DO: { colors: ['blue', 'red', 'white'], patterns: ['cross'] },
  SV: { colors: ['blue', 'white'], patterns: ['horizontal-stripes'] },
  GD: { colors: ['red', 'yellow', 'green'], patterns: ['complex'] },
  GT: { colors: ['blue', 'white'], patterns: ['vertical-stripes'] },
  HT: { colors: ['blue', 'red'], patterns: ['horizontal-stripes'] },
  HN: { colors: ['blue', 'white'], patterns: ['horizontal-stripes'] },
  JM: { colors: ['green', 'yellow', 'black'], patterns: ['diagonal'] },
  MX: { colors: ['green', 'white', 'red'], patterns: ['vertical-stripes'] },
  NI: { colors: ['blue', 'white'], patterns: ['horizontal-stripes'] },
  PA: { colors: ['red', 'white', 'blue'], patterns: ['complex'] },
  KN: { colors: ['green', 'red', 'yellow', 'black', 'white'], patterns: ['diagonal'] },
  LC: { colors: ['blue', 'yellow', 'black', 'white'], patterns: ['solid'] },
  VC: { colors: ['blue', 'yellow', 'green'], patterns: ['vertical-stripes'] },
  TT: { colors: ['red', 'white', 'black'], patterns: ['diagonal'] },
  US: { colors: ['red', 'white', 'blue'], patterns: ['horizontal-stripes', 'canton'] },

  // South America
  AR: { colors: ['blue', 'white', 'yellow'], patterns: ['horizontal-stripes'] },
  BO: { colors: ['red', 'yellow', 'green'], patterns: ['horizontal-stripes'] },
  BR: { colors: ['green', 'yellow', 'blue', 'white'], patterns: ['solid'] },
  CL: { colors: ['red', 'white', 'blue'], patterns: ['horizontal-stripes', 'canton'] },
  CO: { colors: ['yellow', 'blue', 'red'], patterns: ['horizontal-stripes'] },
  EC: { colors: ['yellow', 'blue', 'red'], patterns: ['horizontal-stripes'] },
  GY: { colors: ['green', 'yellow', 'red', 'black', 'white'], patterns: ['diagonal'] },
  PY: { colors: ['red', 'white', 'blue'], patterns: ['horizontal-stripes'] },
  PE: { colors: ['red', 'white'], patterns: ['vertical-stripes'] },
  SR: { colors: ['green', 'white', 'red', 'yellow'], patterns: ['horizontal-stripes'] },
  UY: { colors: ['white', 'blue', 'yellow'], patterns: ['horizontal-stripes', 'canton'] },
  VE: { colors: ['yellow', 'blue', 'red', 'white'], patterns: ['horizontal-stripes'] },

  // Oceania
  AU: { colors: ['blue', 'red', 'white'], patterns: ['canton'] },
  FJ: { colors: ['blue', 'red', 'white'], patterns: ['canton'] },
  KI: { colors: ['red', 'blue', 'yellow', 'white'], patterns: ['horizontal-stripes'] },
  MH: { colors: ['blue', 'orange', 'white'], patterns: ['diagonal'] },
  FM: { colors: ['blue', 'white'], patterns: ['solid'] },
  NR: { colors: ['blue', 'yellow', 'white'], patterns: ['horizontal-stripes'] },
  NZ: { colors: ['blue', 'red', 'white'], patterns: ['canton'] },
  PW: { colors: ['blue', 'yellow'], patterns: ['solid'] },
  PG: { colors: ['red', 'black', 'yellow', 'white'], patterns: ['diagonal'] },
  WS: { colors: ['red', 'blue', 'white'], patterns: ['canton'] },
  SB: { colors: ['blue', 'green', 'yellow', 'white'], patterns: ['diagonal'] },
  TO: { colors: ['red', 'white'], patterns: ['canton'] },
  TV: { colors: ['blue', 'yellow', 'white'], patterns: ['canton'] },
  VU: { colors: ['red', 'green', 'black', 'yellow'], patterns: ['complex'] },

  // Territories

  // United States
  PR: { colors: ['red', 'white', 'blue'], patterns: ['horizontal-stripes', 'canton'] },
  GU: { colors: ['blue', 'red', 'white'], patterns: ['complex'] },
  VI: { colors: ['white', 'yellow', 'blue'], patterns: ['complex'] },
  AS: { colors: ['red', 'white', 'blue', 'yellow'], patterns: ['complex'] },
  MP: { colors: ['blue', 'white'], patterns: ['complex'] },

  // United Kingdom — British Overseas Territories + Crown Dependencies
  BM: { colors: ['red', 'blue', 'white'], patterns: ['canton', 'complex'] },
  VG: { colors: ['blue', 'red', 'white', 'yellow'], patterns: ['canton', 'complex'] },
  KY: { colors: ['blue', 'red', 'white', 'yellow', 'green'], patterns: ['canton', 'complex'] },
  GI: { colors: ['white', 'red', 'yellow'], patterns: ['horizontal-stripes', 'complex'] },
  FK: { colors: ['blue', 'red', 'white'], patterns: ['canton', 'complex'] },
  TC: { colors: ['blue', 'red', 'white', 'yellow'], patterns: ['canton', 'complex'] },
  MS: { colors: ['blue', 'red', 'white', 'green'], patterns: ['canton', 'complex'] },
  AI: { colors: ['white', 'blue', 'red', 'orange'], patterns: ['horizontal-stripes', 'complex'] },
  SH: { colors: ['blue', 'red', 'white', 'yellow'], patterns: ['canton', 'complex'] },
  PN: { colors: ['blue', 'red', 'white', 'green', 'yellow'], patterns: ['canton', 'complex'] },
  IO: { colors: ['blue', 'white', 'red', 'green'], patterns: ['canton', 'complex'] },
  IM: { colors: ['red', 'white', 'yellow'], patterns: ['complex'] },
  JE: { colors: ['white', 'red', 'yellow'], patterns: ['diagonal', 'complex'] },
  GG: { colors: ['white', 'red', 'yellow'], patterns: ['cross'] },

  // France — overseas; most fly the French tricolore as the official flag
  PF: { colors: ['red', 'white', 'yellow'], patterns: ['horizontal-stripes', 'complex'] },
  NC: { colors: ['blue', 'white', 'red'], patterns: ['vertical-stripes'] },
  WF: { colors: ['blue', 'white', 'red'], patterns: ['vertical-stripes'] },
  BL: { colors: ['blue', 'white', 'red'], patterns: ['vertical-stripes'] },
  MF: { colors: ['blue', 'white', 'red'], patterns: ['vertical-stripes'] },
  PM: { colors: ['blue', 'white', 'red'], patterns: ['vertical-stripes'] },
  RE: { colors: ['blue', 'white', 'red'], patterns: ['vertical-stripes'] },
  YT: { colors: ['blue', 'white', 'red'], patterns: ['vertical-stripes'] },
  GP: { colors: ['blue', 'white', 'red'], patterns: ['vertical-stripes'] },
  MQ: { colors: ['blue', 'white', 'red'], patterns: ['vertical-stripes'] },
  GF: { colors: ['blue', 'white', 'red'], patterns: ['vertical-stripes'] },

  // Netherlands
  AW: { colors: ['blue', 'yellow', 'red', 'white'], patterns: ['horizontal-stripes', 'complex'] },
  CW: { colors: ['blue', 'yellow', 'white'], patterns: ['horizontal-stripes', 'canton'] },
  SX: { colors: ['red', 'blue', 'white', 'yellow', 'orange'], patterns: ['complex'] },
  // BQ (Caribbean Netherlands) has no single official flag — skip entry

  // Denmark
  GL: { colors: ['white', 'red'], patterns: ['horizontal-stripes', 'complex'] },
  FO: { colors: ['white', 'red', 'blue'], patterns: ['cross'] },

  // Australia
  CX: { colors: ['green', 'blue', 'yellow', 'white'], patterns: ['diagonal', 'complex'] },
  CC: { colors: ['green', 'yellow', 'white'], patterns: ['complex'] },
  NF: { colors: ['green', 'white'], patterns: ['vertical-stripes', 'complex'] },

  // New Zealand
  CK: { colors: ['blue', 'red', 'white'], patterns: ['canton', 'complex'] },
  NU: { colors: ['yellow', 'blue', 'red', 'white'], patterns: ['canton', 'complex'] },
  TK: { colors: ['blue', 'yellow', 'white'], patterns: ['complex'] },

  // China
  HK: { colors: ['red', 'white'], patterns: ['complex'] },
  MO: { colors: ['green', 'white', 'yellow'], patterns: ['complex'] },

  // Finland
  AX: { colors: ['blue', 'red', 'yellow'], patterns: ['cross'] },

  // Norway
  SJ: { colors: ['red', 'white', 'blue'], patterns: ['cross'] },
  BV: { colors: ['red', 'white', 'blue'], patterns: ['cross'] },

  // Other
  // AQ (Antarctica) has no officially adopted flag — skip entry
  EH: { colors: ['black', 'white', 'green', 'red'], patterns: ['horizontal-stripes', 'complex'] },
};

// Helper function to find similar flags, scored by visual similarity.
// Pattern is the #1 driver, then color count similarity, then color overlap.
export function getSimilarFlags(countryCode: string, allCountryCodes: string[]): string[] {
  const target = flagFeatures[countryCode];
  if (!target) return [];

  const isCatchAll = target.patterns.every(p => p === 'solid' || p === 'complex');

  return allCountryCodes
    .filter(code => code !== countryCode && flagFeatures[code])
    .map(code => {
      const f = flagFeatures[code]!;

      // Pattern similarity (most important — 45% of score).
      // Sharing multiple distinctive patterns (e.g. stripes + canton) is a stronger
      // visual signal than sharing one, so we boost above 1.0 to outweigh ties on
      // color count alone — otherwise plain tricolors crowd out genuine lookalikes.
      let patternScore = 0;
      const sharedPatterns = target.patterns.filter(p => f.patterns.includes(p));
      if (sharedPatterns.length > 0) {
        if (isCatchAll) {
          patternScore = 0.4;
        } else if (sharedPatterns.length >= 2) {
          patternScore = 1.3;
        } else {
          patternScore = 1.0;
        }
      } else if (
        (target.patterns.includes('horizontal-stripes') && f.patterns.includes('vertical-stripes')) ||
        (target.patterns.includes('vertical-stripes') && f.patterns.includes('horizontal-stripes'))
      ) {
        patternScore = 0.8;
      }

      // Color count similarity (25% of score) — flags with the same number
      // of colors look more alike than ones with very different counts
      const maxLen = Math.max(target.colors.length, f.colors.length);
      const minLen = Math.min(target.colors.length, f.colors.length);
      const countScore = 1 - (maxLen - minLen) / maxLen;

      // Color overlap (30% of score) — shared colors relative to the larger set
      const shared = target.colors.filter(c => f.colors.includes(c)).length;
      const overlapScore = shared / maxLen;

      // Subset bonus — when one flag's palette is fully contained in the other,
      // it's a stronger visual match than partial overlap (e.g. Greece's blue/white
      // is a subset of Uruguay's blue/white/yellow)
      const subsetBonus = shared === minLen ? 0.15 : 0;

      const score = patternScore * 0.45 + countScore * 0.25 + overlapScore * 0.30 + subsetBonus;
      return { code, score };
    })
    .filter(({ score }) => score >= 0.8)
    .sort((a, b) => b.score - a.score)
    .map(({ code }) => code);
}
