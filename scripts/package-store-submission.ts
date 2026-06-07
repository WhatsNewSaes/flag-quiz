import { execFileSync } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

type ManifestEntry = {
  source: string;
  destination: string;
};

const root = process.cwd();
const outputRoot = path.join(root, 'dist/mobile-store-submission');
const archiveFileName = 'flag-arcade-mobile-store-submission.zip';
const archivePath = path.join(root, 'dist', archiveFileName);

const requiredFiles = [
  'store-assets/shared/app-icon-1024.png',
  'store-assets/google-play/feature-graphic.png',
  'docs/mobile-store-metadata.md',
  'docs/mobile-store-submission-package.md',
  'docs/mobile-store-privacy-form-answers.md',
  'docs/mobile-privacy-data-inventory.md',
  'docs/mobile-data-deletion-runbook.md',
  'docs/mobile-installed-build-qa.md',
  'docs/mobile-release-evidence-template.md',
  'docs/mobile-launch-checklist.md',
];

const requiredDirectories = [
  'store-assets/app-store/iphone-6-7',
  'store-assets/google-play/phone-screenshots',
];

function resolve(...segments: string[]) {
  return path.join(root, ...segments);
}

function toPosix(relativePath: string) {
  return relativePath.split(path.sep).join('/');
}

async function assertPathExists(relativePath: string) {
  try {
    await stat(resolve(relativePath));
  } catch {
    throw new Error(`Missing required store submission input: ${relativePath}`);
  }
}

async function copyFileIntoPackage(relativeSource: string, relativeDestination: string, entries: ManifestEntry[]) {
  await assertPathExists(relativeSource);
  const source = resolve(relativeSource);
  const destination = path.join(outputRoot, relativeDestination);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination);
  entries.push({
    source: toPosix(relativeSource),
    destination: toPosix(path.relative(outputRoot, destination)),
  });
}

async function copyDirectoryIntoPackage(relativeSource: string, relativeDestination: string, entries: ManifestEntry[]) {
  await assertPathExists(relativeSource);
  const source = resolve(relativeSource);
  const destination = path.join(outputRoot, relativeDestination);
  await mkdir(destination, { recursive: true });

  const files = await readdir(source);
  for (const file of files.sort()) {
    const sourceFile = path.join(source, file);
    const sourceStats = await stat(sourceFile);
    if (!sourceStats.isFile()) continue;

    const destinationFile = path.join(destination, file);
    await cp(sourceFile, destinationFile);
    entries.push({
      source: toPosix(path.relative(root, sourceFile)),
      destination: toPosix(path.relative(outputRoot, destinationFile)),
    });
  }
}

async function main() {
  const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf8')) as {
    version?: string;
  };

  await rm(outputRoot, { recursive: true, force: true });
  await rm(archivePath, { force: true });
  await mkdir(outputRoot, { recursive: true });

  const entries: ManifestEntry[] = [];

  await copyFileIntoPackage('store-assets/shared/app-icon-1024.png', 'shared/app-icon-1024.png', entries);
  await copyFileIntoPackage('store-assets/google-play/feature-graphic.png', 'google-play/feature-graphic.png', entries);
  await copyDirectoryIntoPackage('store-assets/app-store/iphone-6-7', 'app-store/iphone-6-7', entries);
  await copyDirectoryIntoPackage('store-assets/google-play/phone-screenshots', 'google-play/phone-screenshots', entries);

  for (const relativeFile of requiredFiles.filter((file) => file.startsWith('docs/'))) {
    await copyFileIntoPackage(relativeFile, relativeFile, entries);
  }

  for (const relativeFile of requiredFiles.filter((file) => !file.startsWith('docs/'))) {
    await assertPathExists(relativeFile);
  }
  for (const relativeDirectory of requiredDirectories) {
    await assertPathExists(relativeDirectory);
  }

  const manifest = {
    packageName: 'Flag Arcade mobile store submission package',
    generatedAt: new Date().toISOString(),
    appVersion: packageJson.version ?? 'unknown',
    outputPath: 'dist/mobile-store-submission',
    archivePath: `dist/${archiveFileName}`,
    includedFiles: entries,
    externalRequired: [
      'Signed iOS archive uploaded to TestFlight',
      'Signed Android AAB uploaded to Google Play internal testing',
      'App Store privacy labels submitted',
      'Google Play Data Safety form submitted',
      'Installed-build smoke evidence completed for both platforms',
      'Final developer account, signing team, and copyright holder confirmed',
    ],
  };

  await writeFile(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const summary = [
    '# Flag Arcade Mobile Store Submission Package',
    '',
    `Generated: ${manifest.generatedAt}`,
    `Version: ${manifest.appVersion}`,
    '',
    'This folder contains store listing assets, metadata, privacy answers, QA checklists, and launch handoff docs.',
    '',
    'It does not contain signing secrets, signed archives, App Store Connect uploads, Google Play Console uploads, or completed installed-build evidence.',
    '',
    'Start with `docs/mobile-store-submission-package.md`, then fill a copied release evidence file from `docs/mobile-release-evidence-template.md` after signed builds are uploaded.',
    '',
  ].join('\n');

  await writeFile(path.join(outputRoot, 'README.md'), summary);

  execFileSync('zip', ['-qr', archivePath, '.'], {
    cwd: outputRoot,
    stdio: 'inherit',
  });

  console.log(`Packaged ${entries.length} files into ${path.relative(root, outputRoot)}`);
  console.log(`Created archive ${path.relative(root, archivePath)}`);
  console.log('Next: add signed store build ids and installed-build QA evidence after TestFlight/Play internal uploads.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
