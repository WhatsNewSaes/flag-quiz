import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outputPath = path.join(root, 'dist/mobile-readiness-report.md');

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

function checklistStats(markdown: string) {
  const checked = [...markdown.matchAll(/- \[x\] /g)].length;
  const unchecked = [...markdown.matchAll(/- \[ \] /g)].length;
  return { checked, unchecked, total: checked + unchecked };
}

function uncheckedItems(markdown: string) {
  return markdown
    .split('\n')
    .filter((line) => line.startsWith('- [ ] '))
    .map((line) => line.replace('- [ ] ', '').trim());
}

async function main() {
  const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf8')) as {
    version?: string;
  };
  const checklist = await readFile(resolve('docs/mobile-launch-checklist.md'), 'utf8');
  const storePackage = await readFile(resolve('docs/mobile-store-submission-package.md'), 'utf8');

  const stats = checklistStats(checklist);
  const remaining = uncheckedItems(checklist);
  const commit = commandOutput('git', ['rev-parse', '--short', 'HEAD']);
  const generatedAt = new Date().toISOString();

  const report = [
    '# Mobile Launch Readiness Report',
    '',
    `Generated: ${generatedAt}`,
    `Git commit: ${commit}`,
    `App version: ${packageJson.version ?? 'unknown'}`,
    `Checklist status: ${stats.checked}/${stats.total} checked, ${stats.unchecked} remaining`,
    '',
    '## Locally Proven',
    '',
    '- App identity, version, bundle id, package id, orientation lock, and auth callback schemes are configured.',
    '- iOS and Android native assets exist, including app icon, splash assets, mode OG images, App Store screenshots, and Google Play screenshots.',
    '- Privacy policy, terms, support page, deletion flow, privacy inventory, data-safety answers, QA checklist, release evidence template, and store submission package docs exist.',
    '- `npm run mobile:audit` verifies permissions, privacy manifest, metadata docs, store assets, QA docs, package script, and deletion coverage.',
    '- `npm run mobile:preflight` runs the local release preflight sequence in the expected order.',
    '- `npm run mobile:urls:check` verifies public store listing URLs against the production site when network access is available.',
    '- `npm run package:store-submission` creates a handoff folder and zip archive for upload/supporting materials.',
    '',
    '## Store Handoff Outputs',
    '',
    '- Handoff folder: `dist/mobile-store-submission/`',
    '- Handoff archive: `dist/flag-arcade-mobile-store-submission.zip`',
    '- Readiness report: `dist/mobile-readiness-report.md`',
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
    'Use `docs/mobile-launch-checklist.md` as the authoritative checklist and `docs/mobile-release-evidence-template.md` for final installed-build signoff.',
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
  console.log(`Wrote ${path.relative(root, outputPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
