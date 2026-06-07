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
  const qaPath = resolve('docs/mobile-installed-build-qa.md');
  const evidenceTemplatePath = resolve('docs/mobile-release-evidence-template.md');
  const runbookPath = resolve('docs/mobile-release-runbook.md');

  expect(existsSync(qaPath), 'Installed-build QA checklist exists', path.relative(root, qaPath));
  expect(existsSync(evidenceTemplatePath), 'Release evidence template exists', path.relative(root, evidenceTemplatePath));
  expect(existsSync(runbookPath), 'Mobile release runbook exists', path.relative(root, runbookPath));

  if (!existsSync(qaPath) || !existsSync(evidenceTemplatePath) || !existsSync(runbookPath)) {
    throw new Error('Mobile QA plan docs are missing.');
  }

  const qa = await readFile(qaPath, 'utf8');
  const evidenceTemplate = await readFile(evidenceTemplatePath, 'utf8');
  const runbook = await readFile(runbookPath, 'utf8');

  includesAll(qa, 'Installed-build QA device matrix', [
    'Physical iPhone',
    'Small-screen iPhone simulator or device',
    'Physical Android phone',
    'Large Android emulator or device',
  ]);

  includesAll(qa, 'Installed-build QA smoke tests', [
    'Fresh launch',
    'Home screen icon',
    'Orientation',
    'Journey Mode',
    'Perfect Passport',
    'Perfect Passport share',
    'Flag Jeopardy Easy',
    'Flag Jeopardy Type',
    'Arcade Mode',
    'Around the World',
    'Flag Runner',
    'Native back',
    'Auth callback',
    'Offline launch',
    'Poor network',
    'Resume/background',
    'Legal links',
  ]);

  includesAll(qa, 'Installed-build QA platform expectations', [
    'TestFlight',
    'Play internal test',
    'public `https://flagarcade.com` challenge link',
    'Android only: enter each game mode and press system back',
    'com.flagarcade.app://auth/callback',
  ]);

  includesAll(qa, 'Installed-build QA evidence workflow', [
    'npm run mobile:evidence:init',
    'docs/release-evidence/',
    'npm run mobile:evidence:check',
  ]);

  includesAll(evidenceTemplate, 'Release evidence template installed matrix', [
    'Physical iPhone',
    'Small-screen iPhone simulator or device',
    'Physical Android phone',
    'Large Android emulator or device',
  ]);

  includesAll(evidenceTemplate, 'Release evidence template final signoff', [
    'iOS installed build smoke passed',
    'Android installed build smoke passed',
    'Store privacy forms submitted',
    'Signed release artifacts uploaded',
    'Known launch risks accepted',
  ]);

  includesAll(runbook, 'Release runbook installed-build flow', [
    'docs/mobile-installed-build-qa.md',
    'TestFlight',
    'Play internal testing',
    'npm run mobile:evidence:check',
    'npm run mobile:go-live:check',
  ]);

  const failed = findings.filter((finding) => !finding.ok);
  for (const finding of findings) {
    const prefix = finding.ok ? 'PASS' : 'FAIL';
    console.log(`${prefix} ${finding.label}${finding.detail ? ` (${finding.detail})` : ''}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} installed-build QA plan check(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${findings.length} installed-build QA plan checks passed.`);
  console.log('Next: run this checklist from TestFlight and Google Play internal testing builds, then record results in release evidence.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
