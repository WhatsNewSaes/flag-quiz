/**
 * One-time/manual download of all flag SVGs from flagcdn.com.
 *
 * Saves to public/flag-images/flag-{slug}.svg with SEO-friendly filenames
 * (e.g., flag-united-states.svg). Idempotent — skips files that already exist.
 *
 * Usage: tsx scripts/fetch-flag-images.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { countries } from '../src/data/countries';
import { territories } from '../src/data/territories';

const OUT_DIR = path.resolve(import.meta.dirname, '..', 'public', 'flag-images');

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface Entry {
  code: string;
  name: string;
}

async function fetchOne(entry: Entry): Promise<{ ok: boolean; reason?: string }> {
  const slug = slugify(entry.name);
  const filename = `flag-${slug}.svg`;
  const out = path.join(OUT_DIR, filename);

  if (fs.existsSync(out)) {
    return { ok: true, reason: 'cached' };
  }

  const url = `https://flagcdn.com/${entry.code.toLowerCase()}.svg`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { ok: false, reason: `HTTP ${res.status}` };
    }
    const text = await res.text();
    if (!text.includes('<svg')) {
      return { ok: false, reason: 'not SVG' };
    }
    fs.writeFileSync(out, text, 'utf-8');
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const all: Entry[] = [
    ...countries.map((c) => ({ code: c.code, name: c.name })),
    ...territories.map((t) => ({ code: t.code, name: t.name })),
  ];

  console.log(`Fetching ${all.length} flag SVGs to ${OUT_DIR}…`);

  const failures: { entry: Entry; reason: string }[] = [];
  let done = 0;
  let cached = 0;

  // Concurrency 8
  const BATCH = 8;
  for (let i = 0; i < all.length; i += BATCH) {
    const batch = all.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(async (e) => ({ e, r: await fetchOne(e) })));
    for (const { e, r } of results) {
      done++;
      if (!r.ok) failures.push({ entry: e, reason: r.reason ?? 'unknown' });
      if (r.reason === 'cached') cached++;
    }
    process.stdout.write(`  ${done}/${all.length}\r`);
  }

  console.log(`\nDone — ${done - failures.length}/${done} succeeded (${cached} cached)`);
  if (failures.length > 0) {
    console.log(`Failures (${failures.length}):`);
    for (const { entry, reason } of failures) {
      console.log(`  ${entry.code} (${entry.name}): ${reason}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
