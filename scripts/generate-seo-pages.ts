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
import { flagDescriptions, type FlagDescription } from '../src/data/flagDescriptions';
import { organizations } from '../src/data/organizations';
import { organizationMembers } from '../src/data/organizationMembers';
import { territories } from '../src/data/territories';
import { getContinentMapSvg } from '../src/components/seo/ContinentMap';

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

// Extract CSS/JS asset paths from the built index.html
function getAssets(): { css: string[]; js: string[] } {
  const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf-8');
  const css = [...html.matchAll(/href="(\/assets\/[^"]+\.css)"/g)].map((m) => m[1]);
  const js = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
  return { css, js };
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
// HTML template
// ---------------------------------------------------------------------------

interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  jsonLd?: object;
}

function buildPage(meta: PageMeta, bodyHtml: string, assets: { css: string[]; js: string[] }): string {
  const jsonLdTag = meta.jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌍</text></svg>">
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}">
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
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  ${assets.css.map((href) => `<link rel="stylesheet" href="${href}">`).join('\n  ')}
</head>
<body>
  <div id="root">
    ${bodyHtml}
  </div>
  ${assets.js.map((src) => `<script type="module" src="${src}"></script>`).join('\n  ')}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Country flag page
// ---------------------------------------------------------------------------

function generateCountryPage(country: Country, assets: { css: string[]; js: string[] }): string {
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

      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">About This Flag</h2>
        <p style="font-family:'Space Mono',monospace;font-size:14px;line-height:1.6;">${escapeHtml(descriptionText)}</p>
        ${desc?.capitalCity ? `<p style="font-family:'Space Mono',monospace;font-size:13px;"><strong>Capital:</strong> ${escapeHtml(desc.capitalCity)}</p>` : ''}
        ${desc?.adopted ? `<p style="font-family:'Space Mono',monospace;font-size:13px;"><strong>Current flag adopted:</strong> ${escapeHtml(desc.adopted)}</p>` : ''}
      </section>`;

  if (features) {
    const colorChips = features.colors.map((c) =>
      `<span style="display:inline-flex;align-items:center;gap:4px;border:1px solid #2D2D2D;padding:2px 8px;font-size:13px;font-family:'Space Mono',monospace;">
        <span style="display:inline-block;width:16px;height:16px;background:${colorHex[c] || '#ccc'};border:1px solid #2D2D2D;"></span> ${c}
      </span>`
    ).join(' ');

    bodyHtml += `
      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Colors & Design</h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;">${colorChips}</div>
        <p style="font-family:'Space Mono',monospace;font-size:13px;"><strong>Pattern:</strong> ${patternLabels[features.pattern] || features.pattern}</p>
      </section>`;
  }

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
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Similar Flags</h2>
        <p style="font-family:'Space Mono',monospace;font-size:13px;">These flags share similar colors and patterns:</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
          ${similarNames.join('\n          ')}
        </div>
      </section>`;
  }

  // More from continent
  if (continentCountries.length > 0) {
    const links = continentCountries.slice(0, 12).map((c) =>
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
    const patternSlug = patternSlugMap[features.pattern];
    if (patternSlug) {
      categoryLinks.push(`<a href="/flags/${patternSlug}" style="${linkStyle}">${patternLabels[features.pattern]}</a>`);
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
    },
    bodyHtml,
    assets,
  );
}

// ---------------------------------------------------------------------------
// Flags directory page
// ---------------------------------------------------------------------------

function generateDirectoryPage(assets: { css: string[]; js: string[] }): string {
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
  );
}

// ---------------------------------------------------------------------------
// Continent page
// ---------------------------------------------------------------------------

function generateContinentPage(continent: Continent, assets: { css: string[]; js: string[] }): string {
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
  );
}

// ---------------------------------------------------------------------------
// Quiz landing page
// ---------------------------------------------------------------------------

function generateQuizPage(assets: { css: string[]; js: string[] }): string {
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
  );
}

// ---------------------------------------------------------------------------
// Continent quiz page (static HTML for /quiz/{slug})
// ---------------------------------------------------------------------------

