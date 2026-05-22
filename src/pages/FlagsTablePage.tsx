import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { countries, continents, type Continent } from '../data/countries';
import { territories, getTerritorySlug } from '../data/territories';
import { countryFacts } from '../data/countryFacts';
import { getFlagEmoji } from '../utils/flagEmoji';
import { getCountrySlug } from '../utils/slugify';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';

type Kind = 'country' | 'territory';

interface Row {
  code: string;
  name: string;
  kind: Kind;
  href: string;
  continent: Continent;
  population?: number;
  area?: number;
  capital?: string;
  languages?: string[];
  religionName?: string;
  religionPercent?: number;
  medianAge?: number;
  fertilityRate?: number;
}

type SortKey = 'name' | 'kind' | 'continent' | 'population' | 'area' | 'capital' | 'religion' | 'languages' | 'medianAge' | 'fertilityRate';
type SortDir = 'asc' | 'desc';

const KIND_LABEL: Record<Kind, string> = {
  country: 'Country',
  territory: 'Territory',
};

function buildRows(): Row[] {
  const countryRows = countries.map<Row>((c) => {
    const facts = countryFacts[c.code];
    const topReligion = facts?.religions?.[0];
    return {
      code: c.code,
      name: c.name,
      kind: 'country',
      href: `/flags/${getCountrySlug(c)}`,
      continent: c.continent,
      population: facts?.population,
      area: facts?.area,
      capital: facts?.capital,
      languages: facts?.languages,
      religionName: topReligion?.name,
      religionPercent: topReligion?.percent,
      medianAge: facts?.medianAge,
      fertilityRate: facts?.fertilityRate,
    };
  });

  const territoryRows = territories.map<Row>((t) => {
    const facts = countryFacts[t.code];
    const topReligion = facts?.religions?.[0];
    return {
      code: t.code,
      name: t.name,
      kind: 'territory',
      href: `/flags/territories/${getTerritorySlug(t)}`,
      continent: t.continent,
      population: facts?.population,
      area: facts?.area,
      capital: facts?.capital,
      languages: facts?.languages,
      religionName: topReligion?.name,
      religionPercent: topReligion?.percent,
      medianAge: facts?.medianAge,
      fertilityRate: facts?.fertilityRate,
    };
  });

  return [...countryRows, ...territoryRows];
}

function compare<T>(a: T | undefined, b: T | undefined, dir: SortDir): number {
  // Undefined values always sort to the bottom, regardless of direction.
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  if (typeof a === 'number' && typeof b === 'number') {
    return dir === 'asc' ? a - b : b - a;
  }
  const result = String(a).localeCompare(String(b));
  return dir === 'asc' ? result : -result;
}

function formatNumber(n?: number): string {
  if (n === undefined) return '—';
  return n.toLocaleString('en-US');
}

const PROTESTANT_MARKERS = [
  'lutheran', 'anglican', 'congregational', 'reformed',
  'evangelical', 'presbyterian', 'methodist', 'baptist',
  'uniting church', 'augsburg confession',
];

// Factbook religion labels are sometimes long compound names
// (e.g. "Church of Jesus Christ in Madagascar/Malagasy Lutheran Church/Anglican Church").
// Bucket those into a parent denomination for display in the dense table.
function shortenReligionLabel(name: string): string {
  const isCompound = name.includes('/');
  const isLong = name.length > 30;
  if (!isCompound && !isLong) return name;

  const lower = name.toLowerCase();
  if (PROTESTANT_MARKERS.some((kw) => lower.includes(kw))) return 'Protestant';

  if (isCompound) return name.split('/')[0].trim();
  return name;
}

function formatReligion(row: Row): string {
  if (!row.religionName) return '—';
  const label = shortenReligionLabel(row.religionName);
  if (row.religionPercent === undefined) return label;
  return `${label} ${row.religionPercent}%`;
}

function formatLanguages(langs?: string[]): string {
  if (!langs || langs.length === 0) return '—';
  if (langs.length <= 2) return langs.join(', ');
  return `${langs.slice(0, 2).join(', ')} +${langs.length - 2}`;
}

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="opacity-30 ml-1">↕</span>;
  return <span className="ml-1">{dir === 'asc' ? '↑' : '↓'}</span>;
}

