import { countries, type Country, type Continent } from '../data/countries';

export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function findCountryBySlug(slug: string): Country | undefined {
  return countries.find((c) => slugify(c.name) === slug);
}

export function getCountrySlug(country: Country): string {
  return slugify(country.name);
}

export function getContinentSlug(continent: Continent): string {
  return slugify(continent);
}

const continentFromSlug: Record<string, Continent> = {
  'africa': 'Africa',
  'asia': 'Asia',
  'europe': 'Europe',
  'north-america': 'North America',
  'south-america': 'South America',
  'oceania': 'Oceania',
};

export function findContinentBySlug(slug: string): Continent | undefined {
  return continentFromSlug[slug];
}
