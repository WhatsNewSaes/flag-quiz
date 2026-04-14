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
  <meta property="og:image" content="${SITE_URL}/og-image.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(meta.title)}">
  <meta name="twitter:description" content="${escapeHtml(meta.description)}">
  <meta name="twitter:image" content="${SITE_URL}/og-image.jpg">
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
      title: `${country.name} Flag - Colors, Meaning & Fun Facts | Flag Arcade`,
      description: pageDescription,
      canonical: `${SITE_URL}/flags/${slug}`,
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
        <a href="/play" style="font-family:'Press Start 2P',cursive;font-size:12px;background:#16A34A;color:white;padding:12px 24px;border:2px solid #2D2D2D;text-decoration:none;display:inline-block;">Play Now</a>
      </section>
      <nav style="margin-top:24px;text-align:center;padding-bottom:32px;">
        <a href="/flags">All Flags</a> &middot; <a href="/quiz">Flag Quiz</a>
      </nav>
    </main>`;

  return buildPage(
    {
      title: `${continent} Flags - All ${cc.length} Country Flags | Flag Arcade`,
      description: `Explore all ${cc.length} flags from ${continent}. Learn the colors, meanings, and history of every ${continent.toLowerCase()} country flag. Test yourself with our flag quiz!`,
      canonical: `${SITE_URL}/flags/continent/${slug}`,
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
    sitemapUrls.push({ loc: `${SITE_URL}/quiz/${slug}`, priority: '0.7' });
    console.log(`  /flags/continent/${slug}`);
  }

  // Country pages
  for (const country of countries) {
    const slug = slugify(country.name);
    writeFile(path.join(DIST, 'flags', slug, 'index.html'), generateCountryPage(country, assets));
    sitemapUrls.push({ loc: `${SITE_URL}/flags/${slug}`, priority: '0.8' });
  }
  console.log(`  ${countries.length} country pages`);

  // Sitemap
  writeFile(path.join(DIST, 'sitemap.xml'), generateSitemap(sitemapUrls));
  console.log('  sitemap.xml');

  // Robots.txt
  writeFile(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  console.log('  robots.txt');

  const totalPages = 1 + 1 + continents.length + countries.length; // directory + quiz + continents + countries
  console.log(`\nDone! Generated ${totalPages} SEO pages + sitemap + robots.txt`);
}

main();
