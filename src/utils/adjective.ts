import { getCountryFacts } from '../data/countryFacts';

const ADJECTIVE_OVERRIDES: Record<string, string> = {
  // demonyms that read as nouns rather than adjectives
  'New Zealander': 'New Zealand',
};

export function getCountryAdjective(code: string | undefined, fallback: string): string {
  if (!code) return fallback;
  const demonym = getCountryFacts(code)?.demonym;
  if (!demonym) return fallback;
  if (ADJECTIVE_OVERRIDES[demonym]) return ADJECTIVE_OVERRIDES[demonym];
  // multi-demonym entries like "Antiguan, Barbudan" — just take the first
  return demonym.split(',')[0].trim();
}