export function FlagsTablePage() {
  const rows = useMemo(buildRows, []);

  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<Kind | 'all'>('all');
  const [continentFilter, setContinentFilter] = useState<Continent | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (kindFilter !== 'all' && r.kind !== kindFilter) return false;
      if (continentFilter !== 'all' && r.continent !== continentFilter) return false;
      if (q && !r.name.toLowerCase().includes(q)) return false;
      return true;
    });
    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'name': return compare(a.name, b.name, sortDir);
        case 'kind': return compare(a.kind, b.kind, sortDir) || a.name.localeCompare(b.name);
        case 'continent': return compare(a.continent, b.continent, sortDir) || a.name.localeCompare(b.name);
        case 'population': return compare(a.population, b.population, sortDir) || a.name.localeCompare(b.name);
        case 'area': return compare(a.area, b.area, sortDir) || a.name.localeCompare(b.name);
        case 'capital': return compare(a.capital, b.capital, sortDir) || a.name.localeCompare(b.name);
        case 'religion': return compare(a.religionName, b.religionName, sortDir) || a.name.localeCompare(b.name);
        case 'languages': return compare(a.languages?.[0], b.languages?.[0], sortDir) || a.name.localeCompare(b.name);
        case 'medianAge': return compare(a.medianAge, b.medianAge, sortDir) || a.name.localeCompare(b.name);
        case 'fertilityRate': return compare(a.fertilityRate, b.fertilityRate, sortDir) || a.name.localeCompare(b.name);
        default: return 0;
      }
    });
    return sorted;
  }, [rows, search, kindFilter, continentFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'population' || key === 'area' || key === 'fertilityRate' ? 'desc' : 'asc');
    }
  }

  function clearFilters() {
    setSearch('');
    setKindFilter('all');
    setContinentFilter('all');
  }

  const hasFilters = search !== '' || kindFilter !== 'all' || continentFilter !== 'all';

  const headerBtnClass = 'group inline-flex items-center font-retro text-[10px] uppercase tracking-wide text-retro-text hover:text-retro-neon-blue transition-colors';

  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title="Flag Data Table - Compare Every Country | Flag Arcade"
        description="Sortable table of every country and territory flag with population, area, capital, languages, religion, and difficulty. Compare nations side by side."
        canonical="https://flagarcade.com/flags/table"
      />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Flags', href: '/flags' },
          { label: 'Data Table' },
        ]} />

        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 mt-4">
          <h1 className="font-retro text-lg md:text-xl text-retro-text mb-2">Flag Data Table</h1>
          <p className="font-body text-retro-text-secondary mb-4">
            Compare every country and territory by population, area, capital, languages, main religion, and difficulty. Click a column header to sort.
          </p>

          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-retro-text-secondary">Search</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by name"
                className="font-body text-sm text-retro-text placeholder:text-retro-text/60 border-2 border-retro-border bg-white px-2 py-1.5 w-52 outline-none focus:border-retro-neon-blue"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-retro-text-secondary">Type</span>
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value as Kind | 'all')}
                className="font-body text-sm text-retro-text border-2 border-retro-border bg-white px-2 py-1.5 outline-none focus:border-retro-neon-blue"
              >
                <option value="all">All</option>
                <option value="country">Countries</option>
                <option value="territory">Territories</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-retro-text-secondary">Continent</span>
              <select
                value={continentFilter}
                onChange={(e) => setContinentFilter(e.target.value as Continent | 'all')}
                className="font-body text-sm text-retro-text border-2 border-retro-border bg-white px-2 py-1.5 outline-none focus:border-retro-neon-blue"
              >
                <option value="all">All</option>
                {continents.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="font-body text-sm text-retro-text border-2 border-retro-border bg-white px-3 py-1.5 shadow-pixel-sm hover:bg-retro-accent/30 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <p className="font-body text-sm text-retro-text-secondary mt-3">
            Showing {filteredSorted.length} of {rows.length}
          </p>
        </div>

        {/* Table */}
        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel mt-4 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-retro-accent/40 border-b-2 border-retro-border">
                <th className="px-3 py-2 text-left font-retro text-[10px] uppercase tracking-wide text-retro-text w-12">Flag</th>
                <th className="px-3 py-2 text-left">
                  <button className={headerBtnClass} onClick={() => toggleSort('name')}>
                    Name <SortIndicator active={sortKey === 'name'} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-2 text-left">
                  <button className={headerBtnClass} onClick={() => toggleSort('capital')}>
                    Capital <SortIndicator active={sortKey === 'capital'} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-2 text-right">
                  <button className={headerBtnClass} onClick={() => toggleSort('population')}>
                    Population <SortIndicator active={sortKey === 'population'} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-2 text-left">
                  <button className={headerBtnClass} onClick={() => toggleSort('religion')}>
                    Main Religion <SortIndicator active={sortKey === 'religion'} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-2 text-right">
                  <button className={headerBtnClass} onClick={() => toggleSort('medianAge')}>
                    Median Age <SortIndicator active={sortKey === 'medianAge'} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-2 text-right">
                  <button className={headerBtnClass} onClick={() => toggleSort('fertilityRate')}>
                    Fertility Rate <SortIndicator active={sortKey === 'fertilityRate'} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-2 text-left">
                  <button className={headerBtnClass} onClick={() => toggleSort('continent')}>
                    Continent <SortIndicator active={sortKey === 'continent'} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-2 text-left">
                  <button className={headerBtnClass} onClick={() => toggleSort('languages')}>
                    Languages <SortIndicator active={sortKey === 'languages'} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-2 text-right">
                  <button className={headerBtnClass} onClick={() => toggleSort('area')}>
                    Area (km²) <SortIndicator active={sortKey === 'area'} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-2 text-left">
                  <button className={headerBtnClass} onClick={() => toggleSort('kind')}>
                    Type <SortIndicator active={sortKey === 'kind'} dir={sortDir} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((row) => (
                <tr key={`${row.kind}-${row.code}`} className="border-b border-retro-border/20 hover:bg-retro-accent/20 transition-colors">
                  <td className="px-3 py-2 text-3xl leading-none">{getFlagEmoji(row.code)}</td>
                  <td className="px-3 py-2">
                    <Link to={row.href} className="font-body text-sm text-retro-text hover:text-retro-neon-blue hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-body text-sm text-retro-text">{row.capital ?? '—'}</td>
                  <td className="px-3 py-2 font-body text-sm text-retro-text text-right whitespace-nowrap tabular-nums">{formatNumber(row.population)}</td>
                  <td className="px-3 py-2 font-body text-sm text-retro-text whitespace-nowrap">{formatReligion(row)}</td>
                  <td className="px-3 py-2 font-body text-sm text-retro-text text-right tabular-nums whitespace-nowrap">
                    {row.medianAge !== undefined ? `${row.medianAge} yr` : '—'}
                  </td>
                  <td className="px-3 py-2 font-body text-sm text-retro-text text-right tabular-nums">
                    {row.fertilityRate !== undefined ? row.fertilityRate.toFixed(2) : '—'}
                  </td>
                  <td className="px-3 py-2 font-body text-xs text-retro-text-secondary whitespace-nowrap">{row.continent}</td>
                  <td className="px-3 py-2 font-body text-sm text-retro-text">{formatLanguages(row.languages)}</td>
                  <td className="px-3 py-2 font-body text-sm text-retro-text text-right whitespace-nowrap tabular-nums">{formatNumber(row.area)}</td>
                  <td className="px-3 py-2 font-body text-xs text-retro-text-secondary whitespace-nowrap">{KIND_LABEL[row.kind]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSorted.length === 0 && (
            <div className="p-6 text-center font-body text-sm text-retro-text-secondary">
              No flags match your filters.
            </div>
          )}
        </div>

        <nav className="mt-6 pb-8 text-center space-x-4">
          <Link to="/flags" className="font-body text-sm text-retro-neon-blue underline">All Flags</Link>
          <Link to="/flags/territories" className="font-body text-sm text-retro-neon-blue underline">Territories</Link>
          <Link to="/quiz" className="font-body text-sm text-retro-neon-blue underline">Flag Quiz</Link>
        </nav>
      </div>
    </div>
  );
}
