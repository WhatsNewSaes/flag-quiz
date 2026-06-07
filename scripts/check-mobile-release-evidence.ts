import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

type Finding = {
  label: string;
  ok: boolean;
  detail?: string;
};

type Args = {
  file?: string;
  selfTest: boolean;
};

const requiredReleaseFields = [
  'App version',
  'Build number / version code',
  'Git commit',
  'Release branch',
  'Evidence owner',
  'Evidence date',
  'Public site URL verified',
  'Privacy URL verified',
  'Terms URL verified',
  'Support URL verified',
];

const requiredSignoffFields = [
  'iOS installed build smoke passed',
  'Android installed build smoke passed',
  'Store privacy forms submitted',
  'Signed release artifacts uploaded',
  'Known launch risks accepted',
  'Release approver',
  'Approval date',
];

const incompleteValues = new Set([
  '',
  'tbd',
  'todo',
  'pending',
  'pending - run `npm run mobile:urls:check`',
  'not run',
  'not uploaded',
  'not complete',
  'not verified',
  'fail',
  'failed',
]);

function parseArgs(argv: string[]): Args {
  const args: Args = { selfTest: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--self-test') {
      args.selfTest = true;
      continue;
    }

    if ((arg === '--file' || arg === '-f') && next) {
      args.file = next;
      index += 1;
      continue;
    }

    if (!arg.startsWith('-') && !args.file) {
      args.file = arg;
      continue;
    }

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  return args;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isFilled(value: string) {
  const normalized = normalize(value);
  if (incompleteValues.has(normalized)) return false;
  if (normalized.startsWith('pending')) return false;
  return true;
}

function pass(findings: Finding[], label: string, detail?: string) {
  findings.push({ label, ok: true, detail });
}

function fail(findings: Finding[], label: string, detail?: string) {
  findings.push({ label, ok: false, detail });
}

function fieldValue(markdown: string, label: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = markdown.match(new RegExp(`^- ${escapedLabel}:[ \\t]*(.*)$`, 'm'));
  return match?.[1]?.trim();
}

function tableRows(markdown: string) {
  return markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && line.endsWith('|'))
    .filter((line) => !line.includes('---'))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length > 0);
}

function validateEvidence(markdown: string) {
  const findings: Finding[] = [];

  for (const label of requiredReleaseFields) {
    const value = fieldValue(markdown, label);
    if (value && isFilled(value)) pass(findings, `${label} is filled`, value);
    else fail(findings, `${label} is filled`, value ? `Current value: ${value}` : 'Missing field');
  }

  const rows = tableRows(markdown);
  let checkedResultCells = 0;

  for (const row of rows) {
    const joined = row.join(' | ');
    const isHeader = row.some((cell) => [
      'Platform',
      'Area',
      'Store',
      'Date',
    ].includes(cell));
    if (isHeader) continue;

    const isEmptyFailureLogRow = row.every((cell) => cell === '');
    if (isEmptyFailureLogRow) continue;

    for (const cell of row) {
      const normalized = normalize(cell);
      if (['not run', 'not uploaded', 'not complete', 'not verified', 'fail', 'failed'].includes(normalized)) {
        fail(findings, 'Evidence table has no blocking status', `${cell} in row: ${joined}`);
      }
    }

    if (row.some((cell) => ['Pass', 'Complete', 'Uploaded', 'Verified'].includes(cell))) {
      checkedResultCells += 1;
    }
  }

  if (checkedResultCells > 0) pass(findings, 'Evidence tables include completed result cells', `${checkedResultCells} completed cells`);
  else fail(findings, 'Evidence tables include completed result cells', 'No Pass/Complete/Uploaded/Verified cells found');

  for (const label of requiredSignoffFields) {
    const value = fieldValue(markdown, label);
    if (value && isFilled(value)) pass(findings, `${label} is signed off`, value);
    else fail(findings, `${label} is signed off`, value ? `Current value: ${value}` : 'Missing field');
  }

  return findings;
}

function selfTestEvidence() {
  return `# Mobile Release Evidence

## Release Candidate

- App version: 1.0.0
- Build number / version code: 1
- Git commit: abc1234
- Release branch: main
- Evidence owner: QA
- Evidence date: 2026-06-07
- Public site URL verified: Pass
- Privacy URL verified: Pass
- Terms URL verified: Pass
- Support URL verified: Pass

## Build Artifacts

| Platform | Store channel | Artifact | Uploaded by | Upload date | Processing status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| iOS | TestFlight | ASC build 1 | QA | 2026-06-07 | Uploaded |  |
| Android | Play internal test | app-release.aab | QA | 2026-06-07 | Uploaded |  |

## Signing Evidence

| Platform | Signing identity | Team/account id | Profile/keystore | Verified by | Result |
| --- | --- | --- | --- | --- | --- |
| iOS | Apple Distribution | TEAMID | App Store distribution profile | QA | Verified |
| Android | Upload key | Play account | Upload keystore outside git | QA | Verified |

## Installed Build Matrix

| Platform | Build source | Device | OS version | App build shown | Tester | Date | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| iOS | TestFlight | Physical iPhone | iOS 19 | 1 | QA | 2026-06-07 | Pass |
| iOS | TestFlight | Small-screen iPhone simulator or device | iOS 19 | 1 | QA | 2026-06-07 | Pass |
| Android | Play internal test | Physical Android phone | Android 16 | 1 | QA | 2026-06-07 | Pass |
| Android | Play internal test | Large Android emulator or device | Android 16 | 1 | QA | 2026-06-07 | Pass |

## Required Smoke Evidence

| Area | iOS result | Android result | Evidence file/link | Notes |
| --- | --- | --- | --- | --- |
| Fresh launch and splash | Pass | Pass | screenshots |  |
| Android native back behavior | N/A | Pass | clip |  |

## Store Console Evidence

| Store | Area | Status | Evidence file/link | Notes |
| --- | --- | --- | --- | --- |
| App Store Connect | App information | Complete | screenshot |  |
| Google Play Console | Data Safety | Complete | screenshot |  |

## Failure Log

| Date | Platform | Device | Area | Issue | Severity | Owner | Fix commit | Retest result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |

## Final Signoff

- iOS installed build smoke passed: Yes
- Android installed build smoke passed: Yes
- Store privacy forms submitted: Yes
- Signed release artifacts uploaded: Yes
- Known launch risks accepted: Yes
- Release approver: QA Lead
- Approval date: 2026-06-07
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.selfTest && !args.file) {
    throw new Error('Usage: npm run mobile:evidence:check -- --file docs/release-evidence/<file>.md');
  }

  const markdown = args.selfTest
    ? selfTestEvidence()
    : await readFile(path.resolve(root, args.file ?? ''), 'utf8');

  const findings = validateEvidence(markdown);
  const failed = findings.filter((finding) => !finding.ok);

  for (const finding of findings) {
    const prefix = finding.ok ? 'PASS' : 'FAIL';
    console.log(`${prefix} ${finding.label}${finding.detail ? ` (${finding.detail})` : ''}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} release evidence check(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${findings.length} release evidence checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
