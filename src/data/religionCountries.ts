import { countries } from './countries';
import { getCountryFacts } from './countryFacts';
import type { Religion } from './religions';

export interface ReligionAdherence {
  code: string;
  name: string;
  percent: number;
}

export function getCountriesForReligion(religion: Religion): ReligionAdherence[] {
  const out: ReligionAdherence[] = [];
  for (const c of countries) {
    const facts = getCountryFacts(c.code);
    if (!facts?.religions) continue;
    for (const r of facts.religions) {
      if (religion.matchPattern.test(r.name) && typeof r.percent === 'number') {
        out.push({ code: c.code, name: c.name, percent: r.percent });
        break;
      }
    }
  }
  return out.sort((a, b) => b.percent - a.percent);
}
