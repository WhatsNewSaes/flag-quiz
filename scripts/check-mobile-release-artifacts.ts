import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

type Args = {
  androidAab?: string;
  iosArchive?: string;
};

type Finding = {
  label: string;
  ok: boolean;
  detail?: string;
};

const findings: Finding[] = [];

function parseArgs(argv: string[]): Args {
  const args: Args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--android-aab' && next) {
      args.androidAab = next;
      index += 1;
      continue;
    }

    if (arg === '--ios-archive' && next) {
      args.iosArchive = next;
      index += 1;
      continue;
    }

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  return args;
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

function resolveInput(input: string) {
  return path.resolve(root, input);
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

async function checkAndroidAab(inputPath: string) {
  const aabPath = resolveInput(inputPath);
  const relativePath = path.relative(root, aabPath);
  const exists = existsSync(aabPath);
  expect(exists, 'Android AAB exists', relativePath);
  if (!exists) return;

  const stats = statSync(aabPath);
  expect(stats.isFile(), 'Android AAB path is a file', relativePath);
  expect(path.extname(aabPath) === '.aab', 'Android artifact has .aab extension', relativePath);
  expect(stats.size > 0, 'Android AAB is not empty', `${stats.size} bytes`);

  const entries = listZipEntries(aabPath);
  expect(entries.length > 0, 'Android AAB is readable as a zip bundle', `${entries.length} entries`);
  expect(entries.includes('BundleConfig.pb'), 'Android AAB includes BundleConfig.pb');
  expect(entries.some((entry) => entry.endsWith('/manifest/AndroidManifest.xml')), 'Android AAB includes module AndroidManifest.xml');
  expect(entries.some((entry) => entry.startsWith('base/')), 'Android AAB includes base module entries');
}

async function checkIosArchive(inputPath: string) {
  const archivePath = resolveInput(inputPath);
  const relativePath = path.relative(root, archivePath);
  const exists = existsSync(archivePath);
  expect(exists, 'iOS archive exists', relativePath);
  if (!exists) return;

  const stats = statSync(archivePath);
  expect(stats.isDirectory(), 'iOS archive path is a directory', relativePath);
  expect(archivePath.endsWith('.xcarchive'), 'iOS archive has .xcarchive extension', relativePath);

  const infoPlistPath = path.join(archivePath, 'Info.plist');
  expect(existsSync(infoPlistPath), 'iOS archive includes Info.plist', path.relative(root, infoPlistPath));

  const applicationsPath = path.join(archivePath, 'Products/Applications');
  const applicationsPathExists = existsSync(applicationsPath);
  expect(applicationsPathExists, 'iOS archive includes Products/Applications directory', path.relative(root, applicationsPath));
  if (applicationsPathExists) {
    const appBundles = (await readdir(applicationsPath)).filter((entry) => entry.endsWith('.app'));
    expect(appBundles.length > 0, 'iOS archive includes an .app bundle', appBundles.join(', ') || 'none');
  }

  if (existsSync(infoPlistPath)) {
    try {
      const infoPlistJson = execFileSync('plutil', ['-convert', 'json', '-o', '-', infoPlistPath], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const infoPlist = JSON.parse(infoPlistJson) as {
        ApplicationProperties?: {
          CFBundleIdentifier?: string;
          CFBundleShortVersionString?: string;
          CFBundleVersion?: string;
        };
      };
      const applicationProperties = infoPlist.ApplicationProperties ?? {};
      expect(
        applicationProperties.CFBundleIdentifier === 'com.flagarcade.app',
        'iOS archive bundle id is com.flagarcade.app',
        applicationProperties.CFBundleIdentifier
      );
      expect(
        applicationProperties.CFBundleShortVersionString === '1.0',
        'iOS archive marketing version is 1.0',
        applicationProperties.CFBundleShortVersionString
      );
      expect(
        applicationProperties.CFBundleVersion === '1',
        'iOS archive build number is 1',
        applicationProperties.CFBundleVersion
      );
    } catch {
      fail('iOS archive Info.plist can be parsed');
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.androidAab || !args.iosArchive) {
    throw new Error('Usage: npm run mobile:artifacts:check -- --android-aab android/app/build/outputs/bundle/release/app-release.aab --ios-archive ios/App/build/FlagArcade.xcarchive');
  }

  await checkAndroidAab(args.androidAab);
  await checkIosArchive(args.iosArchive);

  const failed = findings.filter((finding) => !finding.ok);
  for (const finding of findings) {
    const prefix = finding.ok ? 'PASS' : 'FAIL';
    console.log(`${prefix} ${finding.label}${finding.detail ? ` (${finding.detail})` : ''}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} release artifact check(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${findings.length} release artifact checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
