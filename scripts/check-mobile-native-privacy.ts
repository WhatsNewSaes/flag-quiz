import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

type Check = {
  label: string;
  ok: boolean;
  detail?: string;
};

const root = process.cwd();
const checks: Check[] = [];

const allowedAndroidPermissions = new Set(['android.permission.INTERNET']);
const blockedAndroidPermissions = [
  'android.permission.ACCESS_BACKGROUND_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.BODY_SENSORS',
  'android.permission.CAMERA',
  'android.permission.GET_ACCOUNTS',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.READ_CALENDAR',
  'android.permission.READ_CONTACTS',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.READ_PHONE_STATE',
  'android.permission.RECORD_AUDIO',
  'android.permission.WRITE_EXTERNAL_STORAGE',
];

const blockedIosUsageKeys = [
  'NSBluetoothAlwaysUsageDescription',
  'NSCalendarsUsageDescription',
  'NSCameraUsageDescription',
  'NSContactsUsageDescription',
  'NSFaceIDUsageDescription',
  'NSHealthShareUsageDescription',
  'NSHealthUpdateUsageDescription',
  'NSLocationAlwaysAndWhenInUseUsageDescription',
  'NSLocationWhenInUseUsageDescription',
  'NSMicrophoneUsageDescription',
  'NSMotionUsageDescription',
  'NSPhotoLibraryAddUsageDescription',
  'NSPhotoLibraryUsageDescription',
  'NSUserTrackingUsageDescription',
];

const expectedPrivacyDataTypes = new Set([
  'NSPrivacyCollectedDataTypeDeviceID',
  'NSPrivacyCollectedDataTypeEmailAddress',
  'NSPrivacyCollectedDataTypeOtherUserContent',
  'NSPrivacyCollectedDataTypeProductInteraction',
  'NSPrivacyCollectedDataTypeUserID',
]);

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

function plistJson<T>(relativePath: string) {
  return JSON.parse(
    execFileSync('plutil', ['-convert', 'json', '-o', '-', resolve(relativePath)], {
      encoding: 'utf8',
    })
  ) as T;
}

function androidPermissions(manifest: string) {
  return [...manifest.matchAll(/<uses-permission\b[^>]*android:name="([^"]+)"/g)].map((match) => match[1]);
}

