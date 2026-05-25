/**
 * Build-time static page generator for SEO.
 * Runs after `vite build` to generate ~210 static HTML files.
 *
 * Usage: tsx scripts/generate-seo-pages.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// Import data files directly (they're pure TS with no React deps)
import { countries, continents, difficultyLabels, type Country, type Continent } from '../src/data/countries';
import { flagFeatures, getSimilarFlags, type FlagFeatures } from '../src/data/flagFeatures';
import { flagPatternInfos } from '../src/data/flagPatterns';
import { flagDescriptions, type FlagDescription } from '../src/data/flagDescriptions';
import { organizations } from '../src/data/organizations';
import { organizationMembers } from '../src/data/organizationMembers';
import { territories } from '../src/data/territories';
import { countryFacts, type CountryFacts } from '../src/data/countryFacts';
import { religions, type Religion } from '../src/data/religions';
import { getCountriesForReligion } from '../src/data/religionCountries';
import { getContinentMapSvg } from '../src/components/seo/ContinentMap';
import { splitIntoParagraphs } from '../src/utils/splitParagraphs';

const DIST = path.resolve(import.meta.dirname, '..', 'dist');
const SITE_URL = 'https://flagarcade.com';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getFlagEmoji(code: string): string {
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0))
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

type Assets = {
  css: string[];
  js: string[];
  modulePreloads: string[];
};

// Extract CSS/JS asset paths from the built index.html. Also pulls Vite's
// modulepreload hints so SEO pages can preload vendor (and other static deps)
// in parallel with the entry script instead of waiting for it to parse.
function getAssets(): Assets {
  const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf-8');
  const css = [...html.matchAll(/href="(\/assets\/[^"]+\.css)"/g)].map((m) => m[1]);
  const js = [...html.matchAll(/<script[^>]*src="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
  const modulePreloads = [...html.matchAll(/<link[^>]*rel="modulepreload"[^>]*href="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
  return { css, js, modulePreloads };
}

// Resolve a route chunk filename by its module prefix (e.g. "ContentPage" →
// "/assets/ContentPage-D-spXxf_.js"). Returns null if no matching chunk
// exists — e.g. after experimentalMinChunkSize merges a small route into a
// parent — so callers degrade gracefully.
const _assetsDirCache: { files?: string[] } = {};
function findChunk(prefix: string): string | null {
  if (!_assetsDirCache.files) {
    _assetsDirCache.files = fs.readdirSync(path.join(DIST, 'assets'));
  }
  const match = _assetsDirCache.files.find(
    (f) => f.startsWith(prefix + '-') && f.endsWith('.js')
  );
  return match ? `/assets/${match}` : null;
}

const colorHex: Record<string, string> = {
  red: '#EF4444', blue: '#3B82F6', green: '#16A34A', yellow: '#FFD93D',
  white: '#FFFFFF', black: '#1F2937', orange: '#F59E0B', maroon: '#7F1D1D',
};

const patternLabels: Record<string, string> = {
  'horizontal-stripes': 'Horizontal Stripes', 'vertical-stripes': 'Vertical Stripes',
  'diagonal': 'Diagonal Design', 'cross': 'Cross Design', 'canton': 'Canton Design',
  'solid': 'Solid Field', 'complex': 'Complex Design',
};

// ---------------------------------------------------------------------------
// Quick Facts (SSG)
// ---------------------------------------------------------------------------

const RELIGION_COLORS = [
  '#3B82F6', '#16A34A', '#F59E0B', '#7F1D1D', '#1F2937',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#DC2626',
  '#92400E', '#A16207',
];

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function buildQuickFactsHtml(facts: CountryFacts, flagAdopted?: string): string {
  const rows: { label: string; value: string }[] = [];
  if (facts.capital) rows.push({ label: 'Capital', value: facts.capital });
  if (flagAdopted) rows.push({ label: 'Flag adopted', value: flagAdopted });
  if (facts.population !== undefined) rows.push({ label: 'Population', value: formatNumber(facts.population) });
  if (facts.area !== undefined) rows.push({ label: 'Area', value: `${formatNumber(facts.area)} km²` });
  if (facts.languages?.length) rows.push({ label: 'Languages', value: facts.languages.join(', ') });
  if (facts.currencies?.length) {
    rows.push({
      label: 'Currency',
      value: facts.currencies
        .map((c) => `${c.name}${c.symbol ? ` (${c.symbol})` : ''} — ${c.code}`)
        .join(', '),
    });
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

  const hasReligions = facts.religions && facts.religions.length > 0;
  if (rows.length === 0 && !hasReligions) return '';

  const grid = rows.length > 0
    ? `<dl style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px 24px;font-family:'Space Mono',monospace;font-size:14px;">
        ${rows
          .map(
            (r) => `<div style="display:flex;flex-direction:column;">
            <dt style="font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:#6B7280;">${escapeHtml(r.label)}</dt>
            <dd style="margin:0;color:#2D2D2D;">${escapeHtml(r.value)}</dd>
          </div>`,
          )
          .join('\n        ')}
      </dl>`
    : '';

  let religionsHtml = '';
  if (hasReligions) {
    const withPct = facts.religions!
      .filter((r) => typeof r.percent === 'number')
      .slice()
      .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0));
    if (withPct.length > 0) {
      const total = withPct.reduce((sum, r) => sum + (r.percent ?? 0), 0);
      const norm = total > 0 ? 100 / total : 1;
      const segments = withPct
        .map(
          (r, i) =>
            `<div style="width:${(r.percent ?? 0) * norm}%;background:${RELIGION_COLORS[i % RELIGION_COLORS.length]};" title="${escapeHtml(r.name)}: ${r.percent}%"></div>`,
        )
        .join('');
      const legend = withPct
        .map(
          (r, i) =>
            `<li style="display:flex;align-items:center;gap:6px;">
            <span style="display:inline-block;width:12px;height:12px;border:1px solid #2D2D2D;background:${RELIGION_COLORS[i % RELIGION_COLORS.length]};"></span>
            <span style="text-transform:capitalize;">${escapeHtml(r.name)}</span>
            <span>${r.percent}%</span>
          </li>`,
        )
        .join('\n          ');
      religionsHtml = `
      <div style="margin-top:16px;">
        <h3 style="font-family:'Press Start 2P',cursive;font-size:11px;margin:0 0 8px 0;">Religions</h3>
        <div style="display:flex;width:100%;height:20px;border:1px solid #2D2D2D;overflow:hidden;">${segments}</div>
        <ul style="margin:8px 0 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:4px 16px;font-family:'Space Mono',monospace;font-size:13px;color:#6B7280;">
          ${legend}
        </ul>
      </div>`;
    }
  }

  return `
      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Quick Facts</h2>
        ${grid}
        ${religionsHtml}
      </section>`;
}

function buildBorderingCountriesHtml(borderCodes: string[]): string {
  const borderCountries = borderCodes
    .map((code) => countries.find((c) => c.code === code))
    .filter((c): c is Country => Boolean(c));
  if (borderCountries.length === 0) return '';
  const pills = borderCountries
    .map(
      (c) =>
        `<a href="/flags/${slugify(c.name)}" style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border:1px solid #2D2D2D;text-decoration:none;font-size:13px;font-family:'Space Mono',monospace;color:#2D2D2D;">${getFlagEmoji(c.code)} ${escapeHtml(c.name)}</a>`,
    )
    .join('\n        ');
  return `
      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Bordering countries (${borderCountries.length})</h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
        ${pills}
        </div>
      </section>`;
}

function buildFlagActionsHtml(emoji: string, flagFilename: string, countryName: string): string {
  // Copy button is rendered as a non-functional placeholder — React replaces it
  // on hydration with a working clipboard-copy button. The download <a> is
  // fully functional pre-hydration since it's a native browser download.
  const btn = "display:inline-flex;align-items:center;gap:6px;font-family:'Space Mono',monospace;font-size:14px;border:1px solid rgba(45,45,45,0.4);background:transparent;padding:6px 12px;text-decoration:none;color:#2D2D2D;cursor:pointer;";
  return `
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:12px;">
          <button type="button" aria-label="Copy ${escapeHtml(countryName)} flag emoji" style="${btn}">
            <span aria-hidden="true">${emoji}</span><span>Copy</span>
          </button>
          <a href="/flag-images/${flagFilename}" download="${flagFilename}" aria-label="Download ${escapeHtml(countryName)} flag SVG" style="${btn}">
            <span aria-hidden="true">⬇</span><span>Download SVG</span>
          </a>
        </div>`;
}

// ---------------------------------------------------------------------------
// HTML template
// ---------------------------------------------------------------------------

interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  jsonLd?: object;
  noindex?: boolean;
  // When set, inlined as a <script id="__flag_data__"> so the client hook
  // can render the country/territory page without an initial fetch.
  flagData?: { code: string; description?: object; facts?: object };
}

function buildPage(
  meta: PageMeta,
  bodyHtml: string,
  assets: Assets,
  routeChunk?: string,
): string {
  const jsonLdTag = meta.jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`
    : '';
  const flagDataTag = meta.flagData
    ? `<script id="__flag_data__" type="application/json">${JSON.stringify(meta.flagData)}</script>`
    : '';

  // Preload static deps of the entry (vendor, etc.) so they download in
  // parallel with the entry chunk instead of being discovered after parse.
  // Also preload this route's lazy chunk so it races the vendor download
  // instead of waiting for the main bundle to trigger the dynamic import.
  const routeChunkHref = routeChunk ? findChunk(routeChunk) : null;
  const preloadHrefs = [
    ...assets.modulePreloads,
    ...(routeChunkHref ? [routeChunkHref] : []),
  ];
  const modulePreloadTags = preloadHrefs
    .map((href) => `<link rel="modulepreload" crossorigin href="${href}">`)
    .join('\n  ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌍</text></svg>">
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}">
  ${meta.noindex ? '<meta name="robots" content="noindex,nofollow">' : ''}
  <link rel="canonical" href="${meta.canonical}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(meta.title)}">
  <meta property="og:description" content="${escapeHtml(meta.description)}">
  <meta property="og:url" content="${meta.canonical}">
  <meta property="og:image" content="${meta.ogImage || `${SITE_URL}/og-image.jpg`}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(meta.title)}">
  <meta name="twitter:description" content="${escapeHtml(meta.description)}">
  <meta name="twitter:image" content="${meta.ogImage || `${SITE_URL}/og-image.jpg`}">
  ${jsonLdTag}
  ${flagDataTag}
  <link rel="preload" as="font" type="font/woff2" href="/fonts/inter-latin.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="/fonts/press-start-2p-400.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="/fonts/space-mono-400.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="/fonts/space-mono-700.woff2" crossorigin>
  ${assets.js.map((src) => `<script type="module" crossorigin src="${src}"></script>`).join('\n  ')}
  ${modulePreloadTags}
  ${assets.css.map((href) => `<link rel="stylesheet" crossorigin href="${href}">`).join('\n  ')}
</head>
<body>
  <div id="root">
    ${bodyHtml}
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Country flag page
// ---------------------------------------------------------------------------

function generateCountryPage(country: Country, assets: Assets): string {
  const slug = slugify(country.name);
  const emoji = getFlagEmoji(country.code);
  const features = flagFeatures[country.code];
  const desc = flagDescriptions[country.code];
  const allCodes = countries.map((c) => c.code);
  const similar = features ? getSimilarFlags(country.code, allCodes) : [];
  const similarNames = similar.slice(0, 5).map((code) => {
    const c = countries.find((x) => x.code === code);
    return c ? `<a href="/flags/${slugify(c.name)}">${emoji} ${escapeHtml(c.name)}</a>` : '';
  }).filter(Boolean);

  const continentSlug = slugify(country.continent);
  const continentCountries = countries.filter((c) => c.continent === country.continent && c.code !== country.code);

  const descriptionText = desc?.description || `The flag of ${country.name} is located in ${country.continent}.`;
  const pageDescription = desc?.description
    || `Learn about the flag of ${country.name}. Explore the colors, meaning, and history, then test your knowledge in our flag quiz!`;

  const facts = countryFacts[country.code];
  const flagFilename = `flag-${slug}.svg`;
  const quickFactsHtml = facts ? buildQuickFactsHtml(facts, desc?.adopted) : '';
  const flagActionsHtml = buildFlagActionsHtml(emoji, flagFilename, country.name);
  const borderingHtml = facts?.borders?.length ? buildBorderingCountriesHtml(facts.borders) : '';

  let bodyHtml = `
    <nav aria-label="Breadcrumb" style="padding:8px 16px;font-family:'Space Mono',monospace;font-size:14px;">
      <a href="/">Home</a> / <a href="/flags">Flags</a> / <a href="/flags/continent/${continentSlug}">${escapeHtml(country.continent)}</a> / ${escapeHtml(country.name)}
    </nav>
    <main style="max-width:768px;margin:0 auto;padding:16px;">
      <div style="text-align:center;font-size:8rem;line-height:1;">${emoji}</div>
      <h1 style="font-family:'Press Start 2P',cursive;text-align:center;margin:16px 0;">Flag of ${escapeHtml(country.name)}</h1>
      <p style="text-align:center;font-family:'Space Mono',monospace;font-size:14px;color:#6B7280;">
        ${escapeHtml(country.continent)}
      </p>
      ${flagActionsHtml}
      ${quickFactsHtml}

      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">About This Flag</h2>
        ${splitIntoParagraphs(descriptionText)
          .map(
            (para) =>
              `<p style="font-family:'Space Mono',monospace;font-size:14px;line-height:1.6;margin:0 0 12px 0;">${escapeHtml(para)}</p>`,
          )
          .join('\n        ')}
        ${
          desc?.meaning
            ? `<div style="margin-top:16px;border-left:4px solid #3B82F6;background:rgba(255,217,61,0.2);padding:16px;">
          <h3 style="font-family:'Press Start 2P',cursive;font-size:11px;margin:0 0 8px 0;">What the colors & design mean</h3>
          <p style="font-family:'Space Mono',monospace;font-size:13px;line-height:1.6;margin:0;">${escapeHtml(desc.meaning)}</p>
        </div>`
            : ''
        }
        ${
          features
            ? (() => {
                const colorChips = features.colors
                  .map(
                    (c) =>
                      `<span style="display:inline-flex;align-items:center;gap:4px;border:1px solid #2D2D2D;padding:2px 8px;font-size:13px;font-family:'Space Mono',monospace;">
            <span style="display:inline-block;width:16px;height:16px;background:${colorHex[c] || '#ccc'};border:1px solid #2D2D2D;"></span> ${c}
          </span>`,
                  )
                  .join(' ');
                const patternLabelStr = features.patterns.map((p) => patternLabels[p] || p).join(', ');
                return `<div style="margin-top:16px;">
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;">${colorChips}</div>
          <p style="font-family:'Space Mono',monospace;font-size:13px;margin:0;"><strong>Pattern:</strong> ${patternLabelStr}</p>
        </div>`;
              })()
            : ''
        }
      </section>
      ${borderingHtml}`;

  if (desc?.funFacts && desc.funFacts.length > 0) {
    bodyHtml += `
      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Fun Facts</h2>
        <ul style="font-family:'Space Mono',monospace;font-size:14px;line-height:1.6;padding-left:20px;">
          ${desc.funFacts.map((f) => `<li>${escapeHtml(f)}</li>`).join('\n          ')}
        </ul>
      </section>`;
  }

  if (similarNames.length > 0) {
    bodyHtml += `
      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Similar looking flags</h2>
        <p style="font-family:'Space Mono',monospace;font-size:13px;">These flags share similar colors and patterns:</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
          ${similarNames.join('\n          ')}
        </div>
      </section>`;
  }

  // More from continent
  if (continentCountries.length > 0) {
    const links = continentCountries.slice(0, 8).map((c) =>
      `<a href="/flags/${slugify(c.name)}" style="text-decoration:none;">${getFlagEmoji(c.code)} ${escapeHtml(c.name)}</a>`
    ).join(' &middot; ');

    bodyHtml += `
      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">More ${escapeHtml(country.continent)} Flags</h2>
        <p style="font-family:'Space Mono',monospace;font-size:13px;line-height:2;">${links}</p>
        <p><a href="/flags/continent/${continentSlug}">View all ${escapeHtml(country.continent)} flags &rarr;</a></p>
      </section>`;
  }

  // Cross-category internal links
  if (features) {
    const categoryLinks: string[] = [];
    const linkStyle = 'display:inline-block;border:1px solid #2D2D2D;padding:4px 12px;text-decoration:none;font-size:13px;font-family:\'Space Mono\',monospace;';

    for (const color of features.colors) {
      categoryLinks.push(`<a href="/flags/with-${color}" style="${linkStyle}text-transform:capitalize;">Flags with ${color}</a>`);
    }

    const patternSlugMap: Record<string, string> = {
      'horizontal-stripes': 'horizontal-stripes',
      'vertical-stripes': 'vertical-stripes',
      'cross': 'with-crosses',
      'diagonal': 'diagonal-designs',
      'canton': 'canton-designs',
    };
    for (const p of features.patterns) {
      const patternSlug = patternSlugMap[p];
      if (patternSlug) {
        categoryLinks.push(`<a href="/flags/${patternSlug}" style="${linkStyle}">${patternLabels[p]}</a>`);
      }
    }

    if (features.colors.includes('red') && features.colors.includes('white') && features.colors.includes('blue')) {
      categoryLinks.push(`<a href="/flags/red-white-and-blue-flags" style="${linkStyle}">Red, White &amp; Blue Flags</a>`);
    }

    bodyHtml += `
      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Explore by Category</h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
          ${categoryLinks.join('\n          ')}
        </div>
      </section>`;
  }

  bodyHtml += `
      <section style="margin-top:32px;text-align:center;padding:24px;background:#FFD93D;border:2px solid #2D2D2D;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Test Your Knowledge!</h2>
        <p style="font-family:'Space Mono',monospace;font-size:14px;margin:8px 0 16px;">Think you can identify the flag of ${escapeHtml(country.name)}?</p>
        <a href="/play" style="font-family:'Press Start 2P',cursive;font-size:12px;background:#16A34A;color:white;padding:12px 24px;border:2px solid #2D2D2D;text-decoration:none;display:inline-block;">Play Flag Quiz</a>
      </section>
      <nav style="margin-top:24px;text-align:center;padding-bottom:32px;">
        <a href="/flags">All Flags</a> &middot; <a href="/quiz">Flag Quiz</a>
      </nav>
    </main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    name: `Flag of ${country.name}`,
    description: pageDescription,
    url: `${SITE_URL}/flags/${slug}`,
    publisher: { '@type': 'Organization', name: 'Flag Arcade', url: SITE_URL },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Flags', item: `${SITE_URL}/flags` },
        { '@type': 'ListItem', position: 3, name: country.continent, item: `${SITE_URL}/flags/continent/${continentSlug}` },
        { '@type': 'ListItem', position: 4, name: country.name },
      ],
    },
  };

  return buildPage(
    {
      title: `${country.name} Flag - Colors, Meaning & History | Flag Arcade`,
      description: pageDescription,
      canonical: `${SITE_URL}/flags/${slug}`,
      ogImage: `${SITE_URL}/og/${slug}.jpg`,
      jsonLd,
      flagData: {
        code: country.code,
        ...(desc ? { description: desc } : {}),
        ...(facts ? { facts } : {}),
      },
    },
    bodyHtml,
    assets,
    'CountryFlagPage',
  );
}

// ---------------------------------------------------------------------------
// Flags directory page
// ---------------------------------------------------------------------------

function generateDirectoryPage(assets: Assets): string {
  let bodyHtml = `
    <nav aria-label="Breadcrumb" style="padding:8px 16px;font-family:'Space Mono',monospace;font-size:14px;">
      <a href="/">Home</a> / Flags
    </nav>
    <main style="max-width:960px;margin:0 auto;padding:16px;">
      <h1 style="font-family:'Press Start 2P',cursive;">Flags of the World</h1>
      <p style="font-family:'Space Mono',monospace;font-size:14px;line-height:1.6;">
        Explore all ${countries.length} country flags from every continent. Click any flag to learn about its colors, meaning, and history.
      </p>`;

  for (const continent of continents) {
    const cc = countries.filter((c) => c.continent === continent);
    const links = cc.map((c) =>
      `<a href="/flags/${slugify(c.name)}" style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border:1px solid #2D2D2D;text-decoration:none;font-size:13px;font-family:'Space Mono',monospace;">${getFlagEmoji(c.code)} ${escapeHtml(c.name)}</a>`
    ).join('\n          ');

    bodyHtml += `
      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">
          <a href="/flags/continent/${slugify(continent)}">${escapeHtml(continent)}</a> (${cc.length})
        </h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
          ${links}
        </div>
      </section>`;
  }

  bodyHtml += `
      <section style="margin-top:32px;text-align:center;padding:24px;background:#FFD93D;border:2px solid #2D2D2D;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">How Many Flags Can You Identify?</h2>
        <p style="font-family:'Space Mono',monospace;font-size:14px;margin:8px 0 16px;">Test your knowledge with our free quiz!</p>
        <a href="/play" style="font-family:'Press Start 2P',cursive;font-size:12px;background:#16A34A;color:white;padding:12px 24px;border:2px solid #2D2D2D;text-decoration:none;display:inline-block;">Play Flag Quiz</a>
      </section>
    </main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Flags of the World',
    description: `Browse all ${countries.length} country flags organized by continent.`,
    url: `${SITE_URL}/flags`,
    publisher: { '@type': 'Organization', name: 'Flag Arcade', url: SITE_URL },
  };

  return buildPage(
    {
      title: `Flags of the World - All ${countries.length} Country Flags | Flag Arcade`,
      description: `Browse all ${countries.length} country flags of the world organized by continent. Learn flag colors, meanings, and fun facts. Play our free flag quiz to test your knowledge!`,
      canonical: `${SITE_URL}/flags`,
      jsonLd,
    },
    bodyHtml,
    assets,
    'FlagsDirectoryPage',
  );
}

// ---------------------------------------------------------------------------
// Continent page
// ---------------------------------------------------------------------------

function generateContinentPage(continent: Continent, assets: Assets): string {
  const slug = slugify(continent);
  const cc = countries.filter((c) => c.continent === continent);

  const continentDropdownOptions = continents.map((c) => {
    const cSlug = slugify(c);
    const isCurrent = c === continent;
    return `<a href="/flags/continent/${cSlug}" style="display:block;padding:6px 12px;font-family:'Space Mono',monospace;font-size:13px;text-decoration:none;color:${isCurrent ? '#2D2D2D' : '#6B7280'};${isCurrent ? 'font-weight:bold;background:rgba(255,217,61,0.4);' : ''}white-space:nowrap;">${escapeHtml(c)}</a>`;
  }).join('\n            ');

  let bodyHtml = `
    <nav aria-label="Breadcrumb" style="padding:8px 16px;font-family:'Space Mono',monospace;font-size:14px;">
      <a href="/">Home</a> / <a href="/flags">Flags</a> /
      <span style="position:relative;display:inline-block;" class="continent-dropdown">
        <button onclick="this.parentElement.querySelector('.dropdown-menu').classList.toggle('open')" style="font-family:'Space Mono',monospace;font-size:14px;background:none;border:none;cursor:pointer;text-decoration:underline;padding:0;color:#2D2D2D;display:inline-flex;align-items:center;gap:4px;">
          ${escapeHtml(continent)}
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M3 5l3 3 3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="dropdown-menu" style="display:none;position:absolute;top:100%;left:0;margin-top:4px;background:#FFF8E7;border:2px solid #2D2D2D;box-shadow:4px 4px 0 #2D2D2D;z-index:50;min-width:160px;">
          ${continentDropdownOptions}
        </div>
      </span>
      <style>.dropdown-menu.open{display:block!important;}</style>
    </nav>
    <main style="max-width:960px;margin:0 auto;padding:16px;">
      <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">
        ${getContinentMapSvg(slug)}
        <div>
          <h1 style="font-family:'Press Start 2P',cursive;">${escapeHtml(continent)} Flags</h1>
          <p style="font-family:'Space Mono',monospace;font-size:14px;">All ${cc.length} country flags from ${escapeHtml(continent)}.</p>
        </div>
      </div>`;

  const allLinks = cc.map((c) =>
    `<a href="/flags/${slugify(c.name)}" style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border:1px solid #2D2D2D;text-decoration:none;font-size:13px;font-family:'Space Mono',monospace;">${getFlagEmoji(c.code)} ${escapeHtml(c.name)}</a>`
  ).join('\n          ');

  bodyHtml += `
      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:12px;">All Flags (${cc.length})</h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">${allLinks}</div>
      </section>`;

  bodyHtml += `
      <section style="margin-top:32px;text-align:center;padding:24px;background:#FFD93D;border:2px solid #2D2D2D;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Take the ${escapeHtml(continent)} Flag Quiz!</h2>
        <p style="font-family:'Space Mono',monospace;font-size:14px;margin:8px 0 16px;">Can you identify all ${cc.length} flags?</p>
        <a href="/quiz/${slug}" style="font-family:'Press Start 2P',cursive;font-size:12px;background:#16A34A;color:white;padding:12px 24px;border:2px solid #2D2D2D;text-decoration:none;display:inline-block;">Take ${escapeHtml(continent)} Quiz</a>
      </section>

      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:12px;">Explore Other Continents</h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
          ${continents.filter((c) => c !== continent).map((c) => {
            const cSlug = slugify(c);
            const cCount = countries.filter((co) => co.continent === c).length;
            return `<a href="/flags/continent/${cSlug}" style="border:1px solid #2D2D2D;padding:8px 14px;text-decoration:none;font-family:'Space Mono',monospace;font-size:13px;">${escapeHtml(c)} (${cCount})</a>`;
          }).join('\n          ')}
        </div>
      </section>

      <nav style="margin-top:24px;text-align:center;padding-bottom:32px;">
        <a href="/flags">All Flags</a> &middot; <a href="/quiz">Flag Quiz</a> &middot; <a href="/play">Play Game</a>
      </nav>
    </main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${continent} Flags`,
    description: `Explore all ${cc.length} flags from ${continent}. Learn the colors, meanings, and history of every ${continent.toLowerCase()} country flag.`,
    url: `${SITE_URL}/flags/continent/${slug}`,
    numberOfItems: cc.length,
    publisher: { '@type': 'Organization', name: 'Flag Arcade', url: SITE_URL },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Flags', item: `${SITE_URL}/flags` },
        { '@type': 'ListItem', position: 3, name: continent },
      ],
    },
  };

  return buildPage(
    {
      title: `${continent} Flags - All ${cc.length} Country Flags | Flag Arcade`,
      description: `Explore all ${cc.length} flags from ${continent}. Learn the colors, meanings, and history of every ${continent.toLowerCase()} country flag. Test yourself with our flag quiz!`,
      canonical: `${SITE_URL}/flags/continent/${slug}`,
      jsonLd,
    },
    bodyHtml,
    assets,
    'ContinentFlagsPage',
  );
}

// ---------------------------------------------------------------------------
// Quiz landing page
// ---------------------------------------------------------------------------

function generateQuizPage(assets: Assets): string {
  const bodyHtml = `
    <nav aria-label="Breadcrumb" style="padding:8px 16px;font-family:'Space Mono',monospace;font-size:14px;">
      <a href="/">Home</a> / Flag Quiz
    </nav>
    <main style="max-width:768px;margin:0 auto;padding:16px;">
      <div style="text-align:center;">
        <div style="font-size:3rem;">🏳️ 🌍 🏴</div>
        <h1 style="font-family:'Press Start 2P',cursive;margin:16px 0;">Flag Quiz</h1>
        <p style="font-family:'Space Mono',monospace;font-size:14px;line-height:1.6;max-width:500px;margin:0 auto;">
          Test your knowledge of world flags! With ${countries.length} countries across ${continents.length} continents,
          Flag Arcade is the most fun way to learn flags from around the globe.
        </p>
        <a href="/play" style="display:inline-block;margin-top:24px;font-family:'Press Start 2P',cursive;font-size:14px;background:#16A34A;color:white;padding:16px 32px;border:2px solid #2D2D2D;text-decoration:none;">Play Now — It's Free!</a>
      </div>

      <section style="margin-top:32px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Game Modes</h2>
        <ul style="font-family:'Space Mono',monospace;font-size:14px;line-height:2;">
          <li>🗺️ <strong>Journey Mode</strong> — Progress through worlds of increasing difficulty</li>
          <li>🕹️ <strong>Arcade Mode</strong> — Free play with all flags</li>
          <li>🌍 <strong>Around the World</strong> — Race through flags from every continent</li>
          <li>❓ <strong>Jeopardy Mode</strong> — See the name, pick the flag</li>
          <li>📺 <strong>Presentation Mode</strong> — Perfect for classrooms</li>
          <li>🏃 <strong>Flag Runner</strong> — Pixel-art platformer with flag collecting</li>
        </ul>
      </section>

      <section style="margin-top:32px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Quiz by Continent</h2>
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:12px;">
          ${continents.map((cont) => {
            const count = countries.filter((c) => c.continent === cont).length;
            return `<a href="/flags/continent/${slugify(cont)}" style="border:1px solid #2D2D2D;padding:12px 16px;text-decoration:none;font-family:'Space Mono',monospace;font-size:13px;">${escapeHtml(cont)} (${count})</a>`;
          }).join('\n          ')}
        </div>
      </section>

      <section style="margin-top:32px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Frequently Asked Questions</h2>
        <div style="font-family:'Space Mono',monospace;font-size:14px;line-height:1.6;">
          <p><strong>Is Flag Arcade free?</strong><br>Yes! Flag Arcade is completely free to play with no ads.</p>
          <p style="margin-top:12px;"><strong>How many flags are in the quiz?</strong><br>Flag Arcade includes flags from all ${countries.length} recognized countries.</p>
          <p style="margin-top:12px;"><strong>Can I play on my phone?</strong><br>Yes! Works on any device. Native iOS and Android apps are also available.</p>
          <p style="margin-top:12px;"><strong>Is this good for classrooms?</strong><br>Absolutely! Presentation Mode is designed for teachers.</p>
        </div>
      </section>

      <nav style="margin-top:24px;text-align:center;padding-bottom:32px;">
        <a href="/flags">Browse All Flags</a> &middot; <a href="/play">Play Now</a>
      </nav>
    </main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Flag Arcade',
    description: 'Free online flag quiz game with 197 country flags and 6 game modes.',
    url: `${SITE_URL}/quiz`,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  return buildPage(
    {
      title: 'Flag Quiz - Free Online Flag Guessing Game | Flag Arcade',
      description: `Play the ultimate free flag quiz! Guess flags from ${countries.length} countries across 6 game modes. Journey mode, arcade, jeopardy, and more. Learn world flags the fun way!`,
      canonical: `${SITE_URL}/quiz`,
      jsonLd,
    },
    bodyHtml,
    assets,
    'QuizLandingPage',
  );
}

// ---------------------------------------------------------------------------
// Continent quiz page (static HTML for /quiz/{slug})
// ---------------------------------------------------------------------------

function generateContinentQuizStaticPage(continent: Continent, assets: Assets): string {
  const slug = slugify(continent);
  const cc = countries.filter((c) => c.continent === continent);

  const easyFlags = cc.filter((c) => c.difficulty <= 2);
  const hardFlags = cc.filter((c) => c.difficulty >= 4);

  let bodyHtml = `
    <nav aria-label="Breadcrumb" style="padding:8px 16px;font-family:'Space Mono',monospace;font-size:14px;">
      <a href="/">Home</a> / <a href="/quiz">Quiz</a> / ${escapeHtml(continent)}
    </nav>
    <main style="max-width:768px;margin:0 auto;padding:16px;">
      <div style="text-align:center;">
        <h1 style="font-family:'Press Start 2P',cursive;margin:16px 0;">${escapeHtml(continent)} Flag Quiz</h1>
        <p style="font-family:'Space Mono',monospace;font-size:14px;line-height:1.6;max-width:500px;margin:0 auto;">
          Can you identify all ${cc.length} flags from ${escapeHtml(continent)}? Test your knowledge in this
          free flag quiz covering every country in ${escapeHtml(continent)}.
        </p>
        <a href="/quiz/${slug}" style="display:inline-block;margin-top:24px;font-family:'Press Start 2P',cursive;font-size:14px;background:#16A34A;color:white;padding:16px 32px;border:2px solid #2D2D2D;text-decoration:none;">Start ${escapeHtml(continent)} Quiz</a>
      </div>

      <section style="margin-top:32px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">What You'll Be Quizzed On</h2>
        <p style="font-family:'Space Mono',monospace;font-size:14px;line-height:1.6;">
          This quiz covers ${cc.length} countries from ${escapeHtml(continent)}. You'll see a flag and need to
          identify the correct country. Flags are shown in random order with multiple-choice answers.
        </p>
      </section>`;

  if (easyFlags.length > 0) {
    bodyHtml += `
      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Easiest ${escapeHtml(continent)} Flags</h2>
        <p style="font-family:'Space Mono',monospace;font-size:13px;line-height:1.6;">These are the most recognizable flags — start here if you're a beginner:</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
          ${easyFlags.slice(0, 8).map((c) =>
            `<a href="/flags/${slugify(c.name)}" style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border:1px solid #2D2D2D;text-decoration:none;font-size:13px;font-family:'Space Mono',monospace;">${getFlagEmoji(c.code)} ${escapeHtml(c.name)}</a>`
          ).join('\n          ')}
        </div>
      </section>`;
  }

  if (hardFlags.length > 0) {
    bodyHtml += `
      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Hardest ${escapeHtml(continent)} Flags</h2>
        <p style="font-family:'Space Mono',monospace;font-size:13px;line-height:1.6;">Think you're an expert? These flags trip up even seasoned players:</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
          ${hardFlags.slice(0, 8).map((c) =>
            `<a href="/flags/${slugify(c.name)}" style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border:1px solid #2D2D2D;text-decoration:none;font-size:13px;font-family:'Space Mono',monospace;">${getFlagEmoji(c.code)} ${escapeHtml(c.name)}</a>`
          ).join('\n          ')}
        </div>
      </section>`;
  }

  bodyHtml += `
      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">All ${escapeHtml(continent)} Flags (${cc.length})</h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
          ${cc.map((c) =>
            `<a href="/flags/${slugify(c.name)}" style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border:1px solid #2D2D2D;text-decoration:none;font-size:13px;font-family:'Space Mono',monospace;">${getFlagEmoji(c.code)} ${escapeHtml(c.name)}</a>`
          ).join('\n          ')}
        </div>
      </section>

      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:12px;">Quiz Other Continents</h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
          ${continents.filter((c) => c !== continent).map((c) => {
            const cSlug = slugify(c);
            const cCount = countries.filter((co) => co.continent === c).length;
            return `<a href="/quiz/${cSlug}" style="border:1px solid #2D2D2D;padding:8px 14px;text-decoration:none;font-family:'Space Mono',monospace;font-size:13px;">${escapeHtml(c)} (${cCount})</a>`;
          }).join('\n          ')}
        </div>
      </section>

      <section style="margin-top:32px;text-align:center;padding:24px;background:#FFD93D;border:2px solid #2D2D2D;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Ready to Play?</h2>
        <p style="font-family:'Space Mono',monospace;font-size:14px;margin:8px 0 16px;">Test yourself on all ${cc.length} ${escapeHtml(continent)} flags!</p>
        <a href="/quiz/${slug}" style="font-family:'Press Start 2P',cursive;font-size:12px;background:#16A34A;color:white;padding:12px 24px;border:2px solid #2D2D2D;text-decoration:none;display:inline-block;">Start Quiz</a>
      </section>
      <nav style="margin-top:24px;text-align:center;padding-bottom:32px;">
        <a href="/flags/continent/${slug}">Browse ${escapeHtml(continent)} Flags</a> &middot; <a href="/quiz">All Quizzes</a> &middot; <a href="/play">Play Game</a>
      </nav>
    </main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: `${continent} Flag Quiz`,
    description: `Can you identify all ${cc.length} flags from ${continent}? Free online flag quiz.`,
    url: `${SITE_URL}/quiz/${slug}`,
    educationalLevel: 'beginner',
    about: { '@type': 'Thing', name: `${continent} country flags` },
    provider: { '@type': 'Organization', name: 'Flag Arcade', url: SITE_URL },
  };

  return buildPage(
    {
      title: `${continent} Flag Quiz - Identify All ${cc.length} Flags | Flag Arcade`,
      description: `Can you identify all ${cc.length} ${continent.toLowerCase()} country flags? Take the free ${continent} flag quiz. Learn and test your knowledge of every flag in ${continent}!`,
      canonical: `${SITE_URL}/quiz/${slug}`,
      jsonLd,
    },
    bodyHtml,
    assets,
    'ContinentQuizPage',
  );
}

// ---------------------------------------------------------------------------
// Long-tail content pages
// ---------------------------------------------------------------------------

interface ContentPage {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  body?: string;
  getCountries: () => Country[];
}

function generateContentPage(page: ContentPage, assets: Assets): string {
  const matchedCountries = page.getCountries();

  let bodyHtml = `
    <nav aria-label="Breadcrumb" style="padding:8px 16px;font-family:'Space Mono',monospace;font-size:14px;">
      <a href="/">Home</a> / <a href="/flags">Flags</a> / ${escapeHtml(page.h1)}
    </nav>
    <main style="max-width:960px;margin:0 auto;padding:16px;">
      <h1 style="font-family:'Press Start 2P',cursive;">${escapeHtml(page.h1)}</h1>
      ${
        page.body
          ? splitIntoParagraphs(page.body)
              .map(
                (para) =>
                  `<p style="font-family:'Space Mono',monospace;font-size:14px;line-height:1.6;margin:0 0 12px 0;">${escapeHtml(para)}</p>`,
              )
              .join('\n      ')
          : `<p style="font-family:'Space Mono',monospace;font-size:14px;line-height:1.6;">${escapeHtml(page.intro)}</p>`
      }

      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">${matchedCountries.length} Flags</h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
          ${matchedCountries.map((c) =>
            `<a href="/flags/${slugify(c.name)}" style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border:1px solid #2D2D2D;text-decoration:none;font-size:13px;font-family:'Space Mono',monospace;">${getFlagEmoji(c.code)} ${escapeHtml(c.name)}</a>`
          ).join('\n          ')}
        </div>
      </section>

      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">By Continent</h2>
        <div style="font-family:'Space Mono',monospace;font-size:13px;line-height:2;">
          ${continents.map((cont) => {
            const inContinent = matchedCountries.filter((c) => c.continent === cont);
            if (inContinent.length === 0) return '';
            return `<p><strong><a href="/flags/continent/${slugify(cont)}">${escapeHtml(cont)}</a></strong> (${inContinent.length}): ${inContinent.map((c) => `<a href="/flags/${slugify(c.name)}">${escapeHtml(c.name)}</a>`).join(', ')}</p>`;
          }).filter(Boolean).join('\n          ')}
        </div>
      </section>

      <section style="margin-top:32px;text-align:center;padding:24px;background:#FFD93D;border:2px solid #2D2D2D;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Can You Identify These Flags?</h2>
        <p style="font-family:'Space Mono',monospace;font-size:14px;margin:8px 0 16px;">Test your knowledge with our free quiz!</p>
        <a href="/play" style="font-family:'Press Start 2P',cursive;font-size:12px;background:#16A34A;color:white;padding:12px 24px;border:2px solid #2D2D2D;text-decoration:none;display:inline-block;">Play Flag Quiz</a>
      </section>
      <nav style="margin-top:24px;text-align:center;padding-bottom:32px;">
        <a href="/flags">All Flags</a> &middot; <a href="/quiz">Flag Quiz</a> &middot; <a href="/play">Play Game</a>
      </nav>
    </main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: page.h1,
    description: page.description,
    url: `${SITE_URL}/flags/${page.slug}`,
    numberOfItems: matchedCountries.length,
    publisher: { '@type': 'Organization', name: 'Flag Arcade', url: SITE_URL },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Flags', item: `${SITE_URL}/flags` },
        { '@type': 'ListItem', position: 3, name: page.h1 },
      ],
    },
  };

  return buildPage(
    {
      title: page.title,
      description: page.description,
      canonical: `${SITE_URL}/flags/${page.slug}`,
      jsonLd,
    },
    bodyHtml,
    assets,
    'ContentPage',
  );
}

function getContentPages(): ContentPage[] {
  const colorPages: ContentPage[] = [
    { color: 'red', label: 'Red' },
    { color: 'blue', label: 'Blue' },
    { color: 'green', label: 'Green' },
    { color: 'yellow', label: 'Yellow' },
    { color: 'white', label: 'White' },
    { color: 'black', label: 'Black' },
    { color: 'orange', label: 'Orange' },
  ].map(({ color, label }) => ({
    slug: `with-${color}`,
    title: `Flags with ${label} - Country Flags Featuring ${label} | Flag Arcade`,
    description: `Browse all country flags that feature the color ${color.toLowerCase()}. See which nations use ${color.toLowerCase()} in their flag and learn why.`,
    h1: `Flags with ${label}`,
    intro: `These country flags all feature the color ${color.toLowerCase()} prominently in their design. Explore each flag to learn about its colors, meaning, and history.`,
    getCountries: () => countries.filter((c) => flagFeatures[c.code]?.colors.includes(color as any)),
  }));

  const patternBodies: Partial<Record<string, string>> = {
    'horizontal-stripes':
      "The horizontal tricolor is the single most common flag design on Earth. Its modern career began with the Dutch Statenvlag in the 1570s — orange, white, and blue bands that signaled rebellion against Spanish rule and later evolved into the red-white-blue Prinsenvlag still used today. Russia adopted a Dutch-style tricolor under Peter the Great in 1696, and the pattern became the visual shorthand for European republics across the next three centuries. The horizontal tricolor traveled the world through revolution and decolonization. Newly independent African states in the 1950s and 60s adopted the Pan-African colors of red, gold, and green in horizontal bands, following Ethiopia's example. Latin America inherited Gran Colombia's yellow-blue-red horizontal scheme, still visible today in the flags of Colombia, Venezuela, and Ecuador. Even when the colors differ, the underlying grammar — three equal bands stacked top to bottom — links Germany, India, Hungary, and dozens of others into the same visual family.",
    'vertical-stripes':
      "The vertical tricolor is the second-most common pattern in world vexillology, and almost every example traces back to revolutionary France. The 1794 French tricolor — blue at the hoist, white in the center, red at the fly — was deliberately designed by the painter Jacques-Louis David and the National Convention as a republican counterpoint to royal banners. Within two decades, the pattern had spread to every territory France touched, directly or by influence. Italy adopted vertical green-white-red bands in 1797, Belgium followed in 1831, and the Republic of Ireland's green-white-orange tricolor was first flown in 1848. Newly independent African states such as Mali, Senegal, Guinea, and Côte d'Ivoire all chose vertical tricolors in the early 1960s, layering the Pan-African colors onto a French structural template. The vertical band remains a marker of republican lineage and, often, a quiet acknowledgment of France's role in shaping modern statehood.",
    'with-crosses':
      "The cross is the oldest enduring motif in European vexillology. Most cross flags trace to the medieval crusades, when each Christian kingdom adopted a distinctive cross color to identify its troops on shared battlefields — England the red cross of St. George, Scotland the white saltire of St. Andrew, Denmark the white cross of the Dannebrog. The Dannebrog, in continuous use since at least 1370, is the oldest national flag still flown today. The off-center Nordic cross — vertical bar shifted toward the hoist — defines a regional family of its own. Denmark's pattern was copied by Sweden, Norway, Iceland, Finland, and the Faroe Islands, each substituting national colors but preserving the cross's exact proportions and offset. Outside Scandinavia, crosses appear on Switzerland's bold square white cross on red, Georgia's five-cross flag derived from medieval Georgian heraldry, and the British Union Jack — itself a layered combination of three crosses representing the union of England, Scotland, and Ireland.",
    'diagonal-designs':
      "Diagonal flags are a relatively modern invention, almost entirely a product of twentieth-century decolonization. Where stripes and crosses lock the eye into stable horizontal or vertical reading, a diagonal band suggests motion, division, or the sweep of a horizon — themes well suited to nations defining themselves at independence. Tanzania's flag, adopted in 1964 to mark the union of Tanganyika and Zanzibar, uses a black diagonal stripe to literally bridge the two former colonies' colors. Many other diagonal flags carry similar symbolism. The Democratic Republic of the Congo's yellow band cuts across a sky-blue field as a marker of national unity, while the Republic of the Congo, Trinidad and Tobago, and Namibia all use diagonals to represent rivers, the equator, or paths to nationhood. Pacific nations including the Solomon Islands, Marshall Islands, and Papua New Guinea favor diagonals because the angled line reads naturally as the horizon at sea, rooting each flag in the maritime geography of its people.",
    'canton-designs':
      "In vexillology, a canton is the upper-hoist quarter of a flag — the rectangle nearest the flagpole. The term comes from heraldry, where a small square in the chief corner of a shield was used to layer a secondary symbol over the main design. The most influential canton in the world is the blue field of fifty white stars on the United States flag, adopted in its first form in 1777. Its formula — a striped field with a star-filled canton — was deliberately echoed by Liberia in 1847 and Malaysia in 1950, both signaling political kinship with the American republic. A second great canton tradition comes from the British Union Jack, which still appears in the upper-hoist corner of Australia, New Zealand, Fiji, and Tuvalu as a marker of historical sovereignty layered onto each nation's own symbols.",
    'solid-designs':
      "A solid-field flag is the simplest possible vexillological statement: a single block of color, sometimes carrying a central emblem, with no stripes or divisions to break the field. The simplicity is intentional. A single dominant color reads at any distance, resists confusion with neighboring nations, and gives a central symbol — a sun, a crescent, an eagle, or a written inscription — maximum visual weight. Japan's white field with a single red disc, adopted in 1870 and reaffirmed in 1999, is the clearest expression of this idea. Several of the world's most recognizable flags fall in this category. China's red field with five gold stars, adopted in 1949, sets the smaller stars in orbit around a larger one to symbolize the people united around the Communist Party. Saudi Arabia's green flag carries the shahada in white Arabic calligraphy and is treated as so sacred that it is never flown at half-mast. Switzerland's square white cross on red — one of only two square national flags in the world — and Vietnam's red flag with a single yellow star round out a category that proves restraint can carry as much meaning as elaboration.",
    'complex-designs':
      "Complex flags are the outliers of national vexillology — designs that refuse to fit a single stripe, cross, or canton convention. Often they layer multiple geometric elements, carry detailed central emblems, or break flag-design rules entirely. South Africa's 1994 post-apartheid flag is the canonical example: six colors arranged into a horizontal Y that converges at the hoist, deliberately designed to represent the merging of diverse paths into a single nation. Nepal stands alone as the world's only non-rectangular national flag, formed by two stacked crimson pennants edged in blue, with a stylized white sun and moon at their centers. The current shape was codified in the 1962 constitution but the underlying double-pennant design has been used by Nepali rulers for centuries. Other complex flags include Sri Lanka, which encloses a golden lion holding a sword within bordering panels of green and orange; Bhutan, with its white thunder dragon clutching jewels across a yellow-and-orange diagonal field; and tiny Antigua and Barbuda, whose rising-sun motif sits inside a black, blue, and white V on a red field.",
  };

  const patternPages: ContentPage[] = [
    { pattern: 'horizontal-stripes', label: 'Horizontal Stripes', slug: 'horizontal-stripes' },
    { pattern: 'vertical-stripes', label: 'Vertical Stripes', slug: 'vertical-stripes' },
    { pattern: 'cross', label: 'Crosses', slug: 'with-crosses' },
    { pattern: 'diagonal', label: 'Diagonal Designs', slug: 'diagonal-designs' },
    { pattern: 'canton', label: 'Canton Designs', slug: 'canton-designs' },
    { pattern: 'solid', label: 'Solid Fields', slug: 'solid-designs' },
    { pattern: 'complex', label: 'Complex Designs', slug: 'complex-designs' },
  ].map(({ pattern, label, slug }) => ({
    slug,
    title: `Flags with ${label} - ${label} Flag Designs | Flag Arcade`,
    description: `Browse all country flags featuring ${label.toLowerCase()} in their design. Compare flags that share similar patterns.`,
    h1: `Flags with ${label}`,
    intro: `These country flags all use a ${label.toLowerCase()} pattern. Many flags around the world share this design element — can you tell them apart?`,
    body: patternBodies[slug],
    getCountries: () => countries.filter((c) => flagFeatures[c.code]?.patterns.includes(pattern)),
  }));

  const comboFilter = (c: { code: string }, ...colors: string[]) => {
    const f = flagFeatures[c.code];
    return f ? colors.every((col) => f.colors.includes(col)) : false;
  };

  const comboPages: ContentPage[] = [
    {
      slug: 'red-white-and-blue-flags',
      title: 'Red, White, and Blue Flags — Countries List | Flag Arcade',
      h1: 'Red, White, and Blue Flags',
      description: 'Which countries have red, white, and blue flags? Browse all flags featuring this popular color combination and learn what the colors represent.',
      intro: 'Red, white, and blue is one of the most popular color combinations in national flags. These countries all feature this classic trio — but can you tell them apart?',
      getCountries: () => countries.filter((c) => comboFilter(c, 'red', 'white', 'blue')),
    },
    {
      slug: 'green-white-and-red-flags',
      title: 'Green, White, and Red Flags — Countries List | Flag Arcade',
      h1: 'Green, White, and Red Flags',
      description: 'Which countries have green, white, and red flags? See all national flags with this color combination — from Italy and Mexico to Hungary and Iran.',
      intro: 'Green, white, and red is a striking color trio shared by flags across multiple continents. From European tricolors to Middle Eastern banners, these flags all feature this bold combination.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'green', 'white', 'red')),
    },
    {
      slug: 'red-and-white-flags',
      title: 'Red and White Flags — Countries with Red & White Flags | Flag Arcade',
      h1: 'Red and White Flags',
      description: 'Browse all country flags featuring red and white. From Japan and Canada to Turkey and Switzerland — see every red and white flag in the world.',
      intro: 'Red and white is one of the most common two-color combinations in world flags. These countries all prominently feature red and white in their national flag.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'red', 'white')),
    },
    {
      slug: 'red-yellow-and-green-flags',
      title: 'Red, Yellow, and Green Flags — Countries List | Flag Arcade',
      h1: 'Red, Yellow, and Green Flags',
      description: 'Which countries have red, yellow, and green flags? These Pan-African colors appear on flags across Africa and beyond. See the full list.',
      intro: 'Red, yellow, and green — the Pan-African colors — appear on more national flags than almost any other trio. Rooted in the Ethiopian flag, this combination spread across Africa during decolonization and beyond.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'red', 'yellow', 'green')),
    },
    {
      slug: 'blue-and-white-flags',
      title: 'Blue and White Flags — Countries with Blue & White Flags | Flag Arcade',
      h1: 'Blue and White Flags',
      description: 'Browse all country flags featuring blue and white. From Greece and Finland to Argentina and Israel — see every blue and white flag.',
      intro: 'Blue and white flags evoke sky, sea, and peace. These countries all feature blue and white prominently in their national flag designs.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'blue', 'white')),
    },
    {
      slug: 'blue-and-yellow-flags',
      title: 'Blue and Yellow Flags — Countries with Blue & Yellow Flags | Flag Arcade',
      h1: 'Blue and Yellow Flags',
      description: 'Which countries have blue and yellow flags? From Ukraine and Sweden to Palau and Kazakhstan — browse all blue and yellow national flags.',
      intro: 'Blue and yellow is a vivid contrast seen on flags around the world. These countries all feature blue and yellow prominently in their national flag.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'blue', 'yellow')),
    },
    {
      slug: 'orange-white-and-green-flags',
      title: 'Orange, White, and Green Flags — Countries List | Flag Arcade',
      h1: 'Orange, White, and Green Flags',
      description: 'Which countries have orange, white, and green flags? See all national flags featuring this color combination, including Ireland and India.',
      intro: 'Orange, white, and green is an instantly recognizable color combination. From Ireland to India, these flags share a vibrant palette with distinct cultural meanings in each nation.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'orange', 'white', 'green')),
    },
    {
      slug: 'black-red-and-yellow-flags',
      title: 'Black, Red, and Yellow Flags — Countries List | Flag Arcade',
      h1: 'Black, Red, and Yellow Flags',
      description: 'Which countries have black, red, and yellow flags? From Germany and Belgium to Uganda and Angola — see all flags with this color combo.',
      intro: 'Black, red, and yellow is a bold combination found on flags across Europe and Africa. Germany\'s iconic tricolor is the most famous, but several other nations share this palette.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'black', 'red', 'yellow')),
    },
    {
      slug: 'red-white-and-black-flags',
      title: 'Red, White, and Black Flags — Countries List | Flag Arcade',
      h1: 'Red, White, and Black Flags',
      description: 'Which countries have red, white, and black flags? Browse all national flags featuring this Pan-Arab color combination.',
      intro: 'Red, white, and black form the Pan-Arab colors, appearing on flags across the Middle East and North Africa. These colors trace back to historical Arab dynasties and the Arab Revolt.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'red', 'white', 'black')),
    },
    {
      slug: 'green-and-white-flags',
      title: 'Green and White Flags — Countries with Green & White Flags | Flag Arcade',
      h1: 'Green and White Flags',
      description: 'Browse all country flags featuring green and white. From Nigeria and Pakistan to Saudi Arabia — see every green and white national flag.',
      intro: 'Green and white flags often carry associations with Islam, nature, or peace. These countries all feature green and white prominently in their national flag.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'green', 'white')),
    },
    {
      slug: 'red-and-yellow-flags',
      title: 'Red and Yellow Flags — Countries with Red & Yellow Flags | Flag Arcade',
      h1: 'Red and Yellow Flags',
      description: 'Which countries have red and yellow flags? From China and Spain to Vietnam and Macedonia — browse all red and yellow national flags.',
      intro: 'Red and yellow create a high-contrast, eye-catching combination used on flags across Asia, Europe, and beyond. These countries all prominently feature red and yellow.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'red', 'yellow')),
    },
    {
      slug: 'red-black-white-and-green-flags',
      title: 'Red, Black, White, and Green Flags — Countries List | Flag Arcade',
      h1: 'Red, Black, White, and Green Flags',
      description: 'Which countries have red, black, white, and green flags? These four Pan-Arab colors appear together on flags across the Middle East and Africa.',
      intro: 'Red, black, white, and green together form the complete set of Pan-Arab colors. Flags carrying all four trace their symbolism to the Arab Revolt of 1916 and the historical dynasties they represent.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'red', 'black', 'white', 'green')),
    },
    {
      slug: 'black-and-white-flags',
      title: 'Black and White Flags — Countries with Black & White Flags | Flag Arcade',
      h1: 'Black and White Flags',
      description: 'Browse all country flags featuring black and white. See which nations use this striking monochrome combination on their national flags.',
      intro: 'Black and white flags are bold and distinctive. These countries all feature black and white prominently in their national flag designs.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'black', 'white')),
    },
    {
      slug: 'green-and-yellow-flags',
      title: 'Green and Yellow Flags — Countries with Green & Yellow Flags | Flag Arcade',
      h1: 'Green and Yellow Flags',
      description: 'Which countries have green and yellow flags? From Brazil and Jamaica to Senegal and Mauritania — browse all green and yellow national flags.',
      intro: 'Green and yellow flags evoke tropical landscapes, agriculture, and natural wealth. These countries all feature green and yellow prominently in their national flag.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'green', 'yellow')),
    },
  ];

  const specialPages: ContentPage[] = [
    {
      slug: 'hardest-flags',
      title: 'Hardest Flags to Identify - Most Difficult Country Flags | Flag Arcade',
      description: 'Think you know your flags? These are the hardest country flags to identify. Most players can\'t get them all right. See how many you know!',
      h1: 'Hardest Flags to Identify',
      intro: 'These flags are rated as the most difficult to identify. They\'re the ones that trip up even experienced flag enthusiasts. How many can you get right?',
      getCountries: () => countries.filter((c) => c.difficulty >= 4).sort((a, b) => b.difficulty - a.difficulty),
    },
    {
      slug: 'easiest-flags',
      title: 'Easiest Flags to Identify - Most Recognizable Country Flags | Flag Arcade',
      description: 'Start with the easiest flags! These are the most recognizable country flags in the world. Perfect for beginners learning world flags.',
      h1: 'Easiest Flags to Identify',
      intro: 'These are the most recognizable flags in the world. If you\'re just starting to learn flags, begin here — you probably already know most of these!',
      getCountries: () => countries.filter((c) => c.difficulty <= 2).sort((a, b) => a.difficulty - b.difficulty),
    },
    {
      slug: 'similar-looking-flags',
      title: 'Flags That Look Alike - Similar Country Flags | Flag Arcade',
      description: 'Many country flags look surprisingly similar! Explore flags that share the same colors and patterns. Can you tell them apart?',
      h1: 'Flags That Look Alike',
      intro: 'Did you know many countries have nearly identical flags? These flags share similar colors and patterns, making them easy to confuse. Learning the subtle differences is the key to mastering flag identification.',
      getCountries: () => {
        // Get countries with the most common color combo (green, yellow, red)
        return countries.filter((c) => {
          const f = flagFeatures[c.code];
          return f && f.colors.includes('green') && f.colors.includes('yellow') && f.colors.includes('red');
        });
      },
    },
  ];

  return [...colorPages, ...patternPages, ...comboPages, ...specialPages];
}

// ---------------------------------------------------------------------------
// Patterns index page
// ---------------------------------------------------------------------------

function generatePatternsIndexPage(assets: Assets): string {
  const patternCards = flagPatternInfos.map((info) => {
    const count = countries.filter((c) => flagFeatures[c.code]?.patterns.includes(info.pattern)).length;
    return `
    <a href="/flags/${info.slug}" style="display:block;border:2px solid #2D2D2D;padding:18px;text-decoration:none;background:#FFF8E7;box-shadow:3px 3px 0 #2D2D2D;">
      <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;">
        <span style="font-family:'Press Start 2P',cursive;font-size:13px;color:#2D2D2D;">${info.emoji} ${escapeHtml(info.name)}</span>
        <span style="font-family:'Inter',sans-serif;font-size:12px;color:#6B7280;">${count} flag${count === 1 ? '' : 's'}</span>
      </div>
      <p style="font-family:'Inter',sans-serif;font-size:14px;color:#2D2D2D;line-height:1.6;margin:10px 0 0;">${escapeHtml(info.shortDescription)}</p>
      <p style="font-family:'Inter',sans-serif;font-size:13px;color:#4B5563;line-height:1.6;margin:8px 0 0;">${escapeHtml(info.longDescription)}</p>
    </a>`;
  }).join('\n');

  const bodyHtml = `
    <nav aria-label="Breadcrumb" style="padding:8px 16px;font-family:'Inter',sans-serif;font-size:14px;">
      <a href="/">Home</a> / Patterns
    </nav>
    <main style="max-width:960px;margin:0 auto;padding:16px;">
      <h1 style="font-family:'Press Start 2P',cursive;">Flag Design Patterns</h1>
      <p style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.7;">
        Almost every national flag in the world fits into one of seven structural patterns. Stripes, crosses, and cantons are the visual building blocks of vexillology — and once you can spot them, you can read any flag at a glance.
      </p>
      <p style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.7;">
        Browse each pattern below to see its history, the countries that share the design family, and how it spread around the world.
      </p>
      <section style="margin-top:24px;display:grid;grid-template-columns:1fr;gap:14px;">
      ${patternCards}
      </section>
      <section style="margin-top:32px;text-align:center;padding:24px;background:#FFD93D;border:2px solid #2D2D2D;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Test Your Pattern Knowledge</h2>
        <p style="font-family:'Inter',sans-serif;font-size:14px;margin:8px 0 16px;">Can you spot the canton, the cross, or the diagonal at a glance?</p>
        <a href="/quiz" style="font-family:'Press Start 2P',cursive;font-size:12px;background:#16A34A;color:white;padding:12px 24px;border:2px solid #2D2D2D;text-decoration:none;display:inline-block;">Play Flag Quiz</a>
      </section>
      <nav style="margin-top:24px;text-align:center;padding-bottom:32px;">
        <a href="/flags">All Flags</a> &middot; <a href="/organizations">Organizations</a> &middot; <a href="/quiz">Flag Quiz</a>
      </nav>
    </main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Flag Design Patterns',
    description: 'Explore the seven structural patterns that define almost every national flag: horizontal stripes, vertical stripes, crosses, diagonals, cantons, solid fields, and complex designs.',
    url: `${SITE_URL}/patterns`,
    numberOfItems: flagPatternInfos.length,
    publisher: { '@type': 'Organization', name: 'Flag Arcade', url: SITE_URL },
  };

  return buildPage(
    {
      title: 'Flag Design Patterns - Stripes, Crosses, Cantons & More | Flag Arcade',
      description: 'Explore the visual grammar of world flags. Browse country flags by design pattern: horizontal stripes, vertical stripes, crosses, diagonals, cantons, solid fields, and complex designs.',
      canonical: `${SITE_URL}/patterns`,
      jsonLd,
    },
    bodyHtml,
    assets,
    'PatternsPage',
  );
}

// ---------------------------------------------------------------------------
// Religions index page + detail pages
// ---------------------------------------------------------------------------

function generateReligionsIndexPage(assets: Assets): string {
  const entries = religions
    .map((r) => ({ religion: r, count: getCountriesForReligion(r).length }))
    .sort((a, b) => a.religion.name.localeCompare(b.religion.name));

  const cards = entries.map(({ religion, count }) => `
    <a href="/religions/${religion.slug}" style="display:flex;gap:16px;align-items:flex-start;border:2px solid #2D2D2D;padding:14px;text-decoration:none;background:#FFF8E7;box-shadow:3px 3px 0 #2D2D2D;">
      <div style="font-size:2rem;line-height:1;flex-shrink:0;" aria-hidden="true">${religion.emoji}</div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;">
          <span style="font-family:'Press Start 2P',cursive;font-size:12px;color:#2D2D2D;">${escapeHtml(religion.name)}</span>
          <span style="font-family:'Inter',sans-serif;font-size:12px;color:#6B7280;">${count} ${count === 1 ? 'country' : 'countries'}</span>
        </div>
        <p style="font-family:'Inter',sans-serif;font-size:14px;color:#2D2D2D;line-height:1.6;margin:8px 0 0;">${escapeHtml(religion.tagline)}</p>
      </div>
    </a>`).join('\n');

  const bodyHtml = `
    <nav aria-label="Breadcrumb" style="padding:8px 16px;font-family:'Inter',sans-serif;font-size:14px;">
      <a href="/">Home</a> / Religions
    </nav>
    <main style="max-width:960px;margin:0 auto;padding:16px;">
      <h1 style="font-family:'Press Start 2P',cursive;">World Religions</h1>
      <p style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.7;">
        Every flag carries the story of the people who fly it &mdash; and religion is often a big part of that story. Browse the major faiths below for a factual overview and a ranked list of the countries where each tradition is most widely practiced.
      </p>
      <section style="margin-top:24px;display:grid;grid-template-columns:1fr;gap:12px;">
      ${cards}
      </section>
      <nav style="margin-top:24px;text-align:center;padding-bottom:32px;">
        <a href="/flags">All Flags</a> &middot; <a href="/quiz">Flag Quiz</a>
      </nav>
    </main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'World Religions',
    description: 'Browse the world\'s major religions and see the countries where each is practiced.',
    url: `${SITE_URL}/religions`,
    numberOfItems: religions.length,
    publisher: { '@type': 'Organization', name: 'Flag Arcade', url: SITE_URL },
  };

  return buildPage(
    {
      title: 'World Religions - Countries & Beliefs | Flag Arcade',
      description: 'Browse the world\'s major religions and see the countries where each is practiced. Factual overviews of Christianity, Islam, Hinduism, Buddhism, Judaism, and more.',
      canonical: `${SITE_URL}/religions`,
      jsonLd,
    },
    bodyHtml,
    assets,
    'ReligionsIndexPage',
  );
}

function generateReligionPage(religion: Religion, assets: Assets): string {
  const adherents = getCountriesForReligion(religion);

  const rows = adherents.map((a, i) => {
    const country = countries.find((c) => c.code === a.code);
    if (!country) return '';
    const slug = slugify(country.name);
    return `
      <li>
        <a href="/flags/${slug}" style="display:flex;align-items:center;gap:12px;padding:8px;border:1px solid rgba(45,45,45,0.3);text-decoration:none;color:#2D2D2D;">
          <span style="font-family:'Press Start 2P',cursive;font-size:11px;color:#6B7280;width:28px;text-align:right;">${i + 1}.</span>
          <span style="font-size:1.8rem;line-height:1;">${getFlagEmoji(country.code)}</span>
          <span style="font-family:'Inter',sans-serif;font-size:14px;flex:1;">${escapeHtml(country.name)}</span>
          <span style="font-family:'Inter',sans-serif;font-size:14px;color:#6B7280;font-variant-numeric:tabular-nums;">${a.percent}%</span>
        </a>
      </li>`;
  }).join('\n');

  const listHtml = adherents.length === 0
    ? `<p style="font-family:'Inter',sans-serif;font-size:14px;color:#6B7280;">No countries currently report ${escapeHtml(religion.name)} adherence in our data set.</p>`
    : `<ol style="list-style:none;padding:0;margin:12px 0 0;display:flex;flex-direction:column;gap:8px;">${rows}</ol>`;

  const noteHtml = religion.undercount && adherents.length > 0
    ? `<p style="font-family:'Inter',sans-serif;font-size:12px;color:#6B7280;margin:16px 0 0;padding-top:12px;border-top:1px solid rgba(45,45,45,0.3);line-height:1.6;"><strong>Note:</strong> This list reflects only countries where the CIA World Factbook &mdash; our data source &mdash; explicitly uses the &ldquo;${escapeHtml(religion.name)}&rdquo; label. Adherents in many other countries are rolled into broader buckets such as Protestant, Evangelical, or country-specific denominations, so this ranking undercounts global presence.</p>`
    : '';

  const bodyHtml = `
    <nav aria-label="Breadcrumb" style="padding:8px 16px;font-family:'Inter',sans-serif;font-size:14px;">
      <a href="/">Home</a> / <a href="/religions">Religions</a> / ${escapeHtml(religion.name)}
    </nav>
    <main style="max-width:960px;margin:0 auto;padding:16px;">
      <section style="border:2px solid #2D2D2D;padding:24px;background:#FFF8E7;box-shadow:3px 3px 0 #2D2D2D;">
        <h1 style="font-family:'Press Start 2P',cursive;font-size:16px;margin:0 0 12px;">${escapeHtml(religion.name)}</h1>
        <p style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.7;margin:0;color:#2D2D2D;">${escapeHtml(religion.blurb)}</p>
      </section>

      <section style="margin-top:16px;border:2px solid #2D2D2D;padding:20px;background:#FFF8E7;box-shadow:3px 3px 0 #2D2D2D;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:12px;margin:0;">Countries by ${escapeHtml(religion.name)} Population (${adherents.length})</h2>
        ${listHtml}
        ${noteHtml}
      </section>

      <nav style="margin-top:24px;text-align:center;padding-bottom:32px;">
        <a href="/religions">All Religions</a> &middot; <a href="/flags">All Flags</a> &middot; <a href="/quiz">Flag Quiz</a>
      </nav>
    </main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: religion.name,
    description: religion.tagline,
    about: religion.name,
    url: `${SITE_URL}/religions/${religion.slug}`,
    publisher: { '@type': 'Organization', name: 'Flag Arcade', url: SITE_URL },
  };

  return buildPage(
    {
      title: `${religion.name} - Countries & Beliefs | Flag Arcade`,
      description: `Learn about ${religion.name} and see the flags of the ${adherents.length} countries where it's practiced, ranked by share of population.`,
      canonical: `${SITE_URL}/religions/${religion.slug}`,
      jsonLd,
    },
    bodyHtml,
    assets,
    'ReligionPage',
  );
}

// ---------------------------------------------------------------------------
// Organizations index page
// ---------------------------------------------------------------------------

function generateOrganizationsIndexPage(assets: Assets): string {
  const orgCards = organizations.map((o) => `
    <a href="/organizations/${o.slug}" style="display:block;border:2px solid #2D2D2D;padding:14px;text-decoration:none;background:#FFF8E7;box-shadow:3px 3px 0 #2D2D2D;">
      <div style="font-size:2rem;line-height:1;">${o.emoji}</div>
      <div style="font-family:'Press Start 2P',cursive;font-size:11px;margin-top:8px;">${escapeHtml(o.abbreviation)}</div>
      <div style="font-family:'Inter',sans-serif;font-size:13px;margin-top:4px;color:#2D2D2D;">${escapeHtml(o.name)}</div>
      <div style="font-family:'Inter',sans-serif;font-size:12px;margin-top:6px;color:#6B7280;">${o.members} members &middot; founded ${escapeHtml(o.founded)}</div>
    </a>`).join('\n      ');

  const bodyHtml = `
    <nav aria-label="Breadcrumb" style="padding:8px 16px;font-family:'Inter',sans-serif;font-size:14px;">
      <a href="/">Home</a> / Organizations
    </nav>
    <main style="max-width:960px;margin:0 auto;padding:16px;">
      <h1 style="font-family:'Press Start 2P',cursive;">International Organizations &amp; Their Flags</h1>
      <p style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.6;">
        Browse the flags of ${organizations.length} major international organizations — the United Nations, NATO, the European Union, ASEAN, and more. Each organization page lists its member countries, when it was founded, and where it's headquartered.
      </p>
      <p style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.6;">
        These flags appear regularly in news coverage, diplomatic events, and global summits. Knowing them is a great way to understand world affairs at a glance.
      </p>
      <section style="margin-top:24px;display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:16px;">
      ${orgCards}
      </section>
      <section style="margin-top:32px;text-align:center;padding:24px;background:#FFD93D;border:2px solid #2D2D2D;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Test Your Flag Knowledge</h2>
        <p style="font-family:'Inter',sans-serif;font-size:14px;margin:8px 0 16px;">Recognize country flags from every continent in our quiz.</p>
        <a href="/quiz" style="font-family:'Press Start 2P',cursive;font-size:12px;background:#16A34A;color:white;padding:12px 24px;border:2px solid #2D2D2D;text-decoration:none;display:inline-block;">Play Flag Quiz</a>
      </section>
      <nav style="margin-top:24px;text-align:center;padding-bottom:32px;">
        <a href="/flags">All Flags</a> &middot; <a href="/flags/territories">Territories</a> &middot; <a href="/quiz">Flag Quiz</a>
      </nav>
    </main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'International Organizations and Their Flags',
    description: `Browse flags of ${organizations.length} major international organizations including the UN, NATO, EU, ASEAN, and African Union.`,
    url: `${SITE_URL}/organizations`,
    numberOfItems: organizations.length,
    publisher: { '@type': 'Organization', name: 'Flag Arcade', url: SITE_URL },
  };

  return buildPage(
    {
      title: `International Organization Flags - UN, NATO, EU & ${organizations.length - 3} More | Flag Arcade`,
      description: `Explore flags of ${organizations.length} international organizations — UN, NATO, EU, ASEAN, African Union, and more. See member countries, founding year, and headquarters for each.`,
      canonical: `${SITE_URL}/organizations`,
      jsonLd,
    },
    bodyHtml,
    assets,
    'OrganizationsPage',
  );
}

// ---------------------------------------------------------------------------
// Individual organization page
// ---------------------------------------------------------------------------

function generateOrganizationPage(org: typeof organizations[number], assets: Assets): string {
  const memberCodes = organizationMembers[org.slug] || [];
  const memberCountries = memberCodes
    .map((code) => countries.find((c) => c.code === code))
    .filter((c): c is Country => Boolean(c));

  const memberLinks = memberCountries.map((c) =>
    `<a href="/flags/${slugify(c.name)}" style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid #2D2D2D;text-decoration:none;font-size:13px;font-family:'Inter',sans-serif;background:#FFF8E7;">${getFlagEmoji(c.code)} ${escapeHtml(c.name)}</a>`
  ).join('\n        ');

  const otherOrgs = organizations.filter((o) => o.slug !== org.slug).slice(0, 8).map((o) =>
    `<a href="/organizations/${o.slug}" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid #2D2D2D;text-decoration:none;font-size:13px;font-family:'Inter',sans-serif;">${o.emoji} ${escapeHtml(o.abbreviation)}</a>`
  ).join(' ');

  const bodyHtml = `
    <nav aria-label="Breadcrumb" style="padding:8px 16px;font-family:'Inter',sans-serif;font-size:14px;">
      <a href="/">Home</a> / <a href="/organizations">Organizations</a> / ${escapeHtml(org.name)}
    </nav>
    <main style="max-width:960px;margin:0 auto;padding:16px;">
      <div style="text-align:center;font-size:6rem;line-height:1;">${org.emoji}</div>
      <h1 style="font-family:'Press Start 2P',cursive;text-align:center;margin:16px 0;">${escapeHtml(org.name)} (${escapeHtml(org.abbreviation)})</h1>
      <p style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.7;max-width:720px;margin:0 auto 24px;">${escapeHtml(org.description)}</p>

      <section style="margin-top:24px;display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px;font-family:'Inter',sans-serif;font-size:14px;">
        <div style="border:1px solid #2D2D2D;padding:12px;background:#FFF8E7;"><strong>Founded</strong><br>${escapeHtml(org.founded)}</div>
        <div style="border:1px solid #2D2D2D;padding:12px;background:#FFF8E7;"><strong>Headquarters</strong><br>${escapeHtml(org.headquarters)}</div>
        <div style="border:1px solid #2D2D2D;padding:12px;background:#FFF8E7;"><strong>Members</strong><br>${org.members}</div>
        <div style="border:1px solid #2D2D2D;padding:12px;background:#FFF8E7;"><strong>Website</strong><br>${escapeHtml(org.website)}</div>
      </section>

      ${memberCountries.length > 0 ? `
      <section style="margin-top:32px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Member Country Flags (${memberCountries.length})</h2>
        <p style="font-family:'Inter',sans-serif;font-size:14px;color:#6B7280;">Click any flag to learn about that country.</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;">
        ${memberLinks}
        </div>
      </section>` : ''}

      <section style="margin-top:32px;text-align:center;padding:24px;background:#FFD93D;border:2px solid #2D2D2D;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Can You Identify Every ${escapeHtml(org.abbreviation)} Member?</h2>
        <p style="font-family:'Inter',sans-serif;font-size:14px;margin:8px 0 16px;">Test yourself in our flag quiz.</p>
        <a href="/quiz" style="font-family:'Press Start 2P',cursive;font-size:12px;background:#16A34A;color:white;padding:12px 24px;border:2px solid #2D2D2D;text-decoration:none;display:inline-block;">Play Flag Quiz</a>
      </section>

      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:12px;">Other Organizations</h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">${otherOrgs}</div>
      </section>

      <nav style="margin-top:24px;text-align:center;padding-bottom:32px;">
        <a href="/organizations">All Organizations</a> &middot; <a href="/flags">All Flags</a> &middot; <a href="/quiz">Flag Quiz</a>
      </nav>
    </main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    alternateName: org.abbreviation,
    description: org.description,
    foundingDate: org.founded,
    url: `${SITE_URL}/organizations/${org.slug}`,
    sameAs: [`https://${org.website}`],
  };

  return buildPage(
    {
      title: `${org.name} (${org.abbreviation}) Flag - ${org.members} Member Countries | Flag Arcade`,
      description: `Learn about the ${org.name} flag, its ${org.members} member countries, founding history (${org.founded}), and headquarters in ${org.headquarters}.`,
      canonical: `${SITE_URL}/organizations/${org.slug}`,
      jsonLd,
    },
    bodyHtml,
    assets,
    'OrganizationPage',
  );
}

// ---------------------------------------------------------------------------
// Territories index page
// ---------------------------------------------------------------------------

function generateTerritoriesIndexPage(assets: Assets): string {
  // Group by sovereign
  const groups = new Map<string, typeof territories>();
  for (const t of territories) {
    const key = t.sovereignName;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  const sortedGroups = [...groups.entries()].sort((a, b) => {
    if (a[0] === 'None') return 1;
    if (b[0] === 'None') return -1;
    return a[0].localeCompare(b[0]);
  });

  const groupsHtml = sortedGroups.map(([sovereign, list]) => {
    const links = list.map((t) =>
      `<a href="/flags/territories/${slugify(t.name)}" style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid #2D2D2D;text-decoration:none;font-size:13px;font-family:'Inter',sans-serif;background:#FFF8E7;">${getFlagEmoji(t.code)} ${escapeHtml(t.name)}</a>`
    ).join('\n        ');
    return `
      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:13px;">${escapeHtml(sovereign === 'None' ? 'Other / Disputed' : sovereign)} (${list.length})</h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
        ${links}
        </div>
      </section>`;
  }).join('\n');

  const bodyHtml = `
    <nav aria-label="Breadcrumb" style="padding:8px 16px;font-family:'Inter',sans-serif;font-size:14px;">
      <a href="/">Home</a> / <a href="/flags">Flags</a> / Territories
    </nav>
    <main style="max-width:960px;margin:0 auto;padding:16px;">
      <h1 style="font-family:'Press Start 2P',cursive;">Flags of Dependent Territories</h1>
      <p style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.7;">
        Beyond the world's ${countries.length} sovereign countries, there are ${territories.length} dependent territories with their own distinct flags — places like Puerto Rico, Hong Kong, Greenland, and French Polynesia. Each is associated with a parent country but maintains its own flag, government, and cultural identity.
      </p>
      <p style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.7;">
        Browse them grouped by their sovereign nation below.
      </p>
      ${groupsHtml}
      <section style="margin-top:32px;text-align:center;padding:24px;background:#FFD93D;border:2px solid #2D2D2D;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Master the World's Flags</h2>
        <p style="font-family:'Inter',sans-serif;font-size:14px;margin:8px 0 16px;">Test your knowledge in the Flag Arcade quiz.</p>
        <a href="/quiz" style="font-family:'Press Start 2P',cursive;font-size:12px;background:#16A34A;color:white;padding:12px 24px;border:2px solid #2D2D2D;text-decoration:none;display:inline-block;">Play Flag Quiz</a>
      </section>
      <nav style="margin-top:24px;text-align:center;padding-bottom:32px;">
        <a href="/flags">All Country Flags</a> &middot; <a href="/organizations">Organizations</a> &middot; <a href="/quiz">Flag Quiz</a>
      </nav>
    </main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Flags of Dependent Territories',
    description: `Browse flags of ${territories.length} dependent territories around the world.`,
    url: `${SITE_URL}/flags/territories`,
    numberOfItems: territories.length,
    publisher: { '@type': 'Organization', name: 'Flag Arcade', url: SITE_URL },
  };

  return buildPage(
    {
      title: `Dependent Territory Flags - All ${territories.length} Territories | Flag Arcade`,
      description: `Explore flags of ${territories.length} dependent territories — Puerto Rico, Hong Kong, Greenland, French Polynesia, Bermuda, and more. Grouped by sovereign nation.`,
      canonical: `${SITE_URL}/flags/territories`,
      jsonLd,
    },
    bodyHtml,
    assets,
    'TerritoriesPage',
  );
}

// ---------------------------------------------------------------------------
// Individual territory page
// ---------------------------------------------------------------------------

function generateTerritoryPage(territory: typeof territories[number], assets: Assets): string {
  const slug = slugify(territory.name);
  const emoji = getFlagEmoji(territory.code);
  const sovereignCountry = countries.find((c) => c.code === territory.sovereignCode);
  const sovereignSlug = sovereignCountry ? slugify(sovereignCountry.name) : null;
  const siblings = territories.filter((t) => t.sovereignCode === territory.sovereignCode && t.code !== territory.code);
  const continentSlug = slugify(territory.continent);

  const features = flagFeatures[territory.code];
  const desc = flagDescriptions[territory.code];

  // Unified pool: countries + territories for similar flags
  const allCodes = [...countries.map((c) => c.code), ...territories.map((t) => t.code)];
  const similar = features ? getSimilarFlags(territory.code, allCodes) : [];

  type PeerEntry = { code: string; name: string; href: string; isTerritory: boolean };
  const resolveEntry = (code: string): PeerEntry | null => {
    const c = countries.find((x) => x.code === code);
    if (c) return { code, name: c.name, href: `/flags/${slugify(c.name)}`, isTerritory: false };
    const t = territories.find((x) => x.code === code);
    if (t) return { code, name: t.name, href: `/flags/territories/${slugify(t.name)}`, isTerritory: true };
    return null;
  };

  const similarEntries = similar.slice(0, 5)
    .map(resolveEntry)
    .filter((e): e is PeerEntry => e !== null);

  // Mixed continent peers (countries + territories)
  const continentPeers: PeerEntry[] = [];
  for (const c of countries) {
    if (c.continent === territory.continent && c.code !== territory.code) {
      continentPeers.push({ code: c.code, name: c.name, href: `/flags/${slugify(c.name)}`, isTerritory: false });
    }
  }
  for (const t of territories) {
    if (t.continent === territory.continent && t.code !== territory.code) {
      continentPeers.push({ code: t.code, name: t.name, href: `/flags/territories/${slugify(t.name)}`, isTerritory: true });
    }
  }

  const siblingLinks = siblings.map((t) =>
    `<a href="/flags/territories/${slugify(t.name)}" style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid #2D2D2D;text-decoration:none;font-size:13px;font-family:'Inter',sans-serif;background:#FFF8E7;">${getFlagEmoji(t.code)} ${escapeHtml(t.name)}</a>`
  ).join('\n        ');

  const fallbackDescription = territory.sovereignName === 'None'
    ? `${territory.name} is a territory in ${territory.continent} with its own distinct flag.`
    : `${territory.name} is a dependent territory of ${territory.sovereignName} located in ${territory.continent}. It has its own distinct flag and governance.`;
  const descriptionText = desc?.description || fallbackDescription;
  const pageDescription = desc?.description
    || `Learn about the flag of ${territory.name}, a dependent territory of ${territory.sovereignName} located in ${territory.continent}.`;

  const facts = countryFacts[territory.code];
  const flagFilename = `flag-${slug}.svg`;
  const quickFactsHtml = facts ? buildQuickFactsHtml(facts, desc?.adopted) : '';
  const flagActionsHtml = buildFlagActionsHtml(emoji, flagFilename, territory.name);
  const borderingHtml = facts?.borders?.length ? buildBorderingCountriesHtml(facts.borders) : '';

  let bodyHtml = `
    <nav aria-label="Breadcrumb" style="padding:8px 16px;font-family:'Inter',sans-serif;font-size:14px;">
      <a href="/">Home</a> / <a href="/flags">Flags</a> / <a href="/flags/territories">Territories</a> / ${escapeHtml(territory.name)}
    </nav>
    <main style="max-width:768px;margin:0 auto;padding:16px;">
      <div style="text-align:center;font-size:8rem;line-height:1;">${emoji}</div>
      <h1 style="font-family:'Press Start 2P',cursive;text-align:center;margin:16px 0;">Flag of ${escapeHtml(territory.name)}</h1>
      <p style="text-align:center;font-family:'Inter',sans-serif;font-size:14px;color:#6B7280;">${escapeHtml(territory.continent)}</p>
      ${flagActionsHtml}
      ${quickFactsHtml}

      ${sovereignCountry && sovereignSlug ? `
      <section style="margin-top:24px;background:#FFF8E7;border:2px solid #2D2D2D;padding:20px;">
        <p style="font-family:'Space Mono',monospace;font-size:14px;line-height:1.6;margin:0 0 16px 0;text-align:center;">
          <strong>${escapeHtml(territory.name)}</strong> is a dependent territory of <strong>${escapeHtml(territory.sovereignName)}</strong>.
        </p>
        <div style="display:flex;align-items:center;justify-content:center;gap:20px;">
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;">
            <span style="font-size:3.5rem;line-height:1;">${emoji}</span>
            <span style="font-family:'Space Mono',monospace;font-size:12px;text-align:center;">${escapeHtml(territory.name)}</span>
            <span style="font-family:'Space Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;">Territory</span>
          </div>
          <div style="font-family:'Press Start 2P',cursive;font-size:56px;line-height:1;color:#6B7280;flex-shrink:0;margin-top:-20px;" aria-hidden="true">&rarr;</div>
          <a href="/flags/${sovereignSlug}" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;text-decoration:none;">
            <span style="font-size:3.5rem;line-height:1;">${getFlagEmoji(sovereignCountry.code)}</span>
            <span style="font-family:'Space Mono',monospace;font-size:12px;text-align:center;color:#2D2D2D;">${escapeHtml(sovereignCountry.name)}</span>
            <span style="font-family:'Space Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;">Sovereign</span>
          </a>
        </div>
      </section>` : ''}

      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">About This Flag</h2>
        ${splitIntoParagraphs(descriptionText)
          .map(
            (para) =>
              `<p style="font-family:'Space Mono',monospace;font-size:14px;line-height:1.6;margin:0 0 12px 0;">${escapeHtml(para)}</p>`,
          )
          .join('\n        ')}
        ${
          desc?.meaning
            ? `<div style="margin-top:16px;border-left:4px solid #3B82F6;background:rgba(255,217,61,0.2);padding:16px;">
          <h3 style="font-family:'Press Start 2P',cursive;font-size:11px;margin:0 0 8px 0;">What the colors & design mean</h3>
          <p style="font-family:'Space Mono',monospace;font-size:13px;line-height:1.6;margin:0;">${escapeHtml(desc.meaning)}</p>
        </div>`
            : ''
        }
        ${
          features
            ? (() => {
                const colorChips = features.colors
                  .map(
                    (c) =>
                      `<span style="display:inline-flex;align-items:center;gap:4px;border:1px solid #2D2D2D;padding:2px 8px;font-size:13px;font-family:'Space Mono',monospace;">
            <span style="display:inline-block;width:16px;height:16px;background:${colorHex[c] || '#ccc'};border:1px solid #2D2D2D;"></span> ${c}
          </span>`,
                  )
                  .join(' ');
                const patternLabelStr = features.patterns.map((p) => patternLabels[p] || p).join(', ');
                return `<div style="margin-top:16px;">
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;">${colorChips}</div>
          <p style="font-family:'Space Mono',monospace;font-size:13px;margin:0;"><strong>Pattern:</strong> ${patternLabelStr}</p>
        </div>`;
              })()
            : ''
        }
      </section>
      ${borderingHtml}`;

  if (desc?.funFacts && desc.funFacts.length > 0) {
    bodyHtml += `
      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Fun Facts</h2>
        <ul style="font-family:'Space Mono',monospace;font-size:14px;line-height:1.6;padding-left:20px;">
          ${desc.funFacts.map((f) => `<li>${escapeHtml(f)}</li>`).join('\n          ')}
        </ul>
      </section>`;
  }

  if (similarEntries.length > 0) {
    const similarLinks = similarEntries.map((e) =>
      `<a href="${e.href}" style="text-decoration:none;">${getFlagEmoji(e.code)} ${escapeHtml(e.name)}${e.isTerritory ? ' <span style="color:#6B7280;font-size:10px;text-transform:uppercase;">· Territory</span>' : ''}</a>`
    ).join('\n          ');
    bodyHtml += `
      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Similar looking flags</h2>
        <p style="font-family:'Space Mono',monospace;font-size:13px;">These flags share similar colors and patterns:</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
          ${similarLinks}
        </div>
      </section>`;
  }

  if (siblings.length > 0) {
    bodyHtml += `
      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Other ${escapeHtml(territory.sovereignName)} Territories</h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
        ${siblingLinks}
        </div>
      </section>`;
  }

  if (continentPeers.length > 0) {
    const peerLinks = continentPeers.slice(0, 8).map((e) =>
      `<a href="${e.href}" style="text-decoration:none;">${getFlagEmoji(e.code)} ${escapeHtml(e.name)}${e.isTerritory ? ' <span style="color:#6B7280;font-size:10px;text-transform:uppercase;">(Territory)</span>' : ''}</a>`
    ).join(' &middot; ');
    bodyHtml += `
      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">More ${escapeHtml(territory.continent)} Flags</h2>
        <p style="font-family:'Space Mono',monospace;font-size:13px;line-height:2;">${peerLinks}</p>
        <p><a href="/flags/continent/${continentSlug}">View all ${escapeHtml(territory.continent)} flags &rarr;</a></p>
      </section>`;
  }

  bodyHtml += `
      <section style="margin-top:32px;text-align:center;padding:24px;background:#FFD93D;border:2px solid #2D2D2D;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Test Your Knowledge!</h2>
        <p style="font-family:'Inter',sans-serif;font-size:14px;margin:8px 0 16px;">Identify country flags in our quiz.</p>
        <a href="/quiz" style="font-family:'Press Start 2P',cursive;font-size:12px;background:#16A34A;color:white;padding:12px 24px;border:2px solid #2D2D2D;text-decoration:none;display:inline-block;">Play Flag Quiz</a>
      </section>

      <nav style="margin-top:24px;text-align:center;padding-bottom:32px;">
        <a href="/flags/territories">All Territories</a> &middot; <a href="/flags">All Flags</a>
      </nav>
    </main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    name: `Flag of ${territory.name}`,
    description: pageDescription,
    url: `${SITE_URL}/flags/territories/${slug}`,
    publisher: { '@type': 'Organization', name: 'Flag Arcade', url: SITE_URL },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Flags', item: `${SITE_URL}/flags` },
        { '@type': 'ListItem', position: 3, name: 'Territories', item: `${SITE_URL}/flags/territories` },
        { '@type': 'ListItem', position: 4, name: territory.name },
      ],
    },
  };

  return buildPage(
    {
      title: `Flag of ${territory.name} - ${territory.sovereignName} Territory | Flag Arcade`,
      description: pageDescription,
      canonical: `${SITE_URL}/flags/territories/${slug}`,
      jsonLd,
      flagData: {
        code: territory.code,
        ...(desc ? { description: desc } : {}),
        ...(facts ? { facts } : {}),
      },
    },
    bodyHtml,
    assets,
    'TerritoryFlagPage',
  );
}

// ---------------------------------------------------------------------------
// Emoji flags page
// ---------------------------------------------------------------------------

function generateEmojiFlagsPage(assets: Assets): string {
  const grid = countries.map((c) =>
    `<a href="/flags/${slugify(c.name)}" title="${escapeHtml(c.name)}" style="display:inline-flex;flex-direction:column;align-items:center;gap:4px;padding:8px;border:1px solid #2D2D2D;text-decoration:none;background:#FFF8E7;font-family:'Inter',sans-serif;font-size:11px;color:#2D2D2D;width:80px;text-align:center;">
      <span style="font-size:1.6rem;line-height:1;">${getFlagEmoji(c.code)}</span>
      <span>${c.code}</span>
    </a>`
  ).join('\n      ');

  const bodyHtml = `
    <nav aria-label="Breadcrumb" style="padding:8px 16px;font-family:'Inter',sans-serif;font-size:14px;">
      <a href="/">Home</a> / <a href="/flags">Flags</a> / Emoji Flags
    </nav>
    <main style="max-width:960px;margin:0 auto;padding:16px;">
      <h1 style="font-family:'Press Start 2P',cursive;">Country Flag Emojis - All ${countries.length} Flags</h1>
      <p style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.7;">
        Every country flag rendered as a Unicode emoji. Each flag emoji is built from two regional indicator characters that map to a country's ISO 3166-1 alpha-2 code (for example, 🇺🇸 = US, 🇯🇵 = JP).
      </p>
      <p style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.7;">
        Click any flag to learn about that country's flag colors, meaning, and history. Codes shown below each flag are the ISO codes you'd use in URLs, software, or shipping forms.
      </p>
      <section style="margin-top:24px;display:flex;flex-wrap:wrap;gap:8px;">
      ${grid}
      </section>
      <section style="margin-top:32px;text-align:center;padding:24px;background:#FFD93D;border:2px solid #2D2D2D;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">How Many Can You Name?</h2>
        <p style="font-family:'Inter',sans-serif;font-size:14px;margin:8px 0 16px;">Take the flag quiz and find out.</p>
        <a href="/quiz" style="font-family:'Press Start 2P',cursive;font-size:12px;background:#16A34A;color:white;padding:12px 24px;border:2px solid #2D2D2D;text-decoration:none;display:inline-block;">Play Flag Quiz</a>
      </section>
      <nav style="margin-top:24px;text-align:center;padding-bottom:32px;">
        <a href="/flags">All Country Flags</a> &middot; <a href="/flags/territories">Territories</a> &middot; <a href="/organizations">Organizations</a>
      </nav>
    </main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Country Flag Emojis',
    description: `All ${countries.length} country flag emojis with ISO 3166-1 codes.`,
    url: `${SITE_URL}/flags/emoji`,
    numberOfItems: countries.length,
    publisher: { '@type': 'Organization', name: 'Flag Arcade', url: SITE_URL },
  };

  return buildPage(
    {
      title: `Flag Emojis - All ${countries.length} Country Flag Emojis | Flag Arcade`,
      description: `Every country flag as a Unicode emoji. Browse all ${countries.length} flag emojis with their ISO country codes. Click any flag for full details.`,
      canonical: `${SITE_URL}/flags/emoji`,
      jsonLd,
    },
    bodyHtml,
    assets,
    'EmojiFlagsPage',
  );
}

// ---------------------------------------------------------------------------
// About page
// ---------------------------------------------------------------------------

function generateAboutPage(assets: Assets): string {
  const bodyHtml = `
    <nav aria-label="Breadcrumb" style="padding:8px 16px;font-family:'Inter',sans-serif;font-size:14px;">
      <a href="/">Home</a> / About
    </nav>
    <main style="max-width:720px;margin:0 auto;padding:16px;">
      <h1 style="font-family:'Press Start 2P',cursive;">About Flag Arcade</h1>
      <p style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.7;">
        Flag Arcade is a free, retro-styled site for learning the world's flags. We cover all ${countries.length} sovereign country flags, ${territories.length} dependent territory flags, and ${organizations.length} international organization flags — with quizzes, game modes, and reference pages for each one.
      </p>
      <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;margin-top:24px;">What you'll find here</h2>
      <ul style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.8;">
        <li><a href="/flags">Country flag pages</a> with colors, meaning, history, and fun facts</li>
        <li><a href="/quiz">Flag quizzes</a> by continent and difficulty</li>
        <li><a href="/play">Six game modes</a> — Journey, Arcade, Around the World, Jeopardy, Practice, and Flag Runner</li>
        <li><a href="/organizations">Organization flags</a> for the UN, NATO, EU, ASEAN, African Union, and more</li>
        <li><a href="/flags/territories">Territory flags</a> for Puerto Rico, Hong Kong, Greenland, and dozens more</li>
        <li><a href="/flags/emoji">Flag emojis</a> for every country with their ISO codes</li>
      </ul>
      <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;margin-top:24px;">Why flags?</h2>
      <p style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.7;">
        Flags are visual shorthand for an entire nation's history, geography, and values. Recognizing them sharpens your understanding of world events, helps you in trivia and travel, and is a surprisingly addictive way to learn geography.
      </p>
      <p style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.7;">
        Built with care by the team at <a href="https://uxcabin.com" rel="noopener noreferrer">UX Cabin</a>.
      </p>
      <nav style="margin-top:32px;text-align:center;padding-bottom:32px;">
        <a href="/">Home</a> &middot; <a href="/flags">Browse Flags</a> &middot; <a href="/quiz">Quiz</a> &middot; <a href="/play">Play</a>
      </nav>
    </main>`;

  return buildPage(
    {
      title: `About Flag Arcade - Free Flag Quiz & Reference Site`,
      description: `Flag Arcade is a free, retro-styled site for learning every world flag — ${countries.length} country flags, ${territories.length} territory flags, and ${organizations.length} international organization flags, plus six quiz game modes.`,
      canonical: `${SITE_URL}/about`,
    },
    bodyHtml,
    assets,
    'AboutPage',
  );
}

// ---------------------------------------------------------------------------
// Embed page (teacher / classroom distribution)
// ---------------------------------------------------------------------------

function generateEmbedPage(assets: Assets): string {
  const embedUrl = `${SITE_URL}/embed/arcade`;
  const responsiveSnippet = `&lt;div style=&quot;position:relative;width:100%;max-width:720px;aspect-ratio:3/4;margin:0 auto;&quot;&gt;
  &lt;iframe
    src=&quot;${embedUrl}&quot;
    title=&quot;Flag Arcade quiz&quot;
    loading=&quot;lazy&quot;
    allow=&quot;autoplay&quot;
    style=&quot;position:absolute;inset:0;width:100%;height:100%;border:0;&quot;
  &gt;&lt;/iframe&gt;
&lt;/div&gt;`;
  const fixedSnippet = `&lt;iframe
  src=&quot;${embedUrl}&quot;
  title=&quot;Flag Arcade quiz&quot;
  width=&quot;600&quot;
  height=&quot;800&quot;
  loading=&quot;lazy&quot;
  allow=&quot;autoplay&quot;
  style=&quot;border:0;&quot;
&gt;&lt;/iframe&gt;`;

  const bodyHtml = `
    <nav aria-label="Breadcrumb" style="padding:8px 16px;font-family:'Inter',sans-serif;font-size:14px;">
      <a href="/">Home</a> / Embed
    </nav>
    <main style="max-width:720px;margin:0 auto;padding:16px;">
      <h1 style="font-family:'Press Start 2P',cursive;">Embed Flag Arcade</h1>
      <p style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.7;">
        Add a free flag-guessing quiz to your classroom site, blog, or LMS. No accounts required — copy the iframe snippet and paste it where you want the game to appear.
      </p>
      <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;margin-top:24px;">Responsive snippet</h2>
      <p style="font-family:'Inter',sans-serif;font-size:14px;color:#6B7280;">Fills the width of its container. Best for blog posts and LMS pages.</p>
      <pre style="background:#f4f4f4;border:1px solid #ddd;padding:12px;overflow-x:auto;font-size:12px;line-height:1.5;">${responsiveSnippet}</pre>
      <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;margin-top:24px;">Fixed size (600 × 800)</h2>
      <p style="font-family:'Inter',sans-serif;font-size:14px;color:#6B7280;">Works in Google Sites, Notion embeds, and other tools that ask for width and height.</p>
      <pre style="background:#f4f4f4;border:1px solid #ddd;padding:12px;overflow-x:auto;font-size:12px;line-height:1.5;">${fixedSnippet}</pre>
      <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;margin-top:24px;">Where it works</h2>
      <ul style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.8;">
        <li>Google Sites, Notion, WordPress, Wix, Squarespace, Webflow</li>
        <li>Canvas, Schoology, Blackboard, and other LMS platforms that allow HTML embeds</li>
        <li>Any classroom site or teacher blog that lets you paste an iframe</li>
      </ul>
      <p style="font-family:'Inter',sans-serif;font-size:14px;color:#6B7280;">
        Google Classroom and Classwork.com don't accept raw iframe HTML inside assignments, but you can paste <a href="${embedUrl}">${embedUrl}</a> as a "View material" link and students will open the quiz in a new tab.
      </p>
      <p style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.7;margin-top:24px;">
        <a href="/play/modes">Try all six game modes →</a>
      </p>
      <nav style="margin-top:32px;text-align:center;padding-bottom:32px;">
        <a href="/">Home</a> &middot; <a href="/flags">Browse Flags</a> &middot; <a href="/quiz">Quiz</a> &middot; <a href="/about">About</a>
      </nav>
    </main>`;

  return buildPage(
    {
      title: `Embed the Flag Quiz on Your Site - Free for Teachers | Flag Arcade`,
      description: `Drop a free flag-guessing quiz into your classroom site, blog, or LMS. Works inside Google Sites, Canvas, Notion, and any platform that allows iframes. No signup required.`,
      canonical: `${SITE_URL}/embed`,
    },
    bodyHtml,
    assets,
    'EmbedPage',
  );
}

// Minimal shell for the iframed arcade. Vercel needs a static file at this
// path or it returns 404 for nested paths under /embed/. The SPA hydrates
// over this body and renders the real <EmbedArcadeRoute>.
function generateEmbedArcadePage(assets: Assets): string {
  return buildPage(
    {
      title: `Flag Arcade — Embedded Quiz`,
      description: `An embedded flag-guessing quiz from flagarcade.com.`,
      canonical: `${SITE_URL}/embed/arcade`,
      noindex: true,
    },
    `<div style="background:#38BDF8;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif;color:#2D2D2D;">Loading…</div>`,
    assets,
    'EmbedArcadeRoute',
  );
}

// ---------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------

function generateSitemap(urls: { loc: string; priority: string; changefreq?: string }[]): string {
  const lastmod = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const entries = urls.map(({ loc, priority, changefreq = 'weekly' }) =>
    `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function writeFile(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

// Inject a modulepreload hint for the HomePage chunk into the SPA shell HTML
// (dist/index.html). HomePage is lazy-loaded so it doesn't bloat the main
// bundle on /flags/* visits, but visitors landing on `/` shouldn't pay an
// extra round-trip for it.
function injectHomePagePreload() {
  const shellPath = path.join(DIST, 'index.html');
  const homePageChunk = findChunk('HomePage');
  if (!homePageChunk) return;
  let html = fs.readFileSync(shellPath, 'utf-8');
  const tag = `<link rel="modulepreload" crossorigin href="${homePageChunk}">`;
  if (html.includes(tag)) return;
  // Insert alongside Vite's existing modulepreload tags (or before </head>).
  html = html.includes('rel="modulepreload"')
    ? html.replace(/(<link rel="modulepreload"[^>]*>)/, `$1\n    ${tag}`)
    : html.replace('</head>', `    ${tag}\n  </head>`);
  fs.writeFileSync(shellPath, html, 'utf-8');
  console.log(`  Injected HomePage modulepreload into SPA shell: ${homePageChunk}`);
}

function main() {
  console.log('Generating SEO pages...');

  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('Error: dist/index.html not found. Run `vite build` first.');
    process.exit(1);
  }

  // Read assets BEFORE injecting the HomePage preload so SEO pages (which
  // don't render HomePage) don't end up preloading it unnecessarily.
  const assets = getAssets();
  console.log(`Found assets: ${assets.css.length} CSS, ${assets.js.length} JS`);

  injectHomePagePreload();

  const sitemapUrls: { loc: string; priority: string; changefreq?: string }[] = [];

  // Homepage
  sitemapUrls.push({ loc: SITE_URL, priority: '1.0', changefreq: 'daily' });

  // Play / game modes — client-side only, no pre-rendered HTML, but listed so
  // crawlers can discover them. Vercel's SPA rewrite serves index.html and
  // each route injects its own canonical/title/description via SEOHead.
  const playRoutes: { path: string; priority: string }[] = [
    { path: '/play/modes', priority: '0.7' },
    { path: '/play/journey', priority: '0.7' },
    { path: '/play/arcade', priority: '0.7' },
    { path: '/play/around-the-world', priority: '0.6' },
    { path: '/play/jeopardy', priority: '0.6' },
    { path: '/play/presentation', priority: '0.6' },
    { path: '/play/flag-runner', priority: '0.6' },
    { path: '/play/achievements', priority: '0.4' },
    { path: '/play/characters', priority: '0.4' },
  ];
  for (const { path: p, priority } of playRoutes) {
    sitemapUrls.push({ loc: `${SITE_URL}${p}`, priority });
  }
  console.log(`  ${playRoutes.length} /play routes added to sitemap`);

  // Flags directory
  writeFile(path.join(DIST, 'flags', 'index.html'), generateDirectoryPage(assets));
  sitemapUrls.push({ loc: `${SITE_URL}/flags`, priority: '0.9' });
  console.log('  /flags');

  // Quiz landing
  writeFile(path.join(DIST, 'quiz', 'index.html'), generateQuizPage(assets));
  sitemapUrls.push({ loc: `${SITE_URL}/quiz`, priority: '0.9' });
  console.log('  /quiz');

  // Continent pages (flags + quiz)
  for (const continent of continents) {
    const slug = slugify(continent);
    writeFile(path.join(DIST, 'flags', 'continent', slug, 'index.html'), generateContinentPage(continent, assets));
    sitemapUrls.push({ loc: `${SITE_URL}/flags/continent/${slug}`, priority: '0.8' });

    writeFile(path.join(DIST, 'quiz', slug, 'index.html'), generateContinentQuizStaticPage(continent, assets));
    sitemapUrls.push({ loc: `${SITE_URL}/quiz/${slug}`, priority: '0.7' });
    console.log(`  /flags/continent/${slug} + /quiz/${slug}`);
  }

  // Country pages
  for (const country of countries) {
    const slug = slugify(country.name);
    writeFile(path.join(DIST, 'flags', slug, 'index.html'), generateCountryPage(country, assets));
    sitemapUrls.push({ loc: `${SITE_URL}/flags/${slug}`, priority: '0.8' });
  }
  console.log(`  ${countries.length} country pages`);

  // Long-tail content pages
  const contentPages = getContentPages();
  for (const page of contentPages) {
    const generated = generateContentPage(page, assets);
    writeFile(path.join(DIST, 'flags', page.slug, 'index.html'), generated);
    sitemapUrls.push({ loc: `${SITE_URL}/flags/${page.slug}`, priority: '0.6' });
  }
  console.log(`  ${contentPages.length} content pages`);

  // Patterns landing page
  writeFile(path.join(DIST, 'patterns', 'index.html'), generatePatternsIndexPage(assets));
  sitemapUrls.push({ loc: `${SITE_URL}/patterns`, priority: '0.8' });
  console.log('  /patterns');

  // Organizations
  writeFile(path.join(DIST, 'organizations', 'index.html'), generateOrganizationsIndexPage(assets));
  sitemapUrls.push({ loc: `${SITE_URL}/organizations`, priority: '0.8' });
  for (const org of organizations) {
    writeFile(path.join(DIST, 'organizations', org.slug, 'index.html'), generateOrganizationPage(org, assets));
    sitemapUrls.push({ loc: `${SITE_URL}/organizations/${org.slug}`, priority: '0.7' });
  }
  console.log(`  /organizations + ${organizations.length} organization pages`);

  // Territories
  writeFile(path.join(DIST, 'flags', 'territories', 'index.html'), generateTerritoriesIndexPage(assets));
  sitemapUrls.push({ loc: `${SITE_URL}/flags/territories`, priority: '0.8' });
  for (const territory of territories) {
    const slug = slugify(territory.name);
    writeFile(path.join(DIST, 'flags', 'territories', slug, 'index.html'), generateTerritoryPage(territory, assets));
    sitemapUrls.push({ loc: `${SITE_URL}/flags/territories/${slug}`, priority: '0.7' });
  }
  console.log(`  /flags/territories + ${territories.length} territory pages`);

  // Emoji flags
  writeFile(path.join(DIST, 'flags', 'emoji', 'index.html'), generateEmojiFlagsPage(assets));
  sitemapUrls.push({ loc: `${SITE_URL}/flags/emoji`, priority: '0.7' });
  console.log('  /flags/emoji');

  // Religions
  writeFile(path.join(DIST, 'religions', 'index.html'), generateReligionsIndexPage(assets));
  sitemapUrls.push({ loc: `${SITE_URL}/religions`, priority: '0.6' });
  for (const religion of religions) {
    writeFile(path.join(DIST, 'religions', religion.slug, 'index.html'), generateReligionPage(religion, assets));
    sitemapUrls.push({ loc: `${SITE_URL}/religions/${religion.slug}`, priority: '0.6' });
  }
  console.log(`  /religions + ${religions.length} religion pages`);

  // About
  writeFile(path.join(DIST, 'about', 'index.html'), generateAboutPage(assets));
  sitemapUrls.push({ loc: `${SITE_URL}/about`, priority: '0.5' });
  console.log('  /about');

  // Embed (teacher / classroom distribution)
  writeFile(path.join(DIST, 'embed', 'index.html'), generateEmbedPage(assets));
  sitemapUrls.push({ loc: `${SITE_URL}/embed`, priority: '0.6' });
  console.log('  /embed');

  // Embed arcade — static shell so Vercel doesn't 404 on this nested route.
  // Not in sitemap (noindex).
  writeFile(path.join(DIST, 'embed', 'arcade', 'index.html'), generateEmbedArcadePage(assets));
  console.log('  /embed/arcade');

  // Sitemap
  writeFile(path.join(DIST, 'sitemap.xml'), generateSitemap(sitemapUrls));
  console.log('  sitemap.xml');

  // Robots.txt
  writeFile(
    path.join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\n\n# Allow major SEO crawlers\nUser-agent: Screaming Frog SEO Spider\nAllow: /\n\nUser-agent: SemrushBot\nAllow: /\n\nUser-agent: SemrushBot-SA\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  );
  console.log('  robots.txt');

  const totalPages = 1 + 1 + continents.length * 2 + countries.length + contentPages.length;
  const totalSitemapUrls = sitemapUrls.length;
  console.log(`\nDone! Generated ${totalPages} SEO pages + sitemap (${totalSitemapUrls} URLs) + robots.txt`);
}

main();
