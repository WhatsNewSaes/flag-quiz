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

function parsePlist(filePath: string) {
  const plistJson = execFileSync('plutil', ['-convert', 'json', '-o', '-', filePath], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return JSON.parse(plistJson) as Record<string, unknown>;
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
  expect(
    entries.some((entry) => /^META-INF\/.+\.SF$/i.test(entry)),
    'Android AAB includes signing signature file'
  );
  expect(
    entries.some((entry) => /^META-INF\/.+\.(RSA|DSA|EC)$/i.test(entry)),
    'Android AAB includes signing certificate block'
  );
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
  let appPath: string | undefined;
  if (applicationsPathExists) {
    const appBundles = (await readdir(applicationsPath)).filter((entry) => entry.endsWith('.app'));
    expect(appBundles.length > 0, 'iOS archive includes an .app bundle', appBundles.join(', ') || 'none');
    appPath = appBundles[0] ? path.join(applicationsPath, appBundles[0]) : undefined;
  }

  if (existsSync(infoPlistPath)) {
    try {
      const infoPlist = parsePlist(infoPlistPath) as {
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

  if (appPath) {
    const appInfoPlistPath = path.join(appPath, 'Info.plist');
    expect(existsSync(appInfoPlistPath), 'iOS archived app includes Info.plist', path.relative(root, appInfoPlistPath));
    expect(
      existsSync(path.join(appPath, '_CodeSignature/CodeResources')),
      'iOS archived app includes code signature resources',
      path.relative(root, path.join(appPath, '_CodeSignature/CodeResources'))
    );
    expect(
      existsSync(path.join(appPath, 'embedded.mobileprovision')),
      'iOS archived app includes embedded provisioning profile',
      path.relative(root, path.join(appPath, 'embedded.mobileprovision'))
    );

    if (existsSync(appInfoPlistPath)) {
      try {
        const appInfoPlist = parsePlist(appInfoPlistPath) as {
          CFBundleExecutable?: string;
          CFBundleIdentifier?: string;
          CFBundleShortVersionString?: string;
          CFBundleVersion?: string;
        };
        expect(
          appInfoPlist.CFBundleIdentifier === 'com.flagarcade.app',
          'iOS archived app bundle id is com.flagarcade.app',
          appInfoPlist.CFBundleIdentifier
        );
        expect(
          appInfoPlist.CFBundleShortVersionString === '1.0',
          'iOS archived app marketing version is 1.0',
          appInfoPlist.CFBundleShortVersionString
        );
        expect(
          appInfoPlist.CFBundleVersion === '1',
          'iOS archived app build number is 1',
          appInfoPlist.CFBundleVersion
        );
        const executablePath = appInfoPlist.CFBundleExecutable
          ? path.join(appPath, appInfoPlist.CFBundleExecutable)
          : '';
        expect(Boolean(executablePath && existsSync(executablePath)), 'iOS archived app executable exists', executablePath ? path.relative(root, executablePath) : 'missing CFBundleExecutable');
      } catch {
        fail('iOS archived app Info.plist can be parsed');
      }
    }

    try {
      execFileSync('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      pass('iOS archived app code signature verifies with codesign');
    } catch {
      fail('iOS archived app code signature verifies with codesign');
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
