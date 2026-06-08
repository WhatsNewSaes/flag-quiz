import { readFile } from 'node:fs/promises';
import path from 'node:path';

type Finding = {
  status: 'PASS' | 'WARN' | 'FAIL';
  label: string;
  detail?: string;
};

type PackageJson = {
  version?: string;
};

const root = process.cwd();
const findings: Finding[] = [];
const strict = process.argv.includes('--strict');

function resolve(...segments: string[]) {
  return path.join(root, ...segments);
}

function add(status: Finding['status'], label: string, detail?: string) {
  findings.push({ status, label, detail });
}

function bulletValue(markdown: string, label: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = markdown.match(new RegExp(`^- ${escapedLabel}:[ \\t]*(.*)$`, 'm'));
  return match?.[1]?.trim().replace(/^`|`$/g, '') ?? '';
}

function checkboxChecked(markdown: string, label: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^- \\[x\\] ${escapedLabel}$`, 'm').test(markdown);
}

function nativeMarketingVersion(packageVersion: string) {
  const parts = packageVersion.split('.');
  return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : packageVersion;
}

function firstMatch(source: string, pattern: RegExp) {
  return source.match(pattern)?.[1]?.trim() ?? '';
}

function isFilled(value: string) {
  const normalized = value.trim().toLowerCase();
  return Boolean(normalized)
    && !['tbd', 'todo', 'pending', 'not confirmed', 'n/a'].includes(normalized)
    && !normalized.startsWith('pending');
}

function finalField(label: string, value: string) {
  add(
    isFilled(value) ? 'PASS' : 'WARN',
    `${label} is filled for final store submission`,
    isFilled(value) ? value : 'Fill docs/mobile-store-account-handoff.md before release evidence signoff.'
  );
}

async function main() {
  const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf8')) as PackageJson;
  const androidBuildGradle = await readFile(resolve('android/app/build.gradle'), 'utf8');
  const handoff = await readFile(resolve('docs/mobile-store-account-handoff.md'), 'utf8');

  const expectedVersion = nativeMarketingVersion(packageJson.version ?? '');
  const expectedBuildNumber = firstMatch(androidBuildGradle, /versionCode\s+(\d+)/);
  const expectedBundleId = 'com.flagarcade.app';

  add(bulletValue(handoff, 'Support contact') === 'support@flagarcade.com' ? 'PASS' : 'FAIL', 'Support contact is support@flagarcade.com');
  add(bulletValue(handoff, 'Public site') === 'https://flagarcade.com' ? 'PASS' : 'FAIL', 'Public site is production HTTPS URL');
  add(bulletValue(handoff, 'Bundle ID / package name') === expectedBundleId ? 'PASS' : 'FAIL', 'Bundle/package id matches native app id');
  add(bulletValue(handoff, 'Google Play package name') === expectedBundleId ? 'PASS' : 'FAIL', 'Google Play package name matches native app id');
  add(bulletValue(handoff, 'Public version') === expectedVersion ? 'PASS' : 'FAIL', 'Public version matches package major/minor', bulletValue(handoff, 'Public version'));
  add(bulletValue(handoff, 'Build number / Android version code') === expectedBuildNumber ? 'PASS' : 'FAIL', 'Build number matches Android versionCode', bulletValue(handoff, 'Build number / Android version code'));

  for (const term of [
    'Do not add passwords, app-specific passwords, private keys, certificates, provisioning profile files, keystores, recovery codes, or personal access tokens',
    'Signing style: Automatic signing in Xcode project; confirm final Team ID before archive.',
    'Distribution certificate type: Apple Distribution.',
    'Provisioning profile type: App Store distribution.',
    'Signed archive command after signing is configured: `npm run mobile:build:ios:archive`',
    'Expected archive path: `ios/App/build/FlagArcade.xcarchive`',
    'Keystore properties path: `android/keystore.properties` (gitignored)',
    'Release command after signing is configured: `npm run mobile:build:android:release`',
    'Expected AAB path: `android/app/build/outputs/bundle/release/app-release.aab`',
  ]) {
    add(handoff.includes(term) ? 'PASS' : 'FAIL', `Account handoff documents ${term}`);
  }

  for (const [label, value] of [
    ['Release owner', bulletValue(handoff, 'Release owner')],
    ['Copyright holder', bulletValue(handoff, 'Copyright holder')],
    ['Apple Developer account holder', bulletValue(handoff, 'Apple Developer account holder')],
    ['Apple Developer Team ID', bulletValue(handoff, 'Apple Developer Team ID')],
    ['App Store Connect app record', bulletValue(handoff, 'App Store Connect app record')],
    ['Bundle identifier owner confirmed', bulletValue(handoff, 'Bundle identifier owner confirmed')],
    ['Google Play developer account holder', bulletValue(handoff, 'Google Play developer account holder')],
    ['Upload key owner', bulletValue(handoff, 'Upload key owner')],
    ['Keystore file path', bulletValue(handoff, 'Keystore file path')],
  ] as const) {
    finalField(label, value);
  }

  for (const label of [
    'Apple Developer Team ID is configured locally or selected in Xcode.',
    'Android upload keystore is configured locally and outside git.',
    'Copyright holder is final.',
    'App Store Connect app record matches `com.flagarcade.app`.',
    'Google Play Console app record matches `com.flagarcade.app`.',
    'Store roles are sufficient to upload builds and submit privacy/store forms.',
  ]) {
    add(
      checkboxChecked(handoff, label) ? 'PASS' : 'WARN',
      `Final confirmation checked: ${label}`,
      'Check this after confirming the store account setup.'
    );
  }

  const warnings = findings.filter((finding) => finding.status === 'WARN');
  const failures = findings.filter((finding) => finding.status === 'FAIL');

  for (const finding of findings) {
    console.log(`${finding.status} ${finding.label}${finding.detail ? ` (${finding.detail})` : ''}`);
  }

  console.log(`\n${findings.length} store account handoff checks: ${failures.length} fail, ${warnings.length} warn.`);
  if (strict && warnings.length > 0) {
    console.error('Strict store account handoff failed because final account warnings remain.');
  }

  if (failures.length > 0 || (strict && warnings.length > 0)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
