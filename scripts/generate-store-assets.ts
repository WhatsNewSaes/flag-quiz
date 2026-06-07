import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outDir = path.join(root, 'store-assets');
const sharedDir = path.join(outDir, 'shared');
const appStoreDir = path.join(outDir, 'app-store', 'iphone-6-7');
const googlePlayDir = path.join(outDir, 'google-play');
const googlePlayScreenshotsDir = path.join(googlePlayDir, 'phone-screenshots');

type ScreenshotSpec = {
  slug: string;
  modeImage: string;
  label: string;
  title: string;
  lines: string[];
  accent: string;
};

const screenshots: ScreenshotSpec[] = [
  {
    slug: '01-game-modes',
    modeImage: 'journey',
    label: 'GAME MODES',
    title: 'Pick Your World Tour',
    lines: ['Six quick-play flag games', 'built for mobile.'],
    accent: '#16823A',
  },
  {
    slug: '02-perfect-passport',
    modeImage: 'perfect-passport',
    label: 'PERFECT PASSPORT',
    title: 'Can You Go 197/197?',
    lines: ['Draft the best countries', 'from every spin.'],
    accent: '#F97316',
  },
  {
    slug: '03-share-score',
    modeImage: 'around-the-world',
    label: 'CHALLENGE FRIENDS',
    title: 'Share Your Score',
    lines: ['Send a challenge link', 'and dare friends to beat it.'],
    accent: '#2A46B8',
  },
  {
    slug: '04-journey-mode',
    modeImage: 'journey',
    label: 'JOURNEY MODE',
    title: 'Earn Stars As You Learn',
    lines: ['Progress through worlds', 'and unlock achievements.'],
    accent: '#16823A',
  },
  {
    slug: '05-flag-jeopardy',
    modeImage: 'jeopardy',
    label: 'FLAG JEOPARDY',
    title: 'Easy Or Type Mode',
    lines: ['Pick from four options', 'or type from memory.'],
    accent: '#2A46B8',
  },
  {
    slug: '06-flag-runner',
    modeImage: 'flag-runner',
    label: 'FLAG RUNNER',
    title: 'Run Through Flags',
    lines: ['Dodge wrong answers', 'in a pixel-art platformer.'],
    accent: '#E91E23',
  },
];

function svgTextOverlay() {
  return Buffer.from(`
<svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="1024" height="500" fill="rgba(46,46,46,0.30)"/>
  <rect x="38" y="40" width="418" height="420" fill="#FFF7E8" stroke="#2D2D2D" stroke-width="8"/>
  <rect x="52" y="54" width="390" height="74" fill="#FFDA3D" stroke="#2D2D2D" stroke-width="6"/>
  <text x="247" y="101" text-anchor="middle" font-family="monospace" font-size="34" font-weight="800" fill="#2D2D2D">FLAG ARCADE</text>
  <text x="68" y="190" font-family="monospace" font-size="44" font-weight="900" fill="#16823A">RETRO FLAG</text>
  <text x="68" y="244" font-family="monospace" font-size="44" font-weight="900" fill="#16823A">QUIZ GAMES</text>
  <text x="70" y="312" font-family="monospace" font-size="24" font-weight="700" fill="#2D2D2D">197 countries.</text>
  <text x="70" y="348" font-family="monospace" font-size="24" font-weight="700" fill="#2D2D2D">Six game modes.</text>
  <text x="70" y="384" font-family="monospace" font-size="24" font-weight="700" fill="#2D2D2D">Built for quick play.</text>
  <rect x="70" y="408" width="252" height="38" fill="#2A46B8" stroke="#2D2D2D" stroke-width="4"/>
  <text x="196" y="434" text-anchor="middle" font-family="monospace" font-size="20" font-weight="900" fill="#FFFFFF">PLAY THE WORLD</text>
</svg>`);
}

