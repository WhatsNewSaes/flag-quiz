import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CountryFacts } from '../data/countryFacts';
import { religions } from '../data/religions';

function findReligionSlug(name: string): string | undefined {
  return religions.find((r) => r.matchPattern.test(name))?.slug;
}

interface QuickFactsProps {
  facts: CountryFacts;
  flagAdopted?: string;
}

interface Row {
  label: string;
  value: string;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function buildRows(facts: CountryFacts, flagAdopted?: string): Row[] {
  const rows: Row[] = [];
  if (facts.capital) rows.push({ label: 'Capital', value: facts.capital });
  if (flagAdopted) rows.push({ label: 'Flag adopted', value: flagAdopted });
  if (facts.population !== undefined) {
    rows.push({ label: 'Population', value: formatNumber(facts.population) });
  }
  if (facts.area !== undefined) {
    rows.push({ label: 'Area', value: `${formatNumber(facts.area)} km²` });
  }
  if (facts.languages?.length) {
    rows.push({ label: 'Languages', value: facts.languages.join(', ') });
  }
  if (facts.currencies?.length) {
    const value = facts.currencies
      .map((c) => `${c.name}${c.symbol ? ` (${c.symbol})` : ''} — ${c.code}`)
      .join(', ');
    rows.push({ label: 'Currency', value });
  }
  if (facts.demonym) rows.push({ label: 'Demonym', value: facts.demonym });
  if (facts.governmentType) rows.push({ label: 'Government', value: facts.governmentType });
  if (facts.subregion) rows.push({ label: 'Subregion', value: facts.subregion });
  if (facts.drivingSide) {
    rows.push({
      label: 'Driving side',
      value: facts.drivingSide.charAt(0).toUpperCase() + facts.drivingSide.slice(1),
    });
  }
  if (facts.timezones?.length) {
    const first = facts.timezones.slice(0, 2).join(', ');
    const extra = facts.timezones.length > 2 ? ` +${facts.timezones.length - 2} more` : '';
    rows.push({ label: 'Timezones', value: first + extra });
  }
  if (facts.independence) rows.push({ label: 'Independence', value: facts.independence });
  return rows;
}

// 12 distinct colors for the religion bar — must support the parser cap of 12
// entries without cycling, so each religion gets a unique swatch.
const religionColors = [
  '#3B82F6', // blue
  '#16A34A', // green
  '#F59E0B', // amber
  '#7F1D1D', // maroon
  '#1F2937', // charcoal
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#DC2626', // red
  '#92400E', // brown
  '#A16207', // dark gold
];

function ReligionBar({ religions }: { religions: NonNullable<CountryFacts['religions']> }) {
  // Filter to entries that actually have percent, then sort largest-first so the
  // most popular religion leads both the bar and the legend.
  const withPct = religions
    .filter((r) => typeof r.percent === 'number')
    .slice()
    .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0));
  const barRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ index: number; x: number } | null>(null);
  if (withPct.length === 0) return null;
  const total = withPct.reduce((sum, r) => sum + (r.percent ?? 0), 0);
  // Normalize so the bar fills 100% (visual clarity even when source doesn't add up)
  const norm = total > 0 ? 100 / total : 1;

  const handleMove = (i: number) => (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({ index: i, x: e.clientX - rect.left });
  };

  return (
    <div className="mt-4">
      <h3 className="font-retro text-xs mb-2 text-retro-text">Religions</h3>
      <div className="relative">
        <div
          ref={barRef}
          className="flex w-full h-5 border border-retro-border overflow-hidden"
          role="img"
          aria-label="Religion breakdown"
          onMouseLeave={() => setHover(null)}
        >
          {withPct.map((r, i) => (
            <div
              key={`${r.name}-${i}`}
              style={{
                width: `${(r.percent ?? 0) * norm}%`,
                backgroundColor: religionColors[i % religionColors.length],
              }}
              onMouseEnter={handleMove(i)}
              onMouseMove={handleMove(i)}
            />
          ))}
        </div>
        {hover && (
          <div
            className="pointer-events-none absolute -top-2 -translate-x-1/2 -translate-y-full bg-retro-surface border-2 border-retro-border shadow-pixel px-2 py-1 font-retro text-[10px] text-retro-text whitespace-nowrap z-10"
            style={{ left: hover.x }}
          >
            <span className="capitalize">{withPct[hover.index].name}</span>
            <span className="ml-2 text-retro-text-secondary">{withPct[hover.index].percent}%</span>
          </div>
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-body text-sm text-retro-text-secondary">
        {withPct.map((r, i) => {
          const slug = findReligionSlug(r.name);
          const swatch = (
            <span
              className="inline-block w-3 h-3 border border-retro-border"
              style={{ backgroundColor: religionColors[i % religionColors.length] }}
              aria-hidden="true"
            />
          );
          const label = (
            <>
              <span className="capitalize">{r.name}</span>
              <span>{r.percent}%</span>
            </>
          );
          return (
            <li key={`${r.name}-${i}`}>
              {slug ? (
                <Link
                  to={`/religions/${slug}`}
                  className="flex items-center gap-1.5 hover:text-retro-text underline-offset-2 hover:underline"
                >
                  {swatch}
                  {label}
                </Link>
              ) : (
                <span className="flex items-center gap-1.5">
                  {swatch}
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function QuickFacts({ facts, flagAdopted }: QuickFactsProps) {
  const rows = buildRows(facts, flagAdopted);
  const hasReligions = facts.religions && facts.religions.length > 0;

  if (rows.length === 0 && !hasReligions) return null;

  return (
    <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
      <h2 className="font-retro text-sm mb-3 text-retro-text">Quick Facts</h2>
      {rows.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 font-body text-retro-text-secondary">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col">
              <dt className="text-xs uppercase tracking-wide text-retro-text-secondary/70">
                {row.label}
              </dt>
              <dd className="text-retro-text">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {hasReligions && <ReligionBar religions={facts.religions!} />}
    </section>
  );
}
