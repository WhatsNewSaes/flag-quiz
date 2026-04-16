import { Link } from 'react-router-dom';
import { countries } from '../data/countries';
import { territories, getTerritorySlug } from '../data/territories';
import { getFlagEmoji } from '../utils/flagEmoji';
import { getCountrySlug } from '../utils/slugify';

interface BorderingCountriesProps {
  borderCodes: string[];
}

type Neighbor =
  | { kind: 'country'; code: string; name: string; slug: string }
  | { kind: 'territory'; code: string; name: string; slug: string };

function resolveNeighbor(code: string): Neighbor | null {
  const country = countries.find((c) => c.code === code);
  if (country) {
    return { kind: 'country', code: country.code, name: country.name, slug: getCountrySlug(country) };
  }
  const territory = territories.find((t) => t.code === code);
  if (territory) {
    return {
      kind: 'territory',
      code: territory.code,
      name: territory.name,
      slug: getTerritorySlug(territory),
    };
  }
  return null;
}

export function BorderingCountries({ borderCodes }: BorderingCountriesProps) {
  const neighbors = borderCodes
    .map(resolveNeighbor)
    .filter((n): n is Neighbor => n !== null);

  if (neighbors.length === 0) return null;

  return (
    <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
      <h2 className="font-retro text-sm mb-3 text-retro-text">
        Bordering countries ({neighbors.length})
      </h2>
      <div className="flex flex-wrap gap-2">
        {neighbors.map((n) => (
          <Link
            key={n.code}
            to={n.kind === 'country' ? `/flags/${n.slug}` : `/flags/territories/${n.slug}`}
            className="inline-flex items-center gap-1.5 font-body text-sm border border-retro-border/40 hover:border-retro-border px-2 py-1 hover:bg-retro-accent/30 transition-colors"
          >
            <span aria-hidden="true">{getFlagEmoji(n.code)}</span>
            <span>{n.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
