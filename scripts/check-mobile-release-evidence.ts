import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = process.cwd();
const selfTestDirectories: string[] = [];

type Finding = {
  label: string;
  ok: boolean;
  detail?: string;
};

type Args = {
  file?: string;
  selfTest: boolean;
  selfTestFailures: boolean;
};

type ReleaseContext = {
  appVersion: string;
  buildNumber: string;
  gitCommit: string;
};

type ArtifactManifest = {
  generatedAt?: string;
  gitCommit?: string;
  appVersion?: string;
  buildNumber?: string;
  artifacts?: Array<{
    platform?: string;
    kind?: string;
    path?: string;
    bytes?: number;
    sha256?: string;
    files?: Array<{
      path?: string;
      bytes?: number;
      sha256?: string;
    }>;
  }>;
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
  'Artifact manifest',
];

const requiredCompleteSignoffFields = [
  'iOS installed build smoke passed',
  'Android installed build smoke passed',
  'Store privacy forms submitted',
  'Signed release artifacts uploaded',
  'Known launch risks accepted',
];

const requiredFilledSignoffFields = [
  'Release approver',
  'Approval date',
];

const requiredUrlVerificationFields = [
  'Public site URL verified',
  'Privacy URL verified',
  'Terms URL verified',
  'Support URL verified',
];

const requiredBuildArtifactRows = [
  { platform: 'iOS', storeChannel: 'TestFlight' },
  { platform: 'Android', storeChannel: 'Play internal test' },
];

const requiredSigningRows = [
  { platform: 'iOS' },
  { platform: 'Android' },
];

const requiredInstalledBuildRows = [
  { platform: 'iOS', buildSource: 'TestFlight', device: 'Physical iPhone' },
  { platform: 'iOS', buildSource: 'TestFlight', device: 'Small-screen iPhone simulator or device' },
  { platform: 'Android', buildSource: 'Play internal test', device: 'Physical Android phone' },
  { platform: 'Android', buildSource: 'Play internal test', device: 'Large Android emulator or device' },
];

const requiredSmokeRows = [
  { area: 'Fresh launch and splash', ios: 'Pass', android: 'Pass' },
  { area: 'Home screen icon on light/dark wallpaper', ios: 'Pass', android: 'Pass' },
  { area: 'Portrait orientation lock', ios: 'Pass', android: 'Pass' },
  { area: 'Journey Mode first-run character/favorite flag flow', ios: 'Pass', android: 'Pass' },
  { area: 'Journey Mode level play and progress persistence', ios: 'Pass', android: 'Pass' },
  { area: 'Perfect Passport full 10-question run', ios: 'Pass', android: 'Pass' },
  { area: 'Perfect Passport share sheet', ios: 'Pass', android: 'Pass' },
  { area: 'Perfect Passport copied public challenge link', ios: 'Pass', android: 'Pass' },
  { area: 'Flag Jeopardy Easy mode, pick name and pick flag', ios: 'Pass', android: 'Pass' },
  { area: 'Flag Jeopardy Type mode, keyboard and answer submit', ios: 'Pass', android: 'Pass' },
  { area: 'Arcade Mode custom quiz', ios: 'Pass', android: 'Pass' },
  { area: 'Around the World map/tap flow', ios: 'Pass', android: 'Pass' },
  { area: 'Flag Runner touch controls and restart', ios: 'Pass', android: 'Pass' },
  { area: 'Android native back behavior', ios: 'N/A', android: 'Pass' },
  { area: 'Auth callback/deep link', ios: 'Pass', android: 'Pass' },
  { area: 'Offline launch', ios: 'Pass', android: 'Pass' },
  { area: 'Poor-network gameplay', ios: 'Pass', android: 'Pass' },
  { area: 'Resume/background state', ios: 'Pass', android: 'Pass' },
  { area: 'Privacy, Terms, and Support links', ios: 'Pass', android: 'Pass' },
];

