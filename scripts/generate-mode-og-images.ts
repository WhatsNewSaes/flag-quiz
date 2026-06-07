import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outDir = path.join(root, 'public', 'og', 'modes');

const modes = [
  'journey',
  'perfect-passport',
  'jeopardy',
  'arcade',
  'around-the-world',
  'flag-runner',
  'presentation',
] as const;

async function generateModeOgImage(mode: string) {
  const inputPath = path.join(root, 'public', 'modes', `${mode}.webp`);
  const outputPath = path.join(outDir, `${mode}.jpg`);

  const background = await sharp(inputPath)
    .resize(1200, 630, { fit: 'cover' })
    .blur(10)
    .modulate({ brightness: 0.72, saturation: 1.1 })
    .jpeg({ quality: 82 })
    .toBuffer();

  const framedCover = await sharp(inputPath)
    .resize(920, 590, { fit: 'cover' })
    .extend({ top: 8, right: 8, bottom: 8, left: 8, background: '#2f2f2f' })
    .jpeg({ quality: 88 })
    .toBuffer();

  const metadata = await sharp(framedCover).metadata();
  const left = Math.round((1200 - (metadata.width ?? 936)) / 2);
  const top = Math.round((630 - (metadata.height ?? 606)) / 2);

  const result = await sharp(background)
    .composite([{ input: framedCover, left, top }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();

  await writeFile(outputPath, result);
  console.log(`Generated public/og/modes/${mode}.jpg`);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  for (const mode of modes) {
    await generateModeOgImage(mode);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
