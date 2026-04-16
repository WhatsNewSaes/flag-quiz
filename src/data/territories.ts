import type { Continent } from './countries';

export interface Territory {
  name: string;
  code: string;
  continent: Continent;
  sovereignCode: string;
  sovereignName: string;
}

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function findTerritoryBySlug(slug: string): Territory | undefined {
  return territories.find((t) => slugify(t.name) === slug);
}

export function getTerritorySlug(territory: Territory): string {
  return slugify(territory.name);
}

export function getTerritoriesBySovereign(code: string): Territory[] {
  return territories.filter((t) => t.sovereignCode === code);
}

export const territories: Territory[] = [
  // United States territories
  { name: 'Puerto Rico', code: 'PR', continent: 'North America', sovereignCode: 'US', sovereignName: 'United States' },
  { name: 'Guam', code: 'GU', continent: 'Oceania', sovereignCode: 'US', sovereignName: 'United States' },
  { name: 'U.S. Virgin Islands', code: 'VI', continent: 'North America', sovereignCode: 'US', sovereignName: 'United States' },
  { name: 'American Samoa', code: 'AS', continent: 'Oceania', sovereignCode: 'US', sovereignName: 'United States' },
  { name: 'Northern Mariana Islands', code: 'MP', continent: 'Oceania', sovereignCode: 'US', sovereignName: 'United States' },

  // United Kingdom territories
  { name: 'Bermuda', code: 'BM', continent: 'North America', sovereignCode: 'GB', sovereignName: 'United Kingdom' },
  { name: 'British Virgin Islands', code: 'VG', continent: 'North America', sovereignCode: 'GB', sovereignName: 'United Kingdom' },
  { name: 'Cayman Islands', code: 'KY', continent: 'North America', sovereignCode: 'GB', sovereignName: 'United Kingdom' },
  { name: 'Gibraltar', code: 'GI', continent: 'Europe', sovereignCode: 'GB', sovereignName: 'United Kingdom' },
  { name: 'Falkland Islands', code: 'FK', continent: 'South America', sovereignCode: 'GB', sovereignName: 'United Kingdom' },
  { name: 'Turks and Caicos Islands', code: 'TC', continent: 'North America', sovereignCode: 'GB', sovereignName: 'United Kingdom' },
  { name: 'Montserrat', code: 'MS', continent: 'North America', sovereignCode: 'GB', sovereignName: 'United Kingdom' },
  { name: 'Anguilla', code: 'AI', continent: 'North America', sovereignCode: 'GB', sovereignName: 'United Kingdom' },
  { name: 'Saint Helena', code: 'SH', continent: 'Africa', sovereignCode: 'GB', sovereignName: 'United Kingdom' },
  { name: 'Pitcairn Islands', code: 'PN', continent: 'Oceania', sovereignCode: 'GB', sovereignName: 'United Kingdom' },
  { name: 'British Indian Ocean Territory', code: 'IO', continent: 'Asia', sovereignCode: 'GB', sovereignName: 'United Kingdom' },

  // France territories
  { name: 'French Polynesia', code: 'PF', continent: 'Oceania', sovereignCode: 'FR', sovereignName: 'France' },
  { name: 'New Caledonia', code: 'NC', continent: 'Oceania', sovereignCode: 'FR', sovereignName: 'France' },
  { name: 'Wallis and Futuna', code: 'WF', continent: 'Oceania', sovereignCode: 'FR', sovereignName: 'France' },
  { name: 'Saint Barthélemy', code: 'BL', continent: 'North America', sovereignCode: 'FR', sovereignName: 'France' },
  { name: 'Saint Martin', code: 'MF', continent: 'North America', sovereignCode: 'FR', sovereignName: 'France' },
  { name: 'Saint Pierre and Miquelon', code: 'PM', continent: 'North America', sovereignCode: 'FR', sovereignName: 'France' },
  { name: 'Réunion', code: 'RE', continent: 'Africa', sovereignCode: 'FR', sovereignName: 'France' },
  { name: 'Mayotte', code: 'YT', continent: 'Africa', sovereignCode: 'FR', sovereignName: 'France' },
  { name: 'Guadeloupe', code: 'GP', continent: 'North America', sovereignCode: 'FR', sovereignName: 'France' },
  { name: 'Martinique', code: 'MQ', continent: 'North America', sovereignCode: 'FR', sovereignName: 'France' },
  { name: 'French Guiana', code: 'GF', continent: 'South America', sovereignCode: 'FR', sovereignName: 'France' },

  // Netherlands territories
  { name: 'Aruba', code: 'AW', continent: 'North America', sovereignCode: 'NL', sovereignName: 'Netherlands' },
  { name: 'Curaçao', code: 'CW', continent: 'North America', sovereignCode: 'NL', sovereignName: 'Netherlands' },
  { name: 'Sint Maarten', code: 'SX', continent: 'North America', sovereignCode: 'NL', sovereignName: 'Netherlands' },
  { name: 'Caribbean Netherlands', code: 'BQ', continent: 'North America', sovereignCode: 'NL', sovereignName: 'Netherlands' },

  // Denmark territories
  { name: 'Greenland', code: 'GL', continent: 'North America', sovereignCode: 'DK', sovereignName: 'Denmark' },
  { name: 'Faroe Islands', code: 'FO', continent: 'Europe', sovereignCode: 'DK', sovereignName: 'Denmark' },

  // Australia territories
  { name: 'Christmas Island', code: 'CX', continent: 'Asia', sovereignCode: 'AU', sovereignName: 'Australia' },
  { name: 'Cocos (Keeling) Islands', code: 'CC', continent: 'Asia', sovereignCode: 'AU', sovereignName: 'Australia' },
  { name: 'Norfolk Island', code: 'NF', continent: 'Oceania', sovereignCode: 'AU', sovereignName: 'Australia' },

  // New Zealand territories
  { name: 'Cook Islands', code: 'CK', continent: 'Oceania', sovereignCode: 'NZ', sovereignName: 'New Zealand' },
  { name: 'Niue', code: 'NU', continent: 'Oceania', sovereignCode: 'NZ', sovereignName: 'New Zealand' },
  { name: 'Tokelau', code: 'TK', continent: 'Oceania', sovereignCode: 'NZ', sovereignName: 'New Zealand' },

  // China territories
  { name: 'Hong Kong', code: 'HK', continent: 'Asia', sovereignCode: 'CN', sovereignName: 'China' },
  { name: 'Macao', code: 'MO', continent: 'Asia', sovereignCode: 'CN', sovereignName: 'China' },

  // Finland territories
  { name: 'Åland Islands', code: 'AX', continent: 'Europe', sovereignCode: 'FI', sovereignName: 'Finland' },

  // Norway territories
  { name: 'Svalbard and Jan Mayen', code: 'SJ', continent: 'Europe', sovereignCode: 'NO', sovereignName: 'Norway' },
  { name: 'Bouvet Island', code: 'BV', continent: 'South America', sovereignCode: 'NO', sovereignName: 'Norway' },

  // Crown Dependencies (UK Crown but not UK territories)
  { name: 'Isle of Man', code: 'IM', continent: 'Europe', sovereignCode: 'GB', sovereignName: 'United Kingdom' },
  { name: 'Jersey', code: 'JE', continent: 'Europe', sovereignCode: 'GB', sovereignName: 'United Kingdom' },
  { name: 'Guernsey', code: 'GG', continent: 'Europe', sovereignCode: 'GB', sovereignName: 'United Kingdom' },

  // Other
  { name: 'Antarctica', code: 'AQ', continent: 'Oceania', sovereignCode: '', sovereignName: 'None' },
  { name: 'Western Sahara', code: 'EH', continent: 'Africa', sovereignCode: '', sovereignName: 'None' },
];
