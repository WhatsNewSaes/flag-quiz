import { countries } from '../data/countries';
import { territories, getTerritorySlug } from '../data/territories';
import { getCountrySlug } from './slugify';

export type FlagEntryKind = 'country' | 'territory';

export interface FlagEntry {
  kind: FlagEntryKind;
  code: string;
  name: string;
  continent: string;
  href: string;
}

export function resolveFlagEntry(code: string): FlagEntry | null {
  const country = countries.find((c) => c.code === code);
  if (country) {
    return {
      kind: 'country',
      code: country.code,
      name: country.name,
      continent: country.continent,
      href: `/flags/${getCountrySlug(country)}`,
    };
  }
  const territory = territories.find((t) => t.code === code);
  if (territory) {
    return {
      kind: 'territory',
      code: territory.code,
      name: territory.name,
      continent: territory.continent,
      href: `/flags/territories/${getTerritorySlug(territory)}`,
    };
  }
  return null;
}

export function allFlagCodes(): string[] {
  return [...countries.map((c) => c.code), ...territories.map((t) => t.code)];
}

export function flagEntriesByContinent(continent: string, excludeCode?: string): FlagEntry[] {
  const out: FlagEntry[] = [];
  for (const c of countries) {
    if (c.continent !== continent || c.code === excludeCode) continue;
    out.push({
      kind: 'country',
      code: c.code,
      name: c.name,
      continent: c.continent,
      href: `/flags/${getCountrySlug(c)}`,
    });
  }
  for (const t of territories) {
    if (t.continent !== continent || t.code === excludeCode) continue;
    out.push({
      kind: 'territory',
      code: t.code,
      name: t.name,
      continent: t.continent,
      href: `/flags/territories/${getTerritorySlug(t)}`,
    });
  }
  return out;
}