const requiredStoreConsoleRows = [
  { store: 'App Store Connect', area: 'App information' },
  { store: 'App Store Connect', area: 'Pricing/availability' },
  { store: 'App Store Connect', area: 'Age rating' },
  { store: 'App Store Connect', area: 'App Privacy labels' },
  { store: 'App Store Connect', area: 'TestFlight build processing' },
  { store: 'Google Play Console', area: 'Store listing' },
  { store: 'Google Play Console', area: 'Content rating' },
  { store: 'Google Play Console', area: 'Data Safety' },
  { store: 'Google Play Console', area: 'Internal testing track' },
  { store: 'Google Play Console', area: 'Pre-launch report' },
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
  const args: Args = { selfTest: false, selfTestFailures: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--self-test') {
      args.selfTest = true;
      continue;
    }

    if (arg === '--self-test-failures') {
      args.selfTestFailures = true;
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

function commandOutput(command: string, args: string[]) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function matchFirst(text: string, pattern: RegExp, label: string) {
  const match = text.match(pattern);
  if (!match?.[1]) throw new Error(`Could not find ${label}.`);
  return match[1].trim();
}

async function currentReleaseContext(): Promise<ReleaseContext> {
  const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')) as { version?: string };
  const androidBuildGradle = await readFile(path.join(root, 'android/app/build.gradle'), 'utf8');
  const iosProject = await readFile(path.join(root, 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8');

  const appVersion = packageJson.version;
  if (!appVersion) throw new Error('package.json version is missing.');

  const androidVersionCode = matchFirst(androidBuildGradle, /versionCode\s+(\d+)/, 'Android versionCode');
  const iosBuildNumbers = [...iosProject.matchAll(/CURRENT_PROJECT_VERSION = ([^;]+);/g)]
    .map((match) => match[1].trim());
  const uniqueIosBuildNumbers = [...new Set(iosBuildNumbers)];

  if (uniqueIosBuildNumbers.length !== 1) {
    throw new Error(`Expected exactly one iOS build number, found: ${uniqueIosBuildNumbers.join(', ') || 'none'}`);
  }

  if (androidVersionCode !== uniqueIosBuildNumbers[0]) {
    throw new Error(`Android versionCode (${androidVersionCode}) does not match iOS build number (${uniqueIosBuildNumbers[0]}).`);
  }

  return {
    appVersion,
    buildNumber: androidVersionCode,
    gitCommit: commandOutput('git', ['rev-parse', '--short', 'HEAD']),
  };
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

function sectionMarkdown(markdown: string, heading: string) {
  const lines = markdown.split('\n');
  const startIndex = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (startIndex === -1) return '';

  const sectionLines: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith('## ')) break;
    sectionLines.push(lines[index]);
  }

  return sectionLines.join('\n');
}

function tableRowsForSection(markdown: string, heading: string) {
  return tableRows(sectionMarkdown(markdown, heading));
}

function isPassLike(value: string) {
  return ['pass', 'yes'].includes(normalize(value));
}

function isCompleteLike(value: string) {
  return ['complete', 'uploaded', 'verified', 'pass', 'yes'].includes(normalize(value));
}

function requirePass(findings: Finding[], label: string, value: string | undefined) {
  if (value && isPassLike(value)) pass(findings, label, value);
  else fail(findings, label, value ? `Current value: ${value}` : 'Missing value');
}

function requireComplete(findings: Finding[], label: string, value: string | undefined) {
  if (value && isCompleteLike(value)) pass(findings, label, value);
  else fail(findings, label, value ? `Current value: ${value}` : 'Missing value');
}

function requireEqual(findings: Finding[], label: string, value: string | undefined, expected: string) {
  if (value === expected) pass(findings, label, value);
  else fail(findings, label, value ? `Expected ${expected}, got ${value}` : `Missing value, expected ${expected}`);
}

function isIsoDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function requireIsoDate(findings: Finding[], label: string, value: string | undefined) {
  if (isIsoDate(value)) pass(findings, label, value);
  else fail(findings, label, value ? `Expected YYYY-MM-DD, got ${value}` : 'Missing value');
}

function evidenceTarget(value: string) {
  const trimmed = value.trim();
  const markdownLink = trimmed.match(/^\[[^\]]+\]\(([^)]+)\)$/);
  return (markdownLink?.[1] ?? trimmed).trim();
}

function isExternalEvidenceTarget(target: string) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(target);
}

function requireEvidenceLink(findings: Finding[], label: string, value: string | undefined) {
  if (!value || !isFilled(value)) {
    fail(findings, label, value ? `Current value: ${value}` : 'Missing value');
    return;
  }

  const target = evidenceTarget(value);
  if (!target || target.startsWith('#') || target.includes('<release-file>')) {
    fail(findings, label, `Placeholder target: ${value}`);
    return;
  }

  if (isExternalEvidenceTarget(target)) {
    pass(findings, label, target);
    return;
  }

  const localPath = target.split('#')[0];
  const absolutePath = path.resolve(root, localPath);
  if (existsSync(absolutePath)) pass(findings, label, localPath);
  else fail(findings, label, `Local evidence file does not exist: ${localPath}`);
}

