/**
 * Audit script for flag pattern categorization.
 * Generates an HTML report grouping every flag by its tagged patterns,
 * so you can visually scan for miscategorized flags.
 *
 * Usage: tsx scripts/audit-patterns.ts
 * Output: dist/audit-patterns.html
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { countries } from '../src/data/countries';
import { flagFeatures, type FlagPattern } from '../src/data/flagFeatures';
import { getFlagEmoji } from '../src/utils/flagEmoji';

const DIST = path.resolve(import.meta.dirname, '..', 'dist');
const PATTERNS: FlagPattern[] = [
  'horizontal-stripes',
  'vertical-stripes',
  'diagonal',
  'cross',
  'canton',
  'solid',
  'complex',
];

const buckets: Record<FlagPattern, { code: string; name: string; allPatterns: FlagPattern[] }[]> = {
  'horizontal-stripes': [],
  'vertical-stripes': [],
  'diagonal': [],
  'cross': [],
  'canton': [],
  'solid': [],
  'complex': [],
};

const untagged: { code: string; name: string }[] = [];

for (const country of countries) {
  const f = flagFeatures[country.code];
  if (!f) {
    untagged.push({ code: country.code, name: country.name });
    continue;
  }
  for (const p of f.patterns) {
    buckets[p].push({ code: country.code, name: country.name, allPatterns: f.patterns });
  }
}

function renderBucket(pattern: FlagPattern): string {
  const entries = buckets[pattern]
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
  const cards = entries
    .map((e) => {
      const others = e.allPatterns.filter((p) => p !== pattern);
      const tag = others.length > 0 ? `<span class="multi">+ ${others.join(', ')}</span>` : '';
      return `<div class="card"><span class="emoji">${getFlagEmoji(e.code)}</span><div class="meta"><div class="name">${e.name}</div>${tag}</div></div>`;
    })
    .join('\n');
  return `
    <section>
      <h2>${pattern} <span class="count">(${entries.length})</span></h2>
      <div class="grid">${cards}</div>
    </section>`;
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Flag Pattern Audit</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 24px; background: #fafafa; color: #1f2937; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .summary { color: #6b7280; margin-bottom: 24px; font-size: 14px; }
  section { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 16px; }
  h2 { font-size: 18px; margin: 0 0 12px; text-transform: capitalize; }
  .count { color: #6b7280; font-weight: normal; font-size: 14px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
  .card { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border: 1px solid #f3f4f6; border-radius: 4px; }
  .emoji { font-size: 32px; line-height: 1; flex-shrink: 0; }
  .meta { min-width: 0; flex: 1; }
  .name { font-size: 13px; }
  .multi { display: inline-block; font-size: 11px; background: #fef3c7; color: #92400e; padding: 1px 6px; border-radius: 3px; margin-top: 2px; }
  nav { margin-bottom: 16px; }
  nav a { display: inline-block; margin-right: 12px; font-size: 13px; color: #2563eb; text-decoration: none; }
  nav a:hover { text-decoration: underline; }
</style>
</head>
<body>
  <h1>Flag Pattern Audit</h1>
  <p class="summary">
    ${countries.length} flags &middot; ${untagged.length} untagged &middot;
    Yellow tag = flag has additional patterns beyond this section.
  </p>
  <nav>
    ${PATTERNS.map((p) => `<a href="#${p}">${p} (${buckets[p].length})</a>`).join('')}
  </nav>
  ${PATTERNS.map((p) => `<a id="${p}"></a>${renderBucket(p)}`).join('')}
  ${
    untagged.length > 0
      ? `<section><h2>Untagged <span class="count">(${untagged.length})</span></h2><ul>${untagged.map((u) => `<li>${u.name} (${u.code})</li>`).join('')}</ul></section>`
      : ''
  }
</body>
</html>`;

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
const outPath = path.join(DIST, 'audit-patterns.html');
fs.writeFileSync(outPath, html);
console.log(`Wrote ${outPath}`);
console.log(`\nBucket sizes:`);
for (const p of PATTERNS) console.log(`  ${p}: ${buckets[p].length}`);
if (untagged.length > 0) console.log(`  untagged: ${untagged.length}`);