async function generateGooglePlayFeatureGraphic() {
  const source = path.join(root, 'public', 'modes', 'perfect-passport.webp');
  const background = await sharp(source)
    .resize(1024, 500, { fit: 'cover' })
    .blur(10)
    .modulate({ brightness: 0.82, saturation: 1.15 })
    .png()
    .toBuffer();

  const featureArt = await sharp(source)
    .resize(506, 338, { fit: 'cover' })
    .extend({ top: 8, right: 8, bottom: 8, left: 8, background: '#2D2D2D' })
    .png()
    .toBuffer();

  const output = await sharp(background)
    .composite([
      { input: svgTextOverlay(), left: 0, top: 0 },
      { input: featureArt, left: 480, top: 74 },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(path.join(googlePlayDir, 'feature-graphic.png'), output);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function screenshotOverlay(spec: ScreenshotSpec, width: number, height: number) {
  const scale = width / 1290;
  const font = (size: number) => Math.round(size * scale);
  const px = (value: number) => Math.round(value * scale);
  const safeTop = Math.round(height * 0.075);
  const titleY = safeTop + px(204);
  const cardTop = Math.round(height * 0.47);
  const lineOne = spec.lines[0] ?? '';
  const lineTwo = spec.lines[1] ?? '';

  return Buffer.from(`
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#39B8E8"/>
  <rect x="${px(58)}" y="${safeTop}" width="${width - px(116)}" height="${px(112)}" fill="${spec.accent}" stroke="#2D2D2D" stroke-width="${px(8)}"/>
  <text x="${width / 2}" y="${safeTop + px(75)}" text-anchor="middle" font-family="monospace" font-size="${font(44)}" font-weight="900" fill="#FFFFFF">${escapeXml(spec.label)}</text>
  <rect x="${px(58)}" y="${titleY + px(34)}" width="${width - px(116)}" height="${height - titleY - px(112)}" rx="${px(18)}" fill="#FFF7E8" stroke="#2D2D2D" stroke-width="${px(8)}"/>
  <text x="${width / 2}" y="${titleY}" text-anchor="middle" font-family="monospace" font-size="${font(58)}" font-weight="900" fill="#2D2D2D">${escapeXml(spec.title)}</text>
  <text x="${width / 2}" y="${cardTop + px(580)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${font(43)}" font-weight="700" fill="#16324A">${escapeXml(lineOne)}</text>
  <text x="${width / 2}" y="${cardTop + px(642)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${font(43)}" font-weight="700" fill="#16324A">${escapeXml(lineTwo)}</text>
  <rect x="${px(198)}" y="${height - px(250)}" width="${width - px(396)}" height="${px(94)}" fill="#FFDA3D" stroke="#2D2D2D" stroke-width="${px(8)}"/>
  <text x="${width / 2}" y="${height - px(190)}" text-anchor="middle" font-family="monospace" font-size="${font(34)}" font-weight="900" fill="#2D2D2D">PLAY FLAG ARCADE</text>
</svg>`);
}

function artFrameOverlay(width: number, height: number) {
  const scale = width / 1290;
  const px = (value: number) => Math.round(value * scale);
  const safeTop = Math.round(height * 0.075);
  const artTop = safeTop + px(400);
  const artHeight = Math.round(height * 0.30);

  return Buffer.from(`
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${px(90)}" y="${artTop - px(18)}" width="${width - px(180)}" height="${artHeight + px(36)}" fill="none" stroke="#2D2D2D" stroke-width="${px(8)}"/>
</svg>`);
}

async function generateScreenshot(spec: ScreenshotSpec, targetDir: string, width: number, height: number) {
  const source = path.join(root, 'public', 'modes', `${spec.modeImage}.webp`);
  const safeTop = Math.round(height * 0.075);
  const artTop = safeTop + Math.round(400 * (width / 1290));
  const artLeft = Math.round(90 * (width / 1290));
  const artWidth = width - Math.round(180 * (width / 1290));
  const artHeight = Math.round(height * 0.30);
  const background = await sharp(source)
    .resize(width, height, { fit: 'cover' })
    .blur(16)
    .modulate({ brightness: 0.75, saturation: 1.12 })
    .png()
    .toBuffer();
  const art = await sharp(source)
    .resize(artWidth, artHeight, { fit: 'cover' })
    .png()
    .toBuffer();

  const output = await sharp(background)
    .composite([
      { input: screenshotOverlay(spec, width, height), left: 0, top: 0 },
      { input: art, left: artLeft, top: artTop },
      { input: artFrameOverlay(width, height), left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(path.join(targetDir, `${spec.slug}.png`), output);
}

async function generateStoreScreenshots() {
  await mkdir(appStoreDir, { recursive: true });
  await mkdir(googlePlayScreenshotsDir, { recursive: true });

  for (const spec of screenshots) {
    await generateScreenshot(spec, appStoreDir, 1290, 2796);
    await generateScreenshot(spec, googlePlayScreenshotsDir, 1080, 1920);
  }
}

async function writeReadme() {
  await writeFile(
    path.join(outDir, 'README.md'),
    `# Store Assets

Generated by \`npm run build:store-assets\`.

Package the current store assets and launch docs for handoff with \`npm run package:store-submission\`. The generated package is written to \`dist/mobile-store-submission/\`, the shareable archive is written to \`dist/flag-arcade-mobile-store-submission.zip\`, and the readiness report is written to \`dist/mobile-readiness-report.md\`. These outputs are intentionally not committed.

## Files

- \`google-play/feature-graphic.png\` — Google Play feature graphic, 1024x500.
- \`shared/app-icon-1024.png\` — App icon source, 1024x1024.
- \`app-store/iphone-6-7/*.png\` — App Store 6.7-inch portrait screenshots, 1290x2796.
- \`google-play/phone-screenshots/*.png\` — Google Play phone screenshots, 1080x1920.

The generated screenshots are store listing assets built from the app's mode artwork and current launch copy. Final installed-device captures are still recommended before submission if the store listing should show exact in-app UI chrome.
`,
    'utf8',
  );
}

async function main() {
  await mkdir(sharedDir, { recursive: true });
  await mkdir(googlePlayDir, { recursive: true });
  await copyFile(
    path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png'),
    path.join(sharedDir, 'app-icon-1024.png'),
  );
  await generateGooglePlayFeatureGraphic();
  await generateStoreScreenshots();
  await writeReadme();
  console.log('Generated store assets in store-assets/');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
