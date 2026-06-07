import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

type Check = {
  label: string;
  ok: boolean;
  detail?: string;
};

const root = process.cwd();
const checks: Check[] = [];

const appStoreScreenshotSlugs = [
  '01-game-modes',
  '02-perfect-passport',
  '03-share-score',
  '04-journey-mode',
  '05-flag-jeopardy',
  '06-flag-runner',
];

const metadataLabels = new Set([
  'App name',
  'Category',
  'Website',
  'Marketing URL',
  'Support URL',
  'Privacy policy URL',
  'Terms URL',
  'Bundle ID / package name',
  'Current public version',
  'Native build number / Android version code',
  'Subtitle',
  'Promotional text',
  'Keywords',
  'Description',
  'Short description',
  'Feature graphic',
  'Full description',
]);

function resolve(...segments: string[]) {
  return path.join(root, ...segments);
}

function pass(label: string, detail?: string) {
  checks.push({ label, ok: true, detail });
}

function fail(label: string, detail?: string) {
  checks.push({ label, ok: false, detail });
}

function expect(condition: boolean, label: string, detail?: string) {
  if (condition) pass(label, detail);
  else fail(label, detail);
}

function bulletValue(markdown: string, label: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = markdown.match(new RegExp(`^- ${escapedLabel}:[ \\t]*(.*)$`, 'm'));
  return match?.[1]?.trim().replace(/^`|`$/g, '') ?? '';
}

function section(markdown: string, heading: string) {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) return '';

  const end = lines.findIndex((line, index) => index > start && line.startsWith('## '));
  return lines.slice(start + 1, end === -1 ? undefined : end).join('\n').trim();
}

function labeledBlock(markdown: string, label: string) {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.trim() === `- ${label}:`);
  if (start === -1) return '';

  let contentStart = start + 1;
  while (contentStart < lines.length && lines[contentStart].trim() === '') {
    contentStart += 1;
  }

  const end = lines.findIndex((line, index) => {
    if (index <= contentStart) return false;
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) return true;

    const labelMatch = trimmed.match(/^- ([^:]+):/);
    return Boolean(labelMatch?.[1] && metadataLabels.has(labelMatch[1]));
  });

  return lines.slice(contentStart, end === -1 ? undefined : end).join('\n').trim();
}

function charCount(value: string) {
  return [...value].length;
}

function expectNonEmpty(value: string, label: string) {
  expect(value.trim().length > 0, label, value.trim() || 'empty');
}

function expectMaxChars(value: string, max: number, label: string) {
  expect(charCount(value) <= max, label, `${charCount(value)}/${max}`);
}

async function expectImage(relativePath: string, width: number, height: number, label: string) {
  const absolutePath = resolve(relativePath);
  if (!existsSync(absolutePath)) {
    fail(`${label} exists`, relativePath);
    return;
  }

  const metadata = await sharp(absolutePath).metadata();
  const detail = `${metadata.width ?? '?'}x${metadata.height ?? '?'} ${metadata.format ?? 'image'}`;
  pass(`${label} exists`, detail);
  expect(metadata.width === width && metadata.height === height, `${label} dimensions are ${width}x${height}`, detail);
}

