import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

type Check = {
  label: string;
  ok: boolean;
  detail?: string;
};

type PackageJson = {
  version?: string;
};

const root = process.cwd();
const checks: Check[] = [];

function resolve(...segments: string[]) {
  return path.join(root, ...segments);
}

function pass(label: string, detail?: string) {
  checks.push({ label, ok: true, detail });
}

function fail(label: string, detail?: string) {
  checks.push({ label, ok: false, detail });
}

function expect(condition: boolean, label: string, detail?: string) {
  if (condition) pass(label, detail);
  else fail(label, detail);
}

function bulletValue(markdown: string, label: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = markdown.match(new RegExp(`^- ${escapedLabel}:[ \\t]*(.*)$`, 'm'));
  return match?.[1]?.trim().replace(/^`|`$/g, '') ?? '';
}

function firstMatch(source: string, pattern: RegExp) {
  return source.match(pattern)?.[1]?.trim() ?? '';
}

function nativeMarketingVersion(packageVersion: string) {
  const parts = packageVersion.split('.');
  return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : packageVersion;
}

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function commandOutput(command: string, args: string[]) {
  try {
    return execFileSync(command, args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

async function main() {
  const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf8')) as PackageJson;
  const capacitorConfig = await readFile(resolve('capacitor.config.ts'), 'utf8');
  const androidBuildGradle = await readFile(resolve('android/app/build.gradle'), 'utf8');
  const xcodeProject = await readFile(resolve('ios/App/App.xcodeproj/project.pbxproj'), 'utf8');
  const storeMetadata = await readFile(resolve('docs/mobile-store-metadata.md'), 'utf8');
  const storeSubmissionPackage = await readFile(resolve('docs/mobile-store-submission-package.md'), 'utf8');
  const releaseEvidenceInitializer = await readFile(resolve('scripts/init-mobile-release-evidence.ts'), 'utf8');

  const packageVersion = packageJson.version ?? '';
  const expectedMarketingVersion = nativeMarketingVersion(packageVersion);
  const expectedAppName = 'Flag Arcade';
  const expectedBundleId = 'com.flagarcade.app';

  expect(Boolean(packageVersion), 'package.json version is present', packageVersion || 'missing');
  expect(/^\d+\.\d+\.\d+$/.test(packageVersion), 'package.json version is semver', packageVersion);
  expect(/^\d+\.\d+$/.test(expectedMarketingVersion), 'Native marketing version derives from package major/minor', expectedMarketingVersion);

  const capacitorAppId = firstMatch(capacitorConfig, /appId:\s*['"]([^'"]+)['"]/);
  const capacitorAppName = firstMatch(capacitorConfig, /appName:\s*['"]([^'"]+)['"]/);
  expect(capacitorAppId === expectedBundleId, 'Capacitor appId matches bundle/package id', capacitorAppId);
  expect(capacitorAppName === expectedAppName, 'Capacitor appName matches store app name', capacitorAppName);

  const androidApplicationId = firstMatch(androidBuildGradle, /applicationId\s+["']([^"']+)["']/);
  const androidVersionCode = firstMatch(androidBuildGradle, /versionCode\s+(\d+)/);
  const androidVersionName = firstMatch(androidBuildGradle, /versionName\s+["']([^"']+)["']/);
  const expectedBuildNumber = androidVersionCode;
  expect(androidApplicationId === expectedBundleId, 'Android applicationId matches bundle/package id', androidApplicationId);
  expect(/^\d+$/.test(androidVersionCode), 'Android versionCode is numeric', androidVersionCode);
  expect(androidVersionName === expectedMarketingVersion, 'Android versionName matches native marketing version', androidVersionName);

  const iosMarketingVersions = [...xcodeProject.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((match) => match[1].trim());
  const iosBuildNumbers = [...xcodeProject.matchAll(/CURRENT_PROJECT_VERSION = ([^;]+);/g)].map((match) => match[1].trim());
  const iosBundleIds = [...xcodeProject.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g)].map((match) => match[1].trim());
  expect(iosMarketingVersions.length > 0, 'iOS marketing version entries exist', iosMarketingVersions.join(', ') || 'missing');
  expect(iosMarketingVersions.every((version) => version === expectedMarketingVersion), 'All iOS marketing versions match native marketing version', iosMarketingVersions.join(', '));
  expect(iosBuildNumbers.length > 0, 'iOS build number entries exist', iosBuildNumbers.join(', ') || 'missing');
  expect(iosBuildNumbers.every((build) => build === expectedBuildNumber), 'All iOS build numbers match expected build number', iosBuildNumbers.join(', '));
  expect(iosBundleIds.length > 0, 'iOS bundle id entries exist', iosBundleIds.join(', ') || 'missing');
  expect(iosBundleIds.every((bundleId) => bundleId === expectedBundleId), 'All iOS bundle ids match expected bundle id', iosBundleIds.join(', '));
  expect(uniqueValues([androidVersionCode, ...iosBuildNumbers]).length === 1, 'Android and iOS build numbers use the same release number', uniqueValues([androidVersionCode, ...iosBuildNumbers]).join(', '));

  const infoPlistJson = commandOutput('plutil', ['-convert', 'json', '-o', '-', resolve('ios/App/App/Info.plist')]);
  if (infoPlistJson) {
    const infoPlist = JSON.parse(infoPlistJson) as { CFBundleDisplayName?: string };
    expect(infoPlist.CFBundleDisplayName === expectedAppName, 'iOS display name matches store app name', infoPlist.CFBundleDisplayName);
  } else {
    fail('iOS Info.plist can be parsed for display name');
  }

  const metadataAppName = bulletValue(storeMetadata, 'App name');
  const metadataBundleId = bulletValue(storeMetadata, 'Bundle ID / package name');
  const metadataPublicVersion = bulletValue(storeMetadata, 'Current public version');
  const metadataBuildNumber = bulletValue(storeMetadata, 'Native build number / Android version code');
  expect(metadataAppName === expectedAppName, 'Store metadata app name matches native app name', metadataAppName);
  expect(metadataBundleId === expectedBundleId, 'Store metadata bundle/package id matches native id', metadataBundleId);
  expect(metadataPublicVersion === expectedMarketingVersion, 'Store metadata public version matches native marketing version', metadataPublicVersion);
  expect(metadataBuildNumber === expectedBuildNumber, 'Store metadata build number matches native build number', metadataBuildNumber);

  const packagePublicVersion = bulletValue(storeSubmissionPackage, 'Public version');
  const packageBuildNumber = bulletValue(storeSubmissionPackage, 'Build number / Android version code');
  const packageBundleId = bulletValue(storeSubmissionPackage, 'Bundle ID / package name');
  expect(packagePublicVersion === expectedMarketingVersion, 'Submission package public version matches native marketing version', packagePublicVersion);
  expect(packageBuildNumber === expectedBuildNumber, 'Submission package build number matches native build number', packageBuildNumber);
  expect(packageBundleId === expectedBundleId, 'Submission package bundle/package id matches native id', packageBundleId);

  expect(
    releaseEvidenceInitializer.includes('packageJson.version') && releaseEvidenceInitializer.includes('Build number / version code'),
    'Release evidence initializer fills version and build fields from current release context'
  );

  const failed = checks.filter((check) => !check.ok);
  for (const check of checks) {
    const prefix = check.ok ? 'PASS' : 'FAIL';
    console.log(`${prefix} ${check.label}${check.detail ? ` (${check.detail})` : ''}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} mobile version consistency check(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${checks.length} mobile version consistency checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
