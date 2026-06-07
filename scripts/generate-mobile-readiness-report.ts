import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outputPath = path.join(root, 'dist/mobile-readiness-report.md');
const blockerOutputPath = path.join(root, 'dist/mobile-launch-blockers.md');

export type ChecklistSection = {
  title: string;
  checked: number;
  unchecked: string[];
};

function resolve(...segments: string[]) {
  return path.join(root, ...segments);
}

function commandOutput(command: string, args: string[]) {
  try {
    return execFileSync(command, args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

export function checklistStats(markdown: string) {
  const checked = [...markdown.matchAll(/- \[x\] /g)].length;
  const unchecked = [...markdown.matchAll(/- \[ \] /g)].length;
  return { checked, unchecked, total: checked + unchecked };
}

export function uncheckedItems(markdown: string) {
  return markdown
    .split('\n')
    .filter((line) => line.startsWith('- [ ] '))
    .map((line) => line.replace('- [ ] ', '').trim());
}

export function checklistSections(markdown: string) {
  const sections: ChecklistSection[] = [];
  let current: ChecklistSection | null = null;

  for (const line of markdown.split('\n')) {
    const heading = line.match(/^## (.+)$/);
    if (heading) {
      current = { title: heading[1], checked: 0, unchecked: [] };
      sections.push(current);
      continue;
    }

    if (!current) continue;
    if (line.startsWith('- [x] ')) current.checked += 1;
    if (line.startsWith('- [ ] ')) current.unchecked.push(line.replace('- [ ] ', '').trim());
  }

  return sections.filter((section) => section.checked > 0 || section.unchecked.length > 0);
}

export function launchBlockerReport(params: {
  appVersion: string;
  commit: string;
  generatedAt: string;
  sections: ChecklistSection[];
}) {
  const blockerSections = params.sections.filter((section) => section.unchecked.length > 0);
  const blockerCount = blockerSections.reduce((total, section) => total + section.unchecked.length, 0);

  return [
    '# Mobile Launch Blockers',
    '',
    `Generated: ${params.generatedAt}`,
    `Git commit: ${params.commit}`,
    `App version: ${params.appVersion}`,
    `Open blocker count: ${blockerCount}`,
    '',
    'This file is generated from `docs/mobile-launch-checklist.md`. It is intentionally narrow: these are the remaining unchecked items preventing App Store and Google Play launch readiness.',
    '',
    ...blockerSections.flatMap((section) => [
      `## ${section.title}`,
      '',
      ...section.unchecked.map((item) => `- [ ] ${item}`),
      '',
    ]),
    '## Required To Close',
    '',
    '- Signed Android AAB and signed iOS App Store archive exist and pass `npm run mobile:artifacts:check`.',
    '- TestFlight and Google Play internal builds are uploaded, installed, and recorded in release evidence.',
    '- Installed-build smoke tests pass on the required iOS and Android targets.',
    '- App Store Connect privacy labels and Google Play Data Safety forms are submitted.',
    '- The completed release evidence file passes `npm run mobile:evidence:check` and `npm run mobile:go-live:check`.',
    '',
    '## Closeout Commands',
    '',
    'Run these after signing credentials, TestFlight, and Google Play internal testing are available:',
    '',
    '```bash',
    'npm run mobile:signing:preflight',
    'npm run mobile:build:android:release',
    'npm run mobile:evidence:init -- --build 1 --owner "Release Owner"',
    'npm run mobile:artifacts:check -- --android-aab android/app/build/outputs/bundle/release/app-release.aab --ios-archive ios/App/build/FlagArcade.xcarchive',
    'npm run mobile:evidence:check -- --file docs/release-evidence/<release-file>.md',
    'npm run mobile:urls:check',
    'npm run mobile:go-live:check -- --evidence docs/release-evidence/<release-file>.md --android-aab android/app/build/outputs/bundle/release/app-release.aab --ios-archive ios/App/build/FlagArcade.xcarchive',
    '```',
    '',
    'Evidence file pattern: `docs/release-evidence/mobile-<version>-build-<build>-<commit>.md`.',
    'Signed Android AAB path: `android/app/build/outputs/bundle/release/app-release.aab`.',
    'Signed iOS archive path: `ios/App/build/FlagArcade.xcarchive`.',
    '',
  ].join('\n');
}

async function main() {
  const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf8')) as {
    version?: string;
  };
  const checklist = await readFile(resolve('docs/mobile-launch-checklist.md'), 'utf8');
  const storePackage = await readFile(resolve('docs/mobile-store-submission-package.md'), 'utf8');

  const stats = checklistStats(checklist);
  const remaining = uncheckedItems(checklist);
  const sections = checklistSections(checklist);
  const commit = commandOutput('git', ['rev-parse', '--short', 'HEAD']);
  const generatedAt = new Date().toISOString();
  const appVersion = packageJson.version ?? 'unknown';

  const report = [
    '# Mobile Launch Readiness Report',
    '',
    `Generated: ${generatedAt}`,
    `Git commit: ${commit}`,
    `App version: ${appVersion}`,
    `Checklist status: ${stats.checked}/${stats.total} checked, ${stats.unchecked} remaining`,
    '',
    '## Locally Proven',
    '',
    '- App identity, version, bundle id, package id, orientation lock, and auth callback schemes are configured.',
    '- iOS and Android native assets exist, including app icon, splash assets, mode OG images, App Store screenshots, and Google Play screenshots.',
    '- Privacy policy, terms, support page, deletion flow, privacy inventory, data-safety answers, QA checklist, release evidence template, and store submission package docs exist.',
    '- `npm run mobile:audit` verifies permissions, privacy manifest, metadata docs, store assets, QA docs, package script, and deletion coverage.',
    '- `npm run mobile:version:check` verifies package, Android, iOS, store metadata, and handoff version/build fields match.',
    '- `npm run mobile:store:check` verifies store listing copy limits, asset dimensions, privacy references, and handoff paths.',
    '- `npm run mobile:qa:plan` verifies the installed-build QA plan covers required devices, game modes, native behaviors, and release evidence workflow.',
    '- `npm run mobile:preflight` runs the local release preflight sequence in the expected order.',
    '- `.github/workflows/mobile-preflight.yml` runs the unsigned mobile preflight in CI and uploads the generated store submission package.',
    '- `npm run mobile:urls:check` verifies public store listing URLs against the production site when network access is available.',
    '- `npm run mobile:evidence:init` creates a release-candidate evidence file with the current version, build, branch, and commit prefilled.',
    '- `npm run mobile:evidence:check` fails completed release evidence files that still contain missing QA, upload, store-console, or signoff fields.',
    '- `npm run mobile:artifacts:check` verifies signed Android AAB and iOS `.xcarchive` paths when release artifacts exist locally.',
    '- `npm run mobile:blockers:check` verifies the generated launch blocker report still matches the unchecked launch checklist items.',
    '- `npm run mobile:handoff:check` verifies the generated store handoff manifest, SHA-256 checksums, byte counts, and ZIP contents.',
    '- `npm run mobile:go-live:check` composes preflight, release evidence validation, and public URL checks into the final local review gate.',
    '- `npm run package:store-submission` creates a handoff folder and zip archive for upload/supporting materials.',
    '',
    '## Store Handoff Outputs',
    '',
    '- Handoff folder: `dist/mobile-store-submission/`',
    '- Handoff archive: `dist/flag-arcade-mobile-store-submission.zip`',
    '- Readiness report: `dist/mobile-readiness-report.md`',
    '- Launch blocker report: `dist/mobile-launch-blockers.md`',
    '- Store package source: `docs/mobile-store-submission-package.md`',
    '',
    '## Remaining External Requirements',
    '',
    ...remaining.map((item) => `- ${item}`),
    '',
    '## Launch Decision',
    '',
    'The repo is locally prepared for mobile launch handoff, but the release is not App Store / Google Play ready until the remaining external requirements above are completed and recorded in a copied release evidence file.',
    '',
    '## Source Checklist',
    '',
    'Use `docs/mobile-launch-checklist.md` as the authoritative checklist, `npm run mobile:evidence:init` to start final installed-build signoff, `npm run mobile:evidence:check` to verify the filled evidence file, and `npm run mobile:go-live:check` before final store review submission.',
    'Run `npm run mobile:preflight` before creating signed release builds or refreshing the handoff archive.',
    '',
    '## Store Package Notes',
    '',
    storePackage.includes('dist/flag-arcade-mobile-store-submission.zip')
      ? '- Store submission package documents the zip archive output.'
      : '- Store submission package does not document the zip archive output.',
    '',
  ].join('\n');

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, report);
  await writeFile(blockerOutputPath, launchBlockerReport({
    appVersion,
    commit,
    generatedAt,
    sections,
  }));
  console.log(`Wrote ${path.relative(root, outputPath)}`);
  console.log(`Wrote ${path.relative(root, blockerOutputPath)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