function isSha256(value: unknown) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
}

function requireArtifactManifest(findings: Finding[], value: string | undefined, context: ReleaseContext) {
  requireEvidenceLink(findings, 'Artifact manifest evidence link is valid', value);
  if (!value || !isFilled(value)) return;

  const target = evidenceTarget(value);
  if (!target || target.startsWith('#') || target.includes('<release-file>')) {
    return;
  }

  if (isExternalEvidenceTarget(target)) {
    fail(findings, 'Artifact manifest is local JSON path', `External artifact manifest is not parsed: ${target}`);
    return;
  }
  pass(findings, 'Artifact manifest is local JSON path', target);

  const localPath = target.split('#')[0];
  const absolutePath = path.resolve(root, localPath);
  if (!existsSync(absolutePath)) return;

  let manifest: ArtifactManifest;
  try {
    manifest = JSON.parse(readFileSync(absolutePath, 'utf8')) as ArtifactManifest;
    pass(findings, 'Artifact manifest JSON can be parsed', localPath);
  } catch {
    fail(findings, 'Artifact manifest JSON can be parsed', localPath);
    return;
  }

  if (manifest.generatedAt && !Number.isNaN(Date.parse(manifest.generatedAt))) {
    pass(findings, 'Artifact manifest generatedAt is parseable', manifest.generatedAt);
  } else {
    fail(findings, 'Artifact manifest generatedAt is parseable', manifest.generatedAt ?? 'Missing value');
  }

  requireEqual(findings, 'Artifact manifest git commit matches release evidence', manifest.gitCommit, context.gitCommit);
  requireEqual(findings, 'Artifact manifest app version matches release evidence', manifest.appVersion, context.appVersion);
  requireEqual(findings, 'Artifact manifest build number matches release evidence', manifest.buildNumber, context.buildNumber);

  const artifacts = Array.isArray(manifest.artifacts) ? manifest.artifacts : [];
  if (artifacts.length > 0) pass(findings, 'Artifact manifest includes artifacts', `${artifacts.length} artifacts`);
  else fail(findings, 'Artifact manifest includes artifacts', 'Missing artifacts');

  const androidArtifact = artifacts.find((artifact) => artifact.platform === 'android' && artifact.kind === 'signed-aab');
  if (androidArtifact) {
    pass(findings, 'Artifact manifest includes signed Android AAB');
    if (androidArtifact.path && isFilled(androidArtifact.path)) pass(findings, 'Artifact manifest Android AAB path is filled', androidArtifact.path);
    else fail(findings, 'Artifact manifest Android AAB path is filled', androidArtifact.path ?? 'Missing value');
    if (typeof androidArtifact.bytes === 'number' && androidArtifact.bytes > 0) pass(findings, 'Artifact manifest Android AAB byte count is positive', `${androidArtifact.bytes}`);
    else fail(findings, 'Artifact manifest Android AAB byte count is positive', `${androidArtifact.bytes ?? 'Missing value'}`);
    if (isSha256(androidArtifact.sha256)) pass(findings, 'Artifact manifest Android AAB SHA-256 is valid', androidArtifact.sha256);
    else fail(findings, 'Artifact manifest Android AAB SHA-256 is valid', `${androidArtifact.sha256 ?? 'Missing value'}`);
  } else {
    fail(findings, 'Artifact manifest includes signed Android AAB', 'Missing android signed-aab artifact');
  }

  const iosArtifact = artifacts.find((artifact) => artifact.platform === 'ios' && artifact.kind === 'signed-xcarchive');
  if (iosArtifact) {
    pass(findings, 'Artifact manifest includes signed iOS archive');
    if (iosArtifact.path && isFilled(iosArtifact.path)) pass(findings, 'Artifact manifest iOS archive path is filled', iosArtifact.path);
    else fail(findings, 'Artifact manifest iOS archive path is filled', iosArtifact.path ?? 'Missing value');
    const iosFiles = Array.isArray(iosArtifact.files) ? iosArtifact.files : [];
    if (iosFiles.length > 0) pass(findings, 'Artifact manifest iOS archive includes hashed files', `${iosFiles.length} files`);
    else fail(findings, 'Artifact manifest iOS archive includes hashed files', 'Missing files');
    for (const file of iosFiles) {
      const fileLabel = file.path ?? 'unknown file';
      if (file.path && isFilled(file.path)) pass(findings, `Artifact manifest iOS file path is filled: ${fileLabel}`, file.path);
      else fail(findings, `Artifact manifest iOS file path is filled: ${fileLabel}`, 'Missing value');
      if (typeof file.bytes === 'number' && file.bytes > 0) pass(findings, `Artifact manifest iOS file byte count is positive: ${fileLabel}`, `${file.bytes}`);
      else fail(findings, `Artifact manifest iOS file byte count is positive: ${fileLabel}`, `${file.bytes ?? 'Missing value'}`);
      if (isSha256(file.sha256)) pass(findings, `Artifact manifest iOS file SHA-256 is valid: ${fileLabel}`, file.sha256);
      else fail(findings, `Artifact manifest iOS file SHA-256 is valid: ${fileLabel}`, `${file.sha256 ?? 'Missing value'}`);
    }
  } else {
    fail(findings, 'Artifact manifest includes signed iOS archive', 'Missing ios signed-xcarchive artifact');
  }
}

