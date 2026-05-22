/**
 * Splits flagDescriptions and countryFacts into per-code JSON files so country
 * pages can fetch only the data they need at runtime instead of bundling the
 * full ~500KB dataset into every page load.
 *
 * Run automatically before `vite build` and `vite` (see package.json scripts).
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { flagDescriptions } from '../src/data/flagDescriptions';
import { countryFacts } from '../src/data/countryFacts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DATA = path.resolve(__dirname, '..', 'public', 'data');
const DESC_DIR = path.join(PUBLIC_DATA, 'flag-descriptions');
const FACTS_DIR = path.join(PUBLIC_DATA, 'country-facts');

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
}

function splitRecord<T>(source: Record<string, T>, outDir: string): number {
  ensureDir(outDir);
  let count = 0;
  for (const [code, value] of Object.entries(source)) {
    writeJson(path.join(outDir, `${code}.json`), value);
    count++;
  }
  return count;
}

const descCount = splitRecord(flagDescriptions, DESC_DIR);
const factsCount = splitRecord(countryFacts, FACTS_DIR);

console.log(`split-country-data: wrote ${descCount} descriptions, ${factsCount} facts`);
