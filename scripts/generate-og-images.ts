/**
 * Build-time OG image generator for country flag pages.
 * Composites country name, continent, and flag emoji onto a base image.
 *
 * Usage: tsx scripts/generate-og-images.ts
 *
 * Currently generates images for a sample of 5 countries.
 * To generate for all countries, remove the SAMPLE_CODES filter.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import sharp from 'sharp';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { countries } from '../src/data/countries';

const OUT_DIR = path.resolve(import.meta.dirname, '..', 'public', 'og');
const BASE_IMG = path.resolve(import.meta.dirname, '..', 'public', 'og', 'base.jpg');

// To generate for a subset only, uncomment and set SAMPLE_CODES
// const SAMPLE_CODES = ['JP', 'BR', 'US', 'DE', 'KE'];

function slugify(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getFlagEmoji(code: string): string {
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0))
  );
}

function loadFont(): Buffer {
  return fs.readFileSync(path.resolve(import.meta.dirname, 'PressStart2P-Regular.ttf'));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const font = loadFont();
  const targets = countries;

  console.log(`Generating OG images for ${targets.length} countries...`);

  for (const country of targets) {
    const slug = slugify(country.name);
    const emoji = getFlagEmoji(country.code);
    const nameFontSize = country.name.length > 20 ? 32 : country.name.length > 14 ? 45 : 60;

    // Render the overlay (text + flag emoji) with satori
    const overlaySvg = await satori(
      {
        type: 'div',
        props: {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: '25px',
            paddingBottom: '140px',
            fontFamily: 'Press Start 2P',
          },
          children: [
            // Country name
            {
              type: 'div',
              props: {
                style: {
                  fontSize: `${nameFontSize}px`,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  textAlign: 'center',
                  textTransform: 'uppercase' as const,
                  textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                  marginBottom: '25px',
                },
                children: country.name,
              },
            },
            // Continent
            {
              type: 'div',
              props: {
                style: {
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#cccccc',
                  textAlign: 'center',
                  textTransform: 'uppercase' as const,
                  textShadow: '0 2px 6px rgba(0,0,0,0.7)',
                  marginBottom: '25px',
                },
                children: country.continent,
              },
            },
            // Flag emoji
            {
              type: 'div',
              props: {
                style: {
                  fontSize: '375px',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
                },
                children: emoji,
              },
            },
          ],
        },
      },
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Press Start 2P',
            data: font,
            weight: 700,
            style: 'normal',
          },
        ],
        loadAdditionalAsset: async (code, segment) => {
          if (code === 'emoji') {
            const codePoints = [...segment]
              .map((c) => c.codePointAt(0)!.toString(16))
              .join('-');
            const url = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codePoints}.svg`;
            try {
              const res = await fetch(url);
              if (res.ok) {
                const svgText = await res.text();
                return `data:image/svg+xml,${encodeURIComponent(svgText)}`;
              }
            } catch {
              // fall through
            }
          }
          return '';
        },
      },
    );

    // Convert satori SVG overlay to PNG
    const resvg = new Resvg(overlaySvg, {
      fitTo: { mode: 'width', value: 1200 },
    });
    const overlayPng = resvg.render().asPng();

    // Composite overlay on top of the base image
    const result = await sharp(BASE_IMG)
      .composite([
        {
          input: Buffer.from(overlayPng),
          top: 0,
          left: 0,
        },
      ])
      .jpeg({ quality: 80 })
      .toBuffer();

    const outPath = path.join(OUT_DIR, `${slug}.jpg`);
    fs.writeFileSync(outPath, result);
    console.log(`  ✓ ${country.name} → og/${slug}.jpg`);
  }

  console.log('Done!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