function validateEvidence(markdown: string, context: ReleaseContext) {
  const findings: Finding[] = [];

  for (const label of requiredReleaseFields) {
    const value = fieldValue(markdown, label);
    if (value && isFilled(value)) pass(findings, `${label} is filled`, value);
    else fail(findings, `${label} is filled`, value ? `Current value: ${value}` : 'Missing field');
  }

  requireEqual(findings, 'Release evidence app version matches package.json', fieldValue(markdown, 'App version'), context.appVersion);
  requireEqual(findings, 'Release evidence build number matches native build numbers', fieldValue(markdown, 'Build number / version code'), context.buildNumber);
  requireEqual(findings, 'Release evidence git commit matches current HEAD', fieldValue(markdown, 'Git commit'), context.gitCommit);
  requireIsoDate(findings, 'Release evidence date is YYYY-MM-DD', fieldValue(markdown, 'Evidence date'));

  for (const label of requiredUrlVerificationFields) {
    requirePass(findings, `${label} passed`, fieldValue(markdown, label));
  }
  requireArtifactManifest(findings, fieldValue(markdown, 'Artifact manifest'), context);

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

  const artifactRows = tableRowsForSection(markdown, 'Build Artifacts');
  for (const required of requiredBuildArtifactRows) {
    const row = artifactRows.find((candidate) =>
      candidate[0] === required.platform
      && candidate[1] === required.storeChannel
    );
    const label = `${required.platform} ${required.storeChannel} build artifact is uploaded`;
    if (!row) {
      fail(findings, label, 'Missing row');
      continue;
    }

    for (const [index, cellLabel] of [
      [2, 'Artifact'],
      [3, 'Uploaded by'],
    ] as const) {
      const value = row[index];
      if (value && isFilled(value)) pass(findings, `${required.platform} build artifact ${cellLabel} is filled`, value);
      else fail(findings, `${required.platform} build artifact ${cellLabel} is filled`, value ? `Current value: ${value}` : 'Missing value');
    }
    requireIsoDate(findings, `${required.platform} build artifact Upload date is YYYY-MM-DD`, row[4]);
    requireComplete(findings, label, row[5]);
  }

  const signingRows = tableRowsForSection(markdown, 'Signing Evidence');
  for (const required of requiredSigningRows) {
    const row = signingRows.find((candidate) => candidate[0] === required.platform);
    const label = `${required.platform} signing evidence is verified`;
    if (!row) {
      fail(findings, label, 'Missing row');
      continue;
    }

    for (const [index, cellLabel] of [
      [1, 'Signing identity'],
      [2, 'Team/account id'],
      [3, 'Profile/keystore'],
      [4, 'Verified by'],
    ] as const) {
      const value = row[index];
      if (value && isFilled(value)) pass(findings, `${required.platform} signing evidence ${cellLabel} is filled`, value);
      else fail(findings, `${required.platform} signing evidence ${cellLabel} is filled`, value ? `Current value: ${value}` : 'Missing value');
    }
    requireComplete(findings, label, row[5]);
  }

  const installedBuildRows = tableRowsForSection(markdown, 'Installed Build Matrix');
  for (const required of requiredInstalledBuildRows) {
    const row = installedBuildRows.find((candidate) =>
      candidate[0] === required.platform
      && candidate[1] === required.buildSource
      && candidate[2] === required.device
    );
    const label = `Installed build matrix has passing ${required.platform} ${required.device}`;
    if (!row) {
      fail(findings, label, 'Missing row');
      continue;
    }

    requirePass(findings, label, row[7]);
    for (const [index, cellLabel] of [
      [3, 'OS version'],
      [5, 'Tester'],
    ] as const) {
      const value = row[index];
      if (value && isFilled(value)) pass(findings, `${required.platform} ${required.device} ${cellLabel} is filled`, value);
      else fail(findings, `${required.platform} ${required.device} ${cellLabel} is filled`, value ? `Current value: ${value}` : 'Missing value');
    }
    requireIsoDate(findings, `${required.platform} ${required.device} Date is YYYY-MM-DD`, row[6]);
    requireEqual(
      findings,
      `${required.platform} ${required.device} app build shown matches release build`,
      row[4],
      context.buildNumber
    );
  }

  const smokeRows = tableRowsForSection(markdown, 'Required Smoke Evidence');
  for (const required of requiredSmokeRows) {
    const row = smokeRows.find((candidate) => candidate[0] === required.area);
    if (!row) {
      fail(findings, `Required smoke evidence includes ${required.area}`, 'Missing row');
      continue;
    }

    if (required.ios === 'N/A') {
      if (normalize(row[1] ?? '') === 'n/a') pass(findings, `${required.area} iOS result is N/A`, row[1]);
      else fail(findings, `${required.area} iOS result is N/A`, row[1] ? `Current value: ${row[1]}` : 'Missing value');
    } else {
      requirePass(findings, `${required.area} iOS result passed`, row[1]);
    }

    if (required.android === 'N/A') {
      if (normalize(row[2] ?? '') === 'n/a') pass(findings, `${required.area} Android result is N/A`, row[2]);
      else fail(findings, `${required.area} Android result is N/A`, row[2] ? `Current value: ${row[2]}` : 'Missing value');
    } else {
      requirePass(findings, `${required.area} Android result passed`, row[2]);
    }

    const evidenceLink = row[3];
    requireEvidenceLink(findings, `${required.area} evidence link is valid`, evidenceLink);
  }

  const storeRows = tableRowsForSection(markdown, 'Store Console Evidence');
  for (const required of requiredStoreConsoleRows) {
    const row = storeRows.find((candidate) => candidate[0] === required.store && candidate[1] === required.area);
    const label = `${required.store} ${required.area} is complete`;
    if (!row) {
      fail(findings, label, 'Missing row');
      continue;
    }

    requireComplete(findings, label, row[2]);
    const evidenceLink = row[3];
    requireEvidenceLink(findings, `${required.store} ${required.area} evidence link is valid`, evidenceLink);
  }

  for (const label of requiredCompleteSignoffFields) {
    requireComplete(findings, `${label} is signed off`, fieldValue(markdown, label));
  }

  for (const label of requiredFilledSignoffFields) {
    const value = fieldValue(markdown, label);
    if (value && isFilled(value)) pass(findings, `${label} is signed off`, value);
    else fail(findings, `${label} is signed off`, value ? `Current value: ${value}` : 'Missing field');
  }
  requireIsoDate(findings, 'Approval date is YYYY-MM-DD', fieldValue(markdown, 'Approval date'));

  return findings;
}