function generateContinentQuizStaticPage(continent: Continent, assets: { css: string[]; js: string[] }): string {
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
  getCountries: () => Country[];
}

function generateContentPage(page: ContentPage, assets: { css: string[]; js: string[] }): string {
  const matchedCountries = page.getCountries();

  let bodyHtml = `
    <nav aria-label="Breadcrumb" style="padding:8px 16px;font-family:'Space Mono',monospace;font-size:14px;">
      <a href="/">Home</a> / <a href="/flags">Flags</a> / ${escapeHtml(page.h1)}
    </nav>
    <main style="max-width:960px;margin:0 auto;padding:16px;">
      <h1 style="font-family:'Press Start 2P',cursive;">${escapeHtml(page.h1)}</h1>
      <p style="font-family:'Space Mono',monospace;font-size:14px;line-height:1.6;">${escapeHtml(page.intro)}</p>

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

  const patternPages: ContentPage[] = [
    { pattern: 'horizontal-stripes', label: 'Horizontal Stripes', slug: 'horizontal-stripes' },
    { pattern: 'vertical-stripes', label: 'Vertical Stripes', slug: 'vertical-stripes' },
    { pattern: 'cross', label: 'Crosses', slug: 'with-crosses' },
    { pattern: 'diagonal', label: 'Diagonal Designs', slug: 'diagonal-designs' },
    { pattern: 'canton', label: 'Canton Designs', slug: 'canton-designs' },
  ].map(({ pattern, label, slug }) => ({
    slug,
    title: `Flags with ${label} - ${label} Flag Designs | Flag Arcade`,
    description: `Browse all country flags featuring ${label.toLowerCase()} in their design. Compare flags that share similar patterns.`,
    h1: `Flags with ${label}`,
    intro: `These country flags all use a ${label.toLowerCase()} pattern. Many flags around the world share this design element — can you tell them apart?`,
    getCountries: () => countries.filter((c) => flagFeatures[c.code]?.pattern === pattern),
  }));

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
      slug: 'red-white-and-blue-flags',
      title: 'Red, White, and Blue Flags - Countries with Red White Blue Flags | Flag Arcade',
      description: 'Which countries have red, white, and blue flags? Browse all flags featuring this popular color combination and learn what the colors represent.',
      h1: 'Red, White, and Blue Flags',
      intro: 'Red, white, and blue is one of the most popular color combinations in national flags. These countries all feature this classic trio — but can you tell them apart?',
      getCountries: () => countries.filter((c) => {
        const f = flagFeatures[c.code];
        return f && f.colors.includes('red') && f.colors.includes('white') && f.colors.includes('blue');
      }),
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

  return [...colorPages, ...patternPages, ...specialPages];
}

// ---------------------------------------------------------------------------
// Organizations index page
// ---------------------------------------------------------------------------

function generateOrganizationsIndexPage(assets: { css: string[]; js: string[] }): string {
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
  );
}

// ---------------------------------------------------------------------------
// Individual organization page
// ---------------------------------------------------------------------------

function generateOrganizationPage(org: typeof organizations[number], assets: { css: string[]; js: string[] }): string {
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
  );
}

// ---------------------------------------------------------------------------
// Territories index page
// ---------------------------------------------------------------------------

function generateTerritoriesIndexPage(assets: { css: string[]; js: string[] }): string {
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
  );
}

// ---------------------------------------------------------------------------
// Individual territory page
// ---------------------------------------------------------------------------

function generateTerritoryPage(territory: typeof territories[number], assets: { css: string[]; js: string[] }): string {
  const slug = slugify(territory.name);
  const emoji = getFlagEmoji(territory.code);
  const sovereignCountry = countries.find((c) => c.code === territory.sovereignCode);
  const sovereignSlug = sovereignCountry ? slugify(sovereignCountry.name) : null;
  const siblings = territories.filter((t) => t.sovereignCode === territory.sovereignCode && t.code !== territory.code);

  const siblingLinks = siblings.map((t) =>
    `<a href="/flags/territories/${slugify(t.name)}" style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid #2D2D2D;text-decoration:none;font-size:13px;font-family:'Inter',sans-serif;background:#FFF8E7;">${getFlagEmoji(t.code)} ${escapeHtml(t.name)}</a>`
  ).join('\n        ');

  const description = territory.sovereignName === 'None'
    ? `${territory.name} is a territory in ${territory.continent} with its own distinct flag.`
    : `${territory.name} is a dependent territory of ${territory.sovereignName} located in ${territory.continent}. It has its own distinct flag and governance.`;

  const bodyHtml = `
    <nav aria-label="Breadcrumb" style="padding:8px 16px;font-family:'Inter',sans-serif;font-size:14px;">
      <a href="/">Home</a> / <a href="/flags">Flags</a> / <a href="/flags/territories">Territories</a> / ${escapeHtml(territory.name)}
    </nav>
    <main style="max-width:768px;margin:0 auto;padding:16px;">
      <div style="text-align:center;font-size:8rem;line-height:1;">${emoji}</div>
      <h1 style="font-family:'Press Start 2P',cursive;text-align:center;margin:16px 0;">Flag of ${escapeHtml(territory.name)}</h1>
      <p style="text-align:center;font-family:'Inter',sans-serif;font-size:14px;color:#6B7280;">${escapeHtml(territory.continent)}</p>

      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">About This Flag</h2>
        <p style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.7;">${escapeHtml(description)}</p>
        ${sovereignCountry && sovereignSlug ? `<p style="font-family:'Inter',sans-serif;font-size:15px;line-height:1.7;">Parent country: <a href="/flags/${sovereignSlug}">${getFlagEmoji(sovereignCountry.code)} ${escapeHtml(sovereignCountry.name)}</a></p>` : ''}
      </section>

      ${siblings.length > 0 ? `
      <section style="margin-top:24px;">
        <h2 style="font-family:'Press Start 2P',cursive;font-size:14px;">Other ${escapeHtml(territory.sovereignName)} Territories</h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
        ${siblingLinks}
        </div>
      </section>` : ''}

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
    description,
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
      title: `${territory.name} Flag - Territory of ${territory.sovereignName} | Flag Arcade`,
      description: `Learn about the ${territory.name} flag. ${description}`,
      canonical: `${SITE_URL}/flags/territories/${slug}`,
      jsonLd,
    },
    bodyHtml,
    assets,
  );
}

// ---------------------------------------------------------------------------
// Emoji flags page
// ---------------------------------------------------------------------------

function generateEmojiFlagsPage(assets: { css: string[]; js: string[] }): string {
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
  );
}

// ---------------------------------------------------------------------------
// About page
// ---------------------------------------------------------------------------

function generateAboutPage(assets: { css: string[]; js: string[] }): string {
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
        Built with care by the team at <a href="https://learntoship.ai" rel="noopener noreferrer">LearnToShip.ai</a>.
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

function main() {
  console.log('Generating SEO pages...');

  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('Error: dist/index.html not found. Run `vite build` first.');
    process.exit(1);
  }

  const assets = getAssets();
  console.log(`Found assets: ${assets.css.length} CSS, ${assets.js.length} JS`);

  const sitemapUrls: { loc: string; priority: string; changefreq?: string }[] = [];

  // Homepage
  sitemapUrls.push({ loc: SITE_URL, priority: '1.0', changefreq: 'daily' });

  // Play / game modes
  sitemapUrls.push({ loc: `${SITE_URL}/play/modes`, priority: '0.9', changefreq: 'weekly' });

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

  // About
  writeFile(path.join(DIST, 'about', 'index.html'), generateAboutPage(assets));
  sitemapUrls.push({ loc: `${SITE_URL}/about`, priority: '0.5' });
  console.log('  /about');

  // Sitemap
  writeFile(path.join(DIST, 'sitemap.xml'), generateSitemap(sitemapUrls));
  console.log('  sitemap.xml');

  // Robots.txt
  writeFile(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  console.log('  robots.txt');

  const totalPages = 1 + 1 + continents.length * 2 + countries.length + contentPages.length;
  const totalSitemapUrls = sitemapUrls.length;
  console.log(`\nDone! Generated ${totalPages} SEO pages + sitemap (${totalSitemapUrls} URLs) + robots.txt`);
}

main();
