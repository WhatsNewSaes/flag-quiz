import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { checklistSections, launchBlockerReport } from './generate-mobile-readiness-report';

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

function normalizeGeneratedFields(markdown: string) {
  return markdown
    .replace(/^Generated: .+$/m, 'Generated: <generated>')
    .replace(/^Git commit: .+$/m, 'Git commit: <commit>');
}

function currentCommit() {
  return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function fieldValue(markdown: string, label: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = markdown.match(new RegExp(`^${escapedLabel}:\\s*(.+)$`, 'm'));
  return match?.[1]?.trim();
}

async function main() {
  const checklistPath = resolve('docs/mobile-launch-checklist.md');
  const blockerReportPath = resolve('dist/mobile-launch-blockers.md');
  const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf8')) as {
    version?: string;
  };

  expect(existsSync(checklistPath), 'Mobile launch checklist exists', path.relative(root, checklistPath));
  expect(existsSync(blockerReportPath), 'Generated launch blocker report exists', path.relative(root, blockerReportPath));
  if (!existsSync(checklistPath) || !existsSync(blockerReportPath)) {
    throw new Error('Run npm run mobile:readiness before checking launch blockers.');
  }

  const checklist = await readFile(checklistPath, 'utf8');
  const actual = await readFile(blockerReportPath, 'utf8');
  const expectedCommit = currentCommit();
  const actualCommit = fieldValue(actual, 'Git commit');
  const sections = checklistSections(checklist);
  const openBlockerCount = sections.reduce((total, section) => total + section.unchecked.length, 0);
  const expected = launchBlockerReport({
    appVersion: packageJson.version ?? 'unknown',
    commit: '<commit>',
    generatedAt: '<generated>',
    sections,
  });

  expect(actual.includes('# Mobile Launch Blockers'), 'Launch blocker report has title');
  expect(
    actualCommit === expectedCommit,
    'Launch blocker report was generated for current git commit',
    actualCommit === expectedCommit
      ? expectedCommit
      : actualCommit
        ? `found ${actualCommit}, expected ${expectedCommit}; run npm run mobile:readiness`
        : `missing Git commit, expected ${expectedCommit}; run npm run mobile:readiness`
  );
  expect(fieldValue(actual, 'App version') === packageJson.version, 'Launch blocker report app version matches package.json', packageJson.version);
  expect(actual.includes(`Open blocker count: ${openBlockerCount}`), 'Launch blocker report has current open blocker count', `${openBlockerCount}`);
  expect(openBlockerCount > 0, 'Launch blocker report still reflects incomplete external launch requirements', `${openBlockerCount} open`);
  expect(
    normalizeGeneratedFields(actual) === expected,
    'Launch blocker report matches unchecked checklist items'
  );

  const requiredCloseItems = [
    'Signed Android AAB and signed iOS App Store archive exist and pass `npm run mobile:artifacts:check`, with a release artifact manifest saved in the evidence file.',
    'TestFlight and Google Play internal builds are uploaded, installed, and recorded in release evidence.',
    'Installed-build smoke tests pass on the required iOS and Android targets.',
    'App Store Connect privacy labels and Google Play Data Safety forms are submitted.',
    'The completed release evidence file passes `npm run mobile:evidence:check` and `npm run mobile:go-live:check`.',
  ];
  for (const item of requiredCloseItems) {
    expect(actual.includes(item), `Launch blocker report includes close requirement: ${item}`);
  }

  const requiredCloseoutTerms = [
    '## Closeout Commands',
    'npm run mobile:signing:release',
    'npm run mobile:build:android:release',
    'npm run mobile:build:ios:archive',
    'npm run mobile:evidence:init -- --build 1 --owner "Release Owner"',
    'npm run mobile:artifacts:check -- --android-aab android/app/build/outputs/bundle/release/app-release.aab --ios-archive ios/App/build/FlagArcade.xcarchive --manifest docs/release-evidence/mobile-<version>-build-<build>-<commit>-artifacts.json',
    'npm run mobile:evidence:check -- --file docs/release-evidence/<release-file>.md',
    'npm run mobile:urls:check',
    'npm run mobile:go-live:check -- --evidence docs/release-evidence/<release-file>.md --android-aab android/app/build/outputs/bundle/release/app-release.aab --ios-archive ios/App/build/FlagArcade.xcarchive',
    'docs/release-evidence/mobile-<version>-build-<build>-<commit>.md',
    'android/app/build/outputs/bundle/release/app-release.aab',
    'ios/App/build/FlagArcade.xcarchive',
  ];
  for (const term of requiredCloseoutTerms) {
    expect(actual.includes(term), `Launch blocker report includes closeout term: ${term}`);
  }

  const failed = findings.filter((finding) => !finding.ok);
  for (const finding of findings) {
    const prefix = finding.ok ? 'PASS' : 'FAIL';
    console.log(`${prefix} ${finding.label}${finding.detail ? ` (${finding.detail})` : ''}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} launch blocker check(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${findings.length} launch blocker checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
