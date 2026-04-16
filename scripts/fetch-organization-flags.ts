/**
 * Download organization flag SVGs from Wikimedia (Commons + en.wiki fallback).
 *
 * flagcdn.com only hosts country flags, so we resolve organization flags via
 * Wikimedia's Special:FilePath redirect. Each org has one or more candidate
 * filenames; we try them in order and stop on the first 200.
 *
 * Saves to public/flag-images/flag-{slug}.svg. Idempotent — skips existing files.
 *
 * Usage: tsx scripts/fetch-organization-flags.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { organizations } from '../src/data/organizations';

const OUT_DIR = path.resolve(import.meta.dirname, '..', 'public', 'flag-images');
const UA = 'FlagArcadeBot/1.0 (https://flagarcade.com; seth@coelen.co)';
const DELAY_MS = 1500;

type Host = 'commons' | 'en';
interface Candidate {
  host: Host;
  filename: string;
}

// org slug -> ordered list of Wikimedia filename candidates.
// First-match wins. Add alternates if the primary 404s.
const CANDIDATES: Record<string, Candidate[]> = {
  'united-nations': [{ host: 'commons', filename: 'Flag_of_the_United_Nations.svg' }],
  'european-union': [{ host: 'commons', filename: 'Flag_of_Europe.svg' }],
  nato: [{ host: 'commons', filename: 'Flag_of_NATO.svg' }],
  'african-union': [{ host: 'commons', filename: 'Flag_of_the_African_Union.svg' }],
  asean: [
    { host: 'en', filename: 'ASEAN_Flag.svg' },
    { host: 'commons', filename: 'Flag_of_ASEAN.svg' },
  ],
  'arab-league': [
    { host: 'commons', filename: 'Flag_of_the_Arab_League.svg' },
    { host: 'commons', filename: 'Flag_of_the_League_of_Arab_States.svg' },
  ],
  'organization-of-american-states': [
    { host: 'commons', filename: 'Flag_of_the_Organization_of_American_States.svg' },
    { host: 'commons', filename: 'Flag_of_the_OAS.svg' },
  ],
  'commonwealth-of-nations': [
    { host: 'en', filename: 'Commonwealth_Flag_2013.svg' },
    { host: 'commons', filename: 'Flag_of_the_Commonwealth_of_Nations.svg' },
  ],
  'organisation-of-islamic-cooperation': [
    { host: 'commons', filename: 'Flag_of_the_Organisation_of_Islamic_Cooperation_(OIC).svg' },
    { host: 'commons', filename: 'OIC_Logo_since_2011.svg' },
  ],
  opec: [
    { host: 'commons', filename: 'Flag_of_OPEC.svg' },
    { host: 'commons', filename: 'OPEC_flag.svg' },
  ],
  'gulf-cooperation-council': [
    { host: 'commons', filename: 'Flag_of_the_Cooperation_Council_for_the_Arab_States_of_the_Gulf.svg' },
    { host: 'commons', filename: 'Flag_of_the_Gulf_Cooperation_Council.svg' },
  ],
  'nordic-council': [
    { host: 'commons', filename: 'Flag_of_the_Nordic_Council.svg' },
    { host: 'commons', filename: 'Nordic_Council_flag.svg' },
  ],
  'pacific-community': [
    { host: 'commons', filename: 'Flag_of_the_Pacific_Community.svg' },
    { host: 'commons', filename: 'Flag_of_the_SPC.svg' },
  ],
  'caribbean-community': [
    { host: 'commons', filename: 'Flag_of_CARICOM.svg' },
    { host: 'commons', filename: 'Flag_of_the_Caribbean_Community.svg' },
  ],
  'union-of-south-american-nations': [
    { host: 'commons', filename: 'Flag_of_UNASUR.svg' },
    { host: 'commons', filename: 'Flag_of_the_Union_of_South_American_Nations.svg' },
  ],
  'commonwealth-of-independent-states': [
    { host: 'commons', filename: 'Flag_of_the_CIS.svg' },
    { host: 'commons', filename: 'Flag_of_the_Commonwealth_of_Independent_States.svg' },
  ],
  'collective-security-treaty-organization': [
    { host: 'commons', filename: 'Flag_of_the_Collective_Security_Treaty_Organization.svg' },
    { host: 'commons', filename: 'Flag_of_CSTO.svg' },
  ],
  'eurasian-economic-union': [
    { host: 'commons', filename: 'Flag_of_the_Eurasian_Economic_Union.svg' },
    { host: 'commons', filename: 'Flag_of_EAEU.svg' },
  ],
  'southern-african-development-community': [
    { host: 'commons', filename: 'Flag_of_SADC.svg' },
    { host: 'commons', filename: 'Flag_of_the_Southern_African_Development_Community.svg' },
  ],
  'east-african-community': [
    { host: 'en', filename: 'Flag_of_the_East_African_Community.svg' },
    { host: 'commons', filename: 'Flag_of_the_East_African_Community.svg' },
  ],
  'organisation-of-turkic-states': [
    { host: 'commons', filename: 'Flag_of_the_Organization_of_Turkic_States.svg' },
    { host: 'commons', filename: 'Flag_of_the_Turkic_Council.svg' },
  ],
  'central-american-integration-system': [
    { host: 'commons', filename: 'Flag_of_the_Central_American_Integration_System.svg' },
    { host: 'commons', filename: 'Flag_of_SICA.svg' },
  ],
  'organisation-internationale-de-la-francophonie': [
    { host: 'commons', filename: 'Flag_of_La_Francophonie.svg' },
    { host: 'commons', filename: 'Flag_of_the_Organisation_internationale_de_la_Francophonie.svg' },
  ],
};

const HOST_BASE: Record<Host, string> = {
  commons: 'https://commons.wikimedia.org/wiki/Special:FilePath/',
  en: 'https://en.wikipedia.org/wiki/Special:FilePath/',
};

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function tryCandidate(c: Candidate): Promise<string | null> {
  const url = HOST_BASE[c.host] + encodeURIComponent(c.filename);
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) return null;
  const text = await res.text();
  if (!text.includes('<svg')) return null;
  return text;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const failures: { slug: string; tried: string[] }[] = [];
  let saved = 0;
  let skipped = 0;

  for (const org of organizations) {
    const out = path.join(OUT_DIR, `flag-${org.slug}.svg`);
    if (fs.existsSync(out)) {
      skipped++;
      console.log(`  ✓ ${org.slug} (cached)`);
      continue;
    }

    const candidates = CANDIDATES[org.slug];
    if (!candidates) {
      failures.push({ slug: org.slug, tried: ['<no candidates defined>'] });
      console.log(`  ✗ ${org.slug} — no candidates defined`);
      continue;
    }

    let svg: string | null = null;
    const tried: string[] = [];
    for (const c of candidates) {
      tried.push(`${c.host}:${c.filename}`);
      try {
        svg = await tryCandidate(c);
      } catch (err) {
        console.log(`    error: ${String(err)}`);
        svg = null;
      }
      await sleep(DELAY_MS);
      if (svg) break;
    }

    if (svg) {
      fs.writeFileSync(out, svg, 'utf-8');
      saved++;
      console.log(`  ✓ ${org.slug} (saved)`);
    } else {
      failures.push({ slug: org.slug, tried });
      console.log(`  ✗ ${org.slug} — tried ${tried.join(', ')}`);
    }
  }

  console.log(`\nDone — ${saved} saved, ${skipped} cached, ${failures.length} failed`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const { slug, tried } of failures) {
      console.log(`  ${slug}: ${tried.join(', ')}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