async function main() {
  const androidManifest = await readFile(resolve('android/app/src/main/AndroidManifest.xml'), 'utf8');
  const androidDataExtractionRules = await readFile(resolve('android/app/src/main/res/xml/data_extraction_rules.xml'), 'utf8');
  const androidFileProviderPaths = await readFile(resolve('android/app/src/main/res/xml/file_paths.xml'), 'utf8');
  const iosInfoPlistText = await readFile(resolve('ios/App/App/Info.plist'), 'utf8');
  const privacyInventory = await readFile(resolve('docs/mobile-privacy-data-inventory.md'), 'utf8');
  const privacyAnswers = await readFile(resolve('docs/mobile-store-privacy-form-answers.md'), 'utf8');

  const permissions = androidPermissions(androidManifest);
  expect(permissions.length > 0, 'Android permissions are explicitly declared', permissions.join(', '));
  expect(
    permissions.every((permission) => allowedAndroidPermissions.has(permission)),
    'Android manifest only requests allowed permissions',
    permissions.join(', ')
  );
  expect(permissions.includes('android.permission.INTERNET'), 'Android internet permission is present');
  for (const permission of blockedAndroidPermissions) {
    expect(!permissions.includes(permission), `Android does not request ${permission}`);
  }

  expect(androidManifest.includes('android:allowBackup="false"'), 'Android Auto Backup is disabled');
  expect(androidManifest.includes('android:fullBackupContent="false"'), 'Android full backup is disabled');
  expect(
    androidManifest.includes('android:dataExtractionRules="@xml/data_extraction_rules"'),
    'Android data extraction rules are referenced by the manifest'
  );
  for (const section of ['cloud-backup', 'device-transfer']) {
    expect(androidDataExtractionRules.includes(`<${section}>`), `Android data extraction rules include ${section}`);
  }
  for (const domain of ['root', 'file', 'database', 'sharedpref', 'external']) {
    expect(
      androidDataExtractionRules.includes(`domain="${domain}"`),
      `Android data extraction rules exclude ${domain} data`
    );
  }
  expect(!androidFileProviderPaths.includes('<external-path'), 'Android FileProvider does not expose external storage');
  expect(androidFileProviderPaths.includes('<cache-path name="share_cache" path="."'), 'Android FileProvider is cache-only');

  for (const key of blockedIosUsageKeys) {
    expect(!iosInfoPlistText.includes(key), `iOS Info.plist does not request ${key}`);
  }
  expect(!iosInfoPlistText.includes('SKAdNetworkItems'), 'iOS Info.plist does not declare ad attribution networks');

  expect(existsSync(resolve('ios/App/App/PrivacyInfo.xcprivacy')), 'iOS privacy manifest exists');
  const iosPrivacy = plistJson<{
    NSPrivacyTracking?: boolean;
    NSPrivacyTrackingDomains?: string[];
    NSPrivacyAccessedAPITypes?: Array<{
      NSPrivacyAccessedAPIType?: string;
      NSPrivacyAccessedAPITypeReasons?: string[];
    }>;
    NSPrivacyCollectedDataTypes?: Array<{
      NSPrivacyCollectedDataType?: string;
      NSPrivacyCollectedDataTypeLinked?: boolean;
      NSPrivacyCollectedDataTypeTracking?: boolean;
      NSPrivacyCollectedDataTypePurposes?: string[];
    }>;
  }>('ios/App/App/PrivacyInfo.xcprivacy');

  expect(iosPrivacy.NSPrivacyTracking === false, 'iOS privacy manifest declares tracking false');
  expect(
    Array.isArray(iosPrivacy.NSPrivacyTrackingDomains) && iosPrivacy.NSPrivacyTrackingDomains.length === 0,
    'iOS privacy manifest has no tracking domains'
  );
  expect(
    iosPrivacy.NSPrivacyAccessedAPITypes?.some((entry) =>
      entry.NSPrivacyAccessedAPIType === 'NSPrivacyAccessedAPICategoryUserDefaults'
        && entry.NSPrivacyAccessedAPITypeReasons?.includes('CA92.1')
    ) === true,
    'iOS privacy manifest declares UserDefaults reason CA92.1'
  );

  const declaredDataTypes = new Set(
    (iosPrivacy.NSPrivacyCollectedDataTypes ?? []).map((entry) => entry.NSPrivacyCollectedDataType).filter(Boolean)
  );
  for (const dataType of expectedPrivacyDataTypes) {
    expect(declaredDataTypes.has(dataType), `iOS privacy manifest declares ${dataType}`);
  }
  expect(declaredDataTypes.size === expectedPrivacyDataTypes.size, 'iOS privacy manifest does not declare extra data types');
  for (const entry of iosPrivacy.NSPrivacyCollectedDataTypes ?? []) {
    expect(entry.NSPrivacyCollectedDataTypeTracking === false, `${entry.NSPrivacyCollectedDataType} is not used for tracking`);
    expect(
      Array.isArray(entry.NSPrivacyCollectedDataTypePurposes) && entry.NSPrivacyCollectedDataTypePurposes.length > 0,
      `${entry.NSPrivacyCollectedDataType} declares at least one purpose`
    );
  }

  for (const term of [
    'Data sold: No',
    'Cross-app tracking: No',
    'Precise location collected: No',
    'Android local app data backup/transfer',
    'android.permission.INTERNET',
    'PrivacyInfo.xcprivacy',
  ]) {
    expect(privacyAnswers.includes(term), `Privacy form answers include ${term}`);
  }
  for (const term of [
    'does not sell data',
    'cross-app tracking',
    'does not request precise location',
    'Android Auto Backup/device transfer is disabled',
    'PrivacyInfo.xcprivacy',
  ]) {
    expect(privacyInventory.includes(term), `Privacy inventory supports ${term}`);
  }

  const failed = checks.filter((check) => !check.ok);
  for (const check of checks) {
    const prefix = check.ok ? 'PASS' : 'FAIL';
    console.log(`${prefix} ${check.label}${check.detail ? ` (${check.detail})` : ''}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} mobile native privacy check(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${checks.length} mobile native privacy checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