async function main() {
  const metadata = await readFile(resolve('docs/mobile-store-metadata.md'), 'utf8');
  const submissionPackage = await readFile(resolve('docs/mobile-store-submission-package.md'), 'utf8');
  const privacyAnswers = await readFile(resolve('docs/mobile-store-privacy-form-answers.md'), 'utf8');
  const privacyInventory = await readFile(resolve('docs/mobile-privacy-data-inventory.md'), 'utf8');

  const appName = bulletValue(metadata, 'App name');
  const bundleId = bulletValue(metadata, 'Bundle ID / package name');
  const publicVersion = bulletValue(metadata, 'Current public version');
  const buildNumber = bulletValue(metadata, 'Native build number / Android version code');
  const subtitle = bulletValue(metadata, 'Subtitle');
  const promotionalText = bulletValue(metadata, 'Promotional text');
  const keywords = bulletValue(metadata, 'Keywords');
  const shortDescription = bulletValue(metadata, 'Short description');
  const appStoreDescription = labeledBlock(section(metadata, 'App Store'), 'Description');
  const googleFullDescription = labeledBlock(section(metadata, 'Google Play'), 'Full description');

  expect(appName === 'Flag Arcade', 'Store metadata app name is Flag Arcade', appName);
  expectMaxChars(appName, 30, 'App Store app name fits 30-character limit');
  expect(bundleId === 'com.flagarcade.app', 'Store metadata bundle/package id is com.flagarcade.app', bundleId);
  expect(publicVersion === '1.0', 'Store metadata public version is 1.0', publicVersion);
  expect(buildNumber === '1', 'Store metadata build number/version code is 1', buildNumber);

  for (const label of ['Website', 'Marketing URL', 'Support URL', 'Privacy policy URL', 'Terms URL']) {
    const value = bulletValue(metadata, label);
    expect(value.startsWith('https://flagarcade.com'), `${label} uses production HTTPS URL`, value);
  }

  expectNonEmpty(subtitle, 'App Store subtitle is present');
  expectMaxChars(subtitle, 30, 'App Store subtitle fits 30-character limit');
  expectNonEmpty(promotionalText, 'App Store promotional text is present');
  expectMaxChars(promotionalText, 170, 'App Store promotional text fits 170-character limit');
  expectNonEmpty(keywords, 'App Store keywords are present');
  expectMaxChars(keywords, 100, 'App Store keywords fit 100-character limit');
  expectNonEmpty(appStoreDescription, 'App Store description is present');
  expectMaxChars(appStoreDescription, 4000, 'App Store description fits 4000-character limit');

  expectNonEmpty(shortDescription, 'Google Play short description is present');
  expectMaxChars(shortDescription, 80, 'Google Play short description fits 80-character limit');
  expectNonEmpty(googleFullDescription, 'Google Play full description is present');
  expectMaxChars(googleFullDescription, 4000, 'Google Play full description fits 4000-character limit');

  for (const term of [
    'No gambling or loot boxes.',
    'No user-generated public content.',
    'No precise location, camera, contacts, microphone, photos, or health data permissions requested.',
    'Final age rating must be confirmed in App Store Connect and Google Play Console.',
  ]) {
    expect(metadata.includes(term), `Store metadata includes rating note: ${term}`);
  }

  const requiredPackageTerms = [
    'Flag Arcade',
    'com.flagarcade.app',
    'https://flagarcade.com',
    'https://flagarcade.com/support',
    'https://flagarcade.com/privacy',
    'https://flagarcade.com/terms',
    'docs/mobile-store-metadata.md',
    'docs/mobile-privacy-data-inventory.md',
    'docs/mobile-store-privacy-form-answers.md',
    'docs/mobile-data-deletion-runbook.md',
    'npm run mobile:preflight',
    'npm run mobile:urls:check',
    'npm run mobile:evidence:init',
    'npm run mobile:evidence:check',
    'signed iOS archive',
    'android/app/build/outputs/bundle/release/app-release.aab',
    'android/keystore.properties.example',
    'TestFlight smoke test',
    'Google Play pre-launch report',
  ];
  for (const term of requiredPackageTerms) {
    expect(submissionPackage.includes(term), `Submission package includes ${term}`);
  }

  const requiredPrivacyTerms = [
    ['Data encrypted in transit: Yes', 'Data is encrypted in transit.'],
    ['Data sold: No', 'does not sell data'],
    ['Cross-app tracking: No', 'cross-app tracking'],
    ['Precise location collected: No', 'does not request precise location'],
    ['User deletion path', 'Users can request account/data deletion'],
    ['within 30 days', 'within 30 days'],
    ['Apple App Privacy', 'PrivacyInfo.xcprivacy'],
    ['Google Play Data Safety', 'android.permission.INTERNET'],
    ['PrivacyInfo.xcprivacy', 'PrivacyInfo.xcprivacy'],
  ] as const;
  for (const [answerTerm, inventoryTerm] of requiredPrivacyTerms) {
    expect(privacyAnswers.includes(answerTerm), `Privacy form answers include ${answerTerm}`);
    expect(privacyInventory.includes(inventoryTerm), `Privacy inventory supports ${answerTerm}`, inventoryTerm);
  }

  await expectImage('store-assets/shared/app-icon-1024.png', 1024, 1024, 'Shared app icon');
  await expectImage('store-assets/google-play/feature-graphic.png', 1024, 500, 'Google Play feature graphic');

  const appStoreFiles = await readdir(resolve('store-assets/app-store/iphone-6-7'));
  const googlePlayFiles = await readdir(resolve('store-assets/google-play/phone-screenshots'));
  expect(appStoreFiles.filter((file) => file.endsWith('.png')).length >= 6, 'App Store screenshot folder has at least 6 PNGs');
  expect(googlePlayFiles.filter((file) => file.endsWith('.png')).length >= 6, 'Google Play screenshot folder has at least 6 PNGs');

  for (const slug of appStoreScreenshotSlugs) {
    await expectImage(`store-assets/app-store/iphone-6-7/${slug}.png`, 1290, 2796, `${slug} App Store screenshot`);
    await expectImage(`store-assets/google-play/phone-screenshots/${slug}.png`, 1080, 1920, `${slug} Google Play screenshot`);
    expect(submissionPackage.includes(`store-assets/app-store/iphone-6-7/${slug}.png`), `Submission package lists ${slug} App Store screenshot`);
    expect(submissionPackage.includes(`store-assets/google-play/phone-screenshots/${slug}.png`), `Submission package lists ${slug} Google Play screenshot`);
  }

  const failed = checks.filter((check) => !check.ok);
  for (const check of checks) {
    const prefix = check.ok ? 'PASS' : 'FAIL';
    console.log(`${prefix} ${check.label}${check.detail ? ` (${check.detail})` : ''}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} store submission check(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${checks.length} store submission checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