function selfTestArtifactManifestPath(context: ReleaseContext) {
  const directory = mkdtempSync(path.join(tmpdir(), 'flag-arcade-mobile-evidence-'));
  selfTestDirectories.push(directory);
  const manifestPath = path.join(directory, 'mobile-artifacts.json');
  writeFileSync(manifestPath, JSON.stringify({
    generatedAt: '2026-06-07T00:00:00.000Z',
    gitCommit: context.gitCommit,
    appVersion: context.appVersion,
    buildNumber: context.buildNumber,
    artifacts: [
      {
        platform: 'android',
        kind: 'signed-aab',
        path: 'android/app/build/outputs/bundle/release/app-release.aab',
        bytes: 1024,
        sha256: 'a'.repeat(64),
      },
      {
        platform: 'ios',
        kind: 'signed-xcarchive',
        path: 'ios/App/build/FlagArcade.xcarchive',
        files: [
          {
            path: 'ios/App/build/FlagArcade.xcarchive/Info.plist',
            bytes: 1024,
            sha256: 'b'.repeat(64),
          },
        ],
      },
    ],
  }, null, 2));

  return manifestPath;
}

function selfTestEvidence(context = selfTestReleaseContext()) {
  const artifactManifestPath = selfTestArtifactManifestPath(context);
  const smokeEvidenceRows = requiredSmokeRows
    .map((row) => `| ${row.area} | ${row.ios} | ${row.android} | https://example.com/evidence/${row.area.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png |  |`)
    .join('\n');
  const storeConsoleRows = requiredStoreConsoleRows
    .map((row) => `| ${row.store} | ${row.area} | Complete | https://example.com/evidence/${row.store.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${row.area.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png |  |`)
    .join('\n');

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
- Artifact manifest: ${artifactManifestPath}

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
${smokeEvidenceRows}

## Store Console Evidence

| Store | Area | Status | Evidence file/link | Notes |
| --- | --- | --- | --- | --- |
${storeConsoleRows}

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

function selfTestReleaseContext(): ReleaseContext {
  return {
    appVersion: '1.0.0',
    buildNumber: '1',
    gitCommit: 'abc1234',
  };
}

function expectSelfTestFailure(
  name: string,
  markdown: string,
  context: ReleaseContext,
  expectedFailureLabels: string[]
) {
  const findings: Finding[] = [];
  const failedLabels = validateEvidence(markdown, context)
    .filter((finding) => !finding.ok)
    .map((finding) => finding.label);

  for (const expected of expectedFailureLabels) {
    const matched = failedLabels.some((label) => label.includes(expected));
    if (matched) pass(findings, `Negative self-test rejects ${name}: ${expected}`);
    else fail(findings, `Negative self-test rejects ${name}: ${expected}`, `Failures: ${failedLabels.join(', ') || 'none'}`);
  }

  return findings;
}

function negativeSelfTestFindings() {
  const context = selfTestReleaseContext();
  const baseline = selfTestEvidence(context);

  return [
    ...expectSelfTestFailure(
      'stale git commit',
      baseline.replace('- Git commit: abc1234', '- Git commit: stale000'),
      context,
      ['Release evidence git commit matches current HEAD']
    ),
    ...expectSelfTestFailure(
      'missing repo-relative evidence file',
      baseline.replace('https://example.com/evidence/fresh-launch-and-splash.png', 'docs/release-evidence/missing-screenshot.png'),
      context,
      ['Fresh launch and splash evidence link is valid']
    ),
    ...expectSelfTestFailure(
      'weak final signoff value',
      baseline.replace('- Store privacy forms submitted: Yes', '- Store privacy forms submitted: No'),
      context,
      ['Store privacy forms submitted is signed off']
    ),
    ...expectSelfTestFailure(
      'wrong installed build number',
      baseline.replace('| Android | Play internal test | Physical Android phone | Android 16 | 1 | QA | 2026-06-07 | Pass |', '| Android | Play internal test | Physical Android phone | Android 16 | 2 | QA | 2026-06-07 | Pass |'),
      context,
      ['Android Physical Android phone app build shown matches release build']
    ),
    ...expectSelfTestFailure(
      'invalid approval date',
      baseline.replace('- Approval date: 2026-06-07', '- Approval date: June 7'),
      context,
      ['Approval date is YYYY-MM-DD']
    ),
    ...expectSelfTestFailure(
      'malformed local artifact manifest',
      baseline.replace(/- Artifact manifest: .+/, '- Artifact manifest: package.json'),
      context,
      ['Artifact manifest git commit matches release evidence']
    ),
    ...expectSelfTestFailure(
      'external artifact manifest',
      baseline.replace(/- Artifact manifest: .+/, '- Artifact manifest: https://example.com/evidence/mobile-artifacts.json'),
      context,
      ['Artifact manifest is local JSON path']
    ),
  ];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.selfTestFailures && !args.selfTest) {
    throw new Error('Use --self-test-failures together with --self-test.');
  }

  if (!args.selfTest && !args.file) {
    throw new Error('Usage: npm run mobile:evidence:check -- --file docs/release-evidence/<file>.md');
  }

  const context = args.selfTest ? selfTestReleaseContext() : await currentReleaseContext();
  const markdown = args.selfTest
    ? selfTestEvidence(context)
    : await readFile(path.resolve(root, args.file ?? ''), 'utf8');

  const findings = [
    ...validateEvidence(markdown, context),
    ...(args.selfTestFailures ? negativeSelfTestFindings() : []),
  ];
  const failed = findings.filter((finding) => !finding.ok);

  for (const finding of findings) {
    const prefix = finding.ok ? 'PASS' : 'FAIL';
    console.log(`${prefix} ${finding.label}${finding.detail ? ` (${finding.detail})` : ''}`);
  }

  for (const directory of selfTestDirectories) {
    rmSync(directory, { recursive: true, force: true });
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
