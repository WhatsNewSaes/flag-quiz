import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

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

function includesAll(markdown: string, label: string, required: string[]) {
  for (const item of required) {
    expect(markdown.includes(item), `${label} includes ${item}`);
  }
}

async function main() {
  const coveragePath = resolve('docs/mobile-local-device-coverage.md');
  const launchChecklistPath = resolve('docs/mobile-launch-checklist.md');
  const installedQaPath = resolve('docs/mobile-installed-build-qa.md');

  expect(existsSync(coveragePath), 'Local device coverage checklist exists', path.relative(root, coveragePath));
  expect(existsSync(launchChecklistPath), 'Mobile launch checklist exists', path.relative(root, launchChecklistPath));
  expect(existsSync(installedQaPath), 'Installed-build QA checklist exists', path.relative(root, installedQaPath));

  if (!existsSync(coveragePath) || !existsSync(launchChecklistPath) || !existsSync(installedQaPath)) {
    throw new Error('Mobile device coverage docs are missing.');
  }

  const coverage = await readFile(coveragePath, 'utf8');
  const launchChecklist = await readFile(launchChecklistPath, 'utf8');
  const installedQa = await readFile(installedQaPath, 'utf8');

  includesAll(coverage, 'Local device targets', [
    'iPhone SE or smallest available iPhone simulator',
    'Latest available iPhone simulator',
    'FlagArcade_Pixel_8_API_36',
    'Large Android emulator or device',
  ]);

  includesAll(coverage, 'Local game mode coverage', [
    'Game Modes',
    'Journey Mode',
    'Perfect Passport',
    'Flag Jeopardy Easy',
    'Flag Jeopardy Type',
    'Arcade Mode',
    'Around the World',
    'Flag Runner',
    'Native back',
    'Offline launch',
    'Poor network',
  ]);

  includesAll(coverage, 'Local evidence guidance', [
    'docs/release-evidence/local-device/',
    'platform, target, route, and date',
    'TestFlight and Play internal testing',
    'not the final store gate',
  ]);

  includesAll(launchChecklist, 'Launch checklist keeps final device blockers explicit', [
    'Physical iPhone test',
    'Physical Android test',
    'Small-screen iPhone simulator test',
    'Large-screen Android test',
  ]);

  includesAll(installedQa, 'Installed-build QA remains the final store gate', [
    'TestFlight',
    'Play internal test',
    'Physical iPhone',
    'Physical Android phone',
    'Small-screen iPhone simulator or device',
    'Large Android emulator or device',
  ]);

  const failed = findings.filter((finding) => !finding.ok);
  for (const finding of findings) {
    const prefix = finding.ok ? 'PASS' : 'FAIL';
    console.log(`${prefix} ${finding.label}${finding.detail ? ` (${finding.detail})` : ''}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} local device coverage check(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${findings.length} local device coverage checks passed.`);
  console.log('Next: capture simulator/emulator screenshots or clips, then complete final installed-build QA from TestFlight and Play internal testing.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
