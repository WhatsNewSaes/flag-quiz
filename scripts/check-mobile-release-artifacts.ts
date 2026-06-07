import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

type Args = {
  androidAab?: string;
  iosArchive?: string;
  manifest?: string;
};

type Finding = {
  label: string;
  ok: boolean;
  detail?: string;
};

type ArtifactManifest = {
  generatedAt: string;
  gitCommit: string;
  appVersion: string;
  buildNumber: string;
  artifacts: Array<{
    platform: 'android' | 'ios';
    kind: string;
    path: string;
    bytes?: number;
    sha256?: string;
    bundleId?: string;
    version?: string;
    buildNumber?: string;
    entries?: number;
    files?: Array<{
      path: string;
      bytes: number;
      sha256: string;
    }>;
  }>;
};

type ReleaseContext = {
  bundleId: string;
  marketingVersion: string;
  buildNumber: string;
};

const findings: Finding[] = [];
const artifactManifest: ArtifactManifest = {
  generatedAt: new Date().toISOString(),
  gitCommit: '',
  appVersion: '',
  buildNumber: '',
  artifacts: [],
};

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

    if (arg === '--manifest' && next) {
      args.manifest = next;
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

function sha256(filePath: string) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function currentGitCommit() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

function packageVersion() {
  try {
    const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as { version?: string };
    return packageJson.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

function nativeMarketingVersion(packageVersion: string) {
  const parts = packageVersion.split('.');
  return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : packageVersion;
}

function firstMatch(source: string, pattern: RegExp) {
  return source.match(pattern)?.[1]?.trim() ?? '';
}

function releaseContext(): ReleaseContext {
  const packageJsonVersion = packageVersion();
  const androidBuildGradle = readFileSync(path.join(root, 'android/app/build.gradle'), 'utf8');
  const bundleId = firstMatch(androidBuildGradle, /applicationId\s+["']([^"']+)["']/) || 'com.flagarcade.app';
  const buildNumber = firstMatch(androidBuildGradle, /versionCode\s+(\d+)/) || 'unknown';
  const androidMarketingVersion = firstMatch(androidBuildGradle, /versionName\s+["']([^"']+)["']/);
  const marketingVersion = androidMarketingVersion || nativeMarketingVersion(packageJsonVersion);

  return {
    bundleId,
    marketingVersion,
    buildNumber,
  };
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

async function checkAndroidAab(inputPath: string, context: ReleaseContext) {
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

  artifactManifest.artifacts.push({
    platform: 'android',
    kind: 'signed-aab',
    path: relativePath,
    bytes: stats.size,
    sha256: sha256(aabPath),
    bundleId: context.bundleId,
    version: context.marketingVersion,
    buildNumber: context.buildNumber,
    entries: entries.length,
  });
}

async function checkIosArchive(inputPath: string, context: ReleaseContext) {
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
        applicationProperties.CFBundleIdentifier === context.bundleId,
        `iOS archive bundle id is ${context.bundleId}`,
        applicationProperties.CFBundleIdentifier
      );
      expect(
        applicationProperties.CFBundleShortVersionString === context.marketingVersion,
        `iOS archive marketing version is ${context.marketingVersion}`,
        applicationProperties.CFBundleShortVersionString
      );
      expect(
        applicationProperties.CFBundleVersion === context.buildNumber,
        `iOS archive build number is ${context.buildNumber}`,
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
          appInfoPlist.CFBundleIdentifier === context.bundleId,
          `iOS archived app bundle id is ${context.bundleId}`,
          appInfoPlist.CFBundleIdentifier
        );
        expect(
          appInfoPlist.CFBundleShortVersionString === context.marketingVersion,
          `iOS archived app marketing version is ${context.marketingVersion}`,
          appInfoPlist.CFBundleShortVersionString
        );
        expect(
          appInfoPlist.CFBundleVersion === context.buildNumber,
          `iOS archived app build number is ${context.buildNumber}`,
          appInfoPlist.CFBundleVersion
        );
        const executablePath = appInfoPlist.CFBundleExecutable
          ? path.join(appPath, appInfoPlist.CFBundleExecutable)
          : '';
        expect(Boolean(executablePath && existsSync(executablePath)), 'iOS archived app executable exists', executablePath ? path.relative(root, executablePath) : 'missing CFBundleExecutable');

        const manifestFiles = [
          appInfoPlistPath,
          path.join(appPath, '_CodeSignature/CodeResources'),
          path.join(appPath, 'embedded.mobileprovision'),
          executablePath,
        ].filter((filePath) => filePath && existsSync(filePath));
        artifactManifest.artifacts.push({
          platform: 'ios',
          kind: 'signed-xcarchive',
          path: relativePath,
          bundleId: appInfoPlist.CFBundleIdentifier,
          version: appInfoPlist.CFBundleShortVersionString,
          buildNumber: appInfoPlist.CFBundleVersion,
          files: manifestFiles.map((filePath) => {
            const fileStats = statSync(filePath);
            return {
              path: path.relative(root, filePath),
              bytes: fileStats.size,
              sha256: sha256(filePath),
            };
          }),
        });
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
  const context = releaseContext();
  artifactManifest.gitCommit = currentGitCommit();
  artifactManifest.appVersion = packageVersion();
  artifactManifest.buildNumber = context.buildNumber;

  if (!args.androidAab || !args.iosArchive) {
    throw new Error('Usage: npm run mobile:artifacts:check -- --android-aab android/app/build/outputs/bundle/release/app-release.aab --ios-archive ios/App/build/FlagArcade.xcarchive --manifest docs/release-evidence/mobile-<version>-build-<build>-<commit>-artifacts.json');
  }

  expect(Boolean(context.bundleId), 'Release context bundle id is resolved', context.bundleId);
  expect(/^\d+\.\d+$/.test(context.marketingVersion), 'Release context marketing version is resolved', context.marketingVersion);
  expect(/^\d+$/.test(context.buildNumber), 'Release context build number is resolved', context.buildNumber);

  await checkAndroidAab(args.androidAab, context);
  await checkIosArchive(args.iosArchive, context);

  const artifactFailures = findings.filter((finding) => !finding.ok);
  if (artifactFailures.length > 0) {
    for (const finding of findings) {
      const prefix = finding.ok ? 'PASS' : 'FAIL';
      console.log(`${prefix} ${finding.label}${finding.detail ? ` (${finding.detail})` : ''}`);
    }
    console.error(`\n${artifactFailures.length} release artifact check(s) failed.`);
    process.exit(1);
  }

  if (args.manifest) {
    const manifestPath = resolveInput(args.manifest);
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify(artifactManifest, null, 2)}\n`);
    pass('Release artifact manifest written', path.relative(root, manifestPath));
  }

  for (const finding of findings) {
    const prefix = finding.ok ? 'PASS' : 'FAIL';
    console.log(`${prefix} ${finding.label}${finding.detail ? ` (${finding.detail})` : ''}`);
  }

  console.log(`\nAll ${findings.length} release artifact checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
