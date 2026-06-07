import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

type ManifestEntry = {
  source: string;
  destination: string;
  bytes: number;
  sha256: string;
};

type Manifest = {
  packageName: string;
  generatedAt: string;
  appVersion: string;
  outputPath: string;
  archivePath: string;
  includedFiles: ManifestEntry[];
  externalRequired: string[];
};

type Finding = {
  label: string;
  ok: boolean;
  detail?: string;
};

const root = process.cwd();
const findings: Finding[] = [];

function resolve(...segments: string[]) {
  return path.join(root, ...segments);
}

function pass(label: string, detail?: string) {
  findings.push({ label, ok: true, detail });
}

function fail(label: string, detail?: string) {
  findings.push({ label, ok: false, detail });
}

function expect(condition: boolean, label: string, detail?: string) {
  if (condition) pass(label, detail);
  else fail(label, detail);
}

function sha256(buffer: Buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function listZipEntries(filePath: string) {
  try {
    return execFileSync('unzip', ['-Z1', filePath], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).split('\n').map((line) => line.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

async function readManifest(manifestPath: string) {
  const manifestJson = await readFile(manifestPath, 'utf8');
  return JSON.parse(manifestJson) as Manifest;
}

async function checkManifestEntries(manifest: Manifest, zipEntries: Set<string>) {
  const destinations = new Set<string>();

  for (const entry of manifest.includedFiles) {
    expect(Boolean(entry.source), `Manifest entry has source for ${entry.destination || 'unknown'}`);
    expect(Boolean(entry.destination), `Manifest entry has destination for ${entry.source || 'unknown'}`);
    expect(Number.isInteger(entry.bytes) && entry.bytes > 0, `Manifest entry has byte count for ${entry.destination}`, `${entry.bytes}`);
    expect(/^[a-f0-9]{64}$/.test(entry.sha256), `Manifest entry has SHA-256 for ${entry.destination}`, entry.sha256);
    expect(!destinations.has(entry.destination), `Manifest destination is unique: ${entry.destination}`);
    destinations.add(entry.destination);

    const packagedFilePath = resolve(manifest.outputPath, entry.destination);
    const exists = existsSync(packagedFilePath);
    expect(exists, `Packaged file exists: ${entry.destination}`);
    if (!exists) continue;

    const stats = statSync(packagedFilePath);
    expect(stats.isFile(), `Packaged path is a file: ${entry.destination}`);
    expect(stats.size === entry.bytes, `Packaged file byte count matches manifest: ${entry.destination}`, `${stats.size}/${entry.bytes}`);

    const fileBuffer = await readFile(packagedFilePath);
    expect(sha256(fileBuffer) === entry.sha256, `Packaged file SHA-256 matches manifest: ${entry.destination}`);
    expect(zipEntries.has(entry.destination), `Archive includes packaged file: ${entry.destination}`);
  }
}

async function main() {
  const manifestPath = resolve('dist/mobile-store-submission/manifest.json');
  const manifestExists = existsSync(manifestPath);
  expect(manifestExists, 'Store handoff manifest exists', path.relative(root, manifestPath));
  if (!manifestExists) {
    throw new Error('Run npm run package:store-submission before checking the handoff package.');
  }

  const manifest = await readManifest(manifestPath);
  expect(manifest.packageName === 'Flag Arcade mobile store submission package', 'Manifest package name matches Flag Arcade');
  expect(Boolean(Date.parse(manifest.generatedAt)), 'Manifest generatedAt is parseable', manifest.generatedAt);
  expect(manifest.appVersion === '1.0.0', 'Manifest appVersion is 1.0.0', manifest.appVersion);
  expect(manifest.outputPath === 'dist/mobile-store-submission', 'Manifest output path is dist/mobile-store-submission', manifest.outputPath);
  expect(manifest.archivePath === 'dist/flag-arcade-mobile-store-submission.zip', 'Manifest archive path is dist/flag-arcade-mobile-store-submission.zip', manifest.archivePath);
  expect(Array.isArray(manifest.includedFiles) && manifest.includedFiles.length >= 24, 'Manifest includes expected handoff files', `${manifest.includedFiles?.length ?? 0} files`);

  const archivePath = resolve(manifest.archivePath);
  const archiveExists = existsSync(archivePath);
  expect(archiveExists, 'Store handoff archive exists', manifest.archivePath);
  if (!archiveExists) {
    throw new Error('Run npm run package:store-submission before checking the handoff archive.');
  }
  const archiveStats = statSync(archivePath);
  expect(archiveStats.isFile(), 'Store handoff archive path is a file', manifest.archivePath);
  expect(archiveStats.size > 0, 'Store handoff archive is not empty', `${archiveStats.size} bytes`);

  const zipEntryList = listZipEntries(archivePath);
  const zipEntries = new Set(zipEntryList);
  expect(zipEntryList.length > 0, 'Store handoff archive is readable as zip', `${zipEntryList.length} entries`);
  expect(zipEntries.has('manifest.json'), 'Store handoff archive includes manifest.json');
  expect(zipEntries.has('README.md'), 'Store handoff archive includes README.md');
  expect(zipEntries.has('mobile-launch-blockers.md'), 'Store handoff archive includes mobile-launch-blockers.md');

  await checkManifestEntries(manifest, zipEntries);

  const requiredExternalItems = [
    'Signed iOS archive uploaded to TestFlight',
    'Signed Android AAB uploaded to Google Play internal testing',
    'App Store privacy labels submitted',
    'Google Play Data Safety form submitted',
    'Installed-build smoke evidence completed for both platforms',
    'Final developer account, signing team, and copyright holder confirmed',
  ];
  for (const item of requiredExternalItems) {
    expect(manifest.externalRequired.includes(item), `Manifest keeps external blocker visible: ${item}`);
  }

  const failed = findings.filter((finding) => !finding.ok);
  for (const finding of findings) {
    const prefix = finding.ok ? 'PASS' : 'FAIL';
    console.log(`${prefix} ${finding.label}${finding.detail ? ` (${finding.detail})` : ''}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} store handoff check(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${findings.length} store handoff checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
