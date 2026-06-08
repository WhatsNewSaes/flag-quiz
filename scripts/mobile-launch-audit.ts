import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

type Check = {
  label: string;
  ok: boolean;
  detail?: string;
};

const root = process.cwd();

const checks: Check[] = [];

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

function resolve(...segments: string[]) {
  return path.join(root, ...segments);
}

async function imageMetadata(relativePath: string) {
  const absolutePath = resolve(relativePath);
  if (!existsSync(absolutePath)) {
    fail(`${relativePath} exists`);
    return null;
  }

  const metadata = await sharp(absolutePath).metadata();
  const detail = `${metadata.width ?? '?'}x${metadata.height ?? '?'} ${metadata.format ?? 'image'}`;
  pass(`${relativePath} exists`, detail);
  return metadata;
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

async function main() {
  const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf8')) as {
    version?: string;
    scripts?: Record<string, string>;
  };
  const packageVersion = packageJson.version ?? '';
  const expectedMarketingVersion = nativeMarketingVersion(packageVersion);
  expect(/^\d+\.\d+\.\d+$/.test(packageVersion), 'package.json public version is semver', packageVersion);
  expect(Boolean(packageJson.scripts?.['mobile:audit']), 'package.json exposes mobile:audit');
  expect(Boolean(packageJson.scripts?.['mobile:preflight']), 'package.json exposes mobile:preflight');
  expect(Boolean(packageJson.scripts?.['mobile:urls:check']), 'package.json exposes mobile public URL check script');
  expect(Boolean(packageJson.scripts?.['mobile:version:check']), 'package.json exposes mobile version consistency checker script');
  expect(Boolean(packageJson.scripts?.['mobile:privacy:check']), 'package.json exposes mobile native privacy checker script');
  expect(Boolean(packageJson.scripts?.['mobile:store:check']), 'package.json exposes mobile store submission checker script');
  expect(Boolean(packageJson.scripts?.['mobile:qa:plan']), 'package.json exposes mobile installed-build QA plan checker script');
  expect(Boolean(packageJson.scripts?.['mobile:devices:check']), 'package.json exposes mobile local device coverage checker script');
  expect(Boolean(packageJson.scripts?.['mobile:bundle:check']), 'package.json exposes mobile bundle cleanliness checker script');
  expect(Boolean(packageJson.scripts?.['mobile:handoff:check']), 'package.json exposes mobile store handoff checker script');
  expect(Boolean(packageJson.scripts?.['mobile:blockers:check']), 'package.json exposes mobile launch blocker checker script');
  expect(Boolean(packageJson.scripts?.['mobile:build:android:debug']), 'package.json exposes Android debug build script');
  expect(Boolean(packageJson.scripts?.['mobile:build:android:release']), 'package.json exposes Android release AAB script');
  expect(Boolean(packageJson.scripts?.['mobile:build:ios:debug']), 'package.json exposes iOS debug build script');
  expect(Boolean(packageJson.scripts?.['mobile:build:ios:archive']), 'package.json exposes iOS App Store archive script');
  expect(Boolean(packageJson.scripts?.['mobile:signing:preflight']), 'package.json exposes mobile signing preflight script');
  expect(Boolean(packageJson.scripts?.['mobile:signing:release']), 'package.json exposes strict mobile release signing script');
  expect(Boolean(packageJson.scripts?.['mobile:readiness']), 'package.json exposes mobile readiness report script');
  expect(Boolean(packageJson.scripts?.['mobile:evidence:init']), 'package.json exposes mobile release evidence initializer script');
  expect(Boolean(packageJson.scripts?.['mobile:evidence:self-test']), 'package.json exposes mobile release evidence self-test script');
  expect(Boolean(packageJson.scripts?.['mobile:evidence:check']), 'package.json exposes mobile release evidence checker script');
  expect(Boolean(packageJson.scripts?.['mobile:artifacts:check']), 'package.json exposes mobile release artifact checker script');
  expect(Boolean(packageJson.scripts?.['mobile:go-live:check']), 'package.json exposes mobile go-live gate script');
  expect(Boolean(packageJson.scripts?.['package:store-submission']), 'package.json exposes store submission package script');
  expect(
    packageJson.scripts?.['package:store-submission']?.includes('npm run mobile:handoff:check') === true,
    'Store submission package script runs handoff checker'
  );
  expect(
    packageJson.scripts?.['package:store-submission']?.includes('npm run mobile:blockers:check') === true,
    'Store submission package script runs blocker checker'
  );
  expect(
    packageJson.scripts?.['mobile:preflight']?.includes('npm run mobile:store:check') === true,
    'Mobile preflight includes store submission checker'
  );
  expect(
    packageJson.scripts?.['mobile:preflight']?.includes('npm run mobile:privacy:check') === true,
    'Mobile preflight includes native privacy checker'
  );
  expect(
    packageJson.scripts?.['mobile:preflight']?.includes('npm run mobile:qa:plan') === true,
    'Mobile preflight includes installed-build QA plan checker'
  );
  expect(
    packageJson.scripts?.['mobile:preflight']?.includes('npm run mobile:devices:check') === true,
    'Mobile preflight includes local device coverage checker'
  );
  expect(
    packageJson.scripts?.['mobile:preflight']?.includes('npm run mobile:bundle:check') === true,
    'Mobile preflight includes bundle cleanliness checker'
  );
  expect(
    packageJson.scripts?.['mobile:preflight']?.includes('npm run mobile:version:check') === true,
    'Mobile preflight includes version consistency checker'
  );
  expect(
    packageJson.scripts?.['mobile:preflight']?.includes('npm run mobile:evidence:self-test') === true,
    'Mobile preflight includes release evidence checker self-test'
  );

  const capacitorConfig = await readFile(resolve('capacitor.config.ts'), 'utf8');
  expect(capacitorConfig.includes("appId: 'com.flagarcade.app'"), 'Capacitor app id is com.flagarcade.app');
  expect(capacitorConfig.includes("appName: 'Flag Arcade'"), 'Capacitor app name is Flag Arcade');
  expect(capacitorConfig.includes("webDir: 'dist'"), 'Capacitor webDir is dist');
  expect(capacitorConfig.includes('StatusBar'), 'Capacitor status bar plugin configured');
  expect(capacitorConfig.includes('SplashScreen'), 'Capacitor splash screen plugin configured');
  expect(capacitorConfig.includes('Keyboard'), 'Capacitor keyboard plugin configured');

  const androidManifest = await readFile(resolve('android/app/src/main/AndroidManifest.xml'), 'utf8');
  const androidBuildGradle = await readFile(resolve('android/app/build.gradle'), 'utf8');
  const androidFileProviderPaths = await readFile(resolve('android/app/src/main/res/xml/file_paths.xml'), 'utf8');
  const androidDataExtractionRules = await readFile(resolve('android/app/src/main/res/xml/data_extraction_rules.xml'), 'utf8');
  const androidVersionCode = firstMatch(androidBuildGradle, /versionCode\s+(\d+)/);
  const androidVersionName = firstMatch(androidBuildGradle, /versionName\s+["']([^"']+)["']/);
  expect(/^\d+$/.test(androidVersionCode), 'Android versionCode is numeric', androidVersionCode);
  expect(androidVersionName === expectedMarketingVersion, 'Android versionName matches package major/minor', androidVersionName);
  expect(androidManifest.includes('android:screenOrientation="portrait"'), 'Android main activity is portrait locked');
  expect(androidManifest.includes('android:allowBackup="false"'), 'Android Auto Backup is disabled');
  expect(androidManifest.includes('android:fullBackupContent="false"'), 'Android full backup content is disabled');
  expect(androidManifest.includes('android:usesCleartextTraffic="false"'), 'Android cleartext traffic is disabled');
  expect(androidManifest.includes('android:dataExtractionRules="@xml/data_extraction_rules"'), 'Android data extraction rules are configured');
  expect(androidDataExtractionRules.includes('<cloud-backup>'), 'Android data extraction rules cover cloud backup');
  expect(androidDataExtractionRules.includes('<device-transfer>'), 'Android data extraction rules cover device transfer');
  for (const domain of ['root', 'file', 'database', 'sharedpref', 'external']) {
    expect(androidDataExtractionRules.includes(`domain="${domain}"`), `Android data extraction rules exclude ${domain}`);
  }
  expect(!androidFileProviderPaths.includes('<external-path'), 'Android FileProvider does not expose broad external storage');
  expect(androidFileProviderPaths.includes('<cache-path name="share_cache" path="."'), 'Android FileProvider is limited to cache sharing');
  expect(
    androidManifest.includes('android:scheme="com.flagarcade.app"')
      && androidManifest.includes('android:host="auth"')
      && androidManifest.includes('android:pathPrefix="/callback"'),
    'Android auth callback deep link is configured'
  );
  expect(androidManifest.includes('android.permission.INTERNET'), 'Android internet permission is present');
  const blockedAndroidPermissions = [
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.CAMERA',
    'android.permission.RECORD_AUDIO',
    'android.permission.READ_CONTACTS',
    'android.permission.READ_MEDIA_IMAGES',
    'android.permission.READ_MEDIA_VIDEO',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.BODY_SENSORS',
  ];
  for (const permission of blockedAndroidPermissions) {
    expect(!androidManifest.includes(permission), `Android does not request ${permission}`);
  }

  const iosInfoRaw = execFileSync('plutil', ['-convert', 'json', '-o', '-', resolve('ios/App/App/Info.plist')], {
    encoding: 'utf8',
  });
  const iosProjectText = await readFile(resolve('ios/App/App.xcodeproj/project.pbxproj'), 'utf8');
  const iosInfo = JSON.parse(iosInfoRaw) as {
    CFBundleDisplayName?: string;
    ITSAppUsesNonExemptEncryption?: boolean;
    UIRequiresFullScreen?: boolean;
    UISupportedInterfaceOrientations?: string[];
    'UISupportedInterfaceOrientations~ipad'?: string[];
    CFBundleURLTypes?: Array<{ CFBundleURLSchemes?: string[] }>;
  };
  expect(iosInfo.CFBundleDisplayName === 'Flag Arcade', 'iOS display name is Flag Arcade');
  expect(iosInfo.ITSAppUsesNonExemptEncryption === false, 'iOS export compliance flag declares no non-exempt encryption');
  expect(iosInfo.UIRequiresFullScreen === true, 'iOS requires full screen for portrait lock');
  expect(
    JSON.stringify(iosInfo.UISupportedInterfaceOrientations) === JSON.stringify(['UIInterfaceOrientationPortrait']),
    'iPhone orientation is portrait only'
  );
  expect(
    JSON.stringify(iosInfo['UISupportedInterfaceOrientations~ipad']) === JSON.stringify(['UIInterfaceOrientationPortrait']),
    'iPad orientation is portrait only'
  );
  expect(
    (iosProjectText.match(/TARGETED_DEVICE_FAMILY = 1;/g) ?? []).length >= 2,
    'iOS target is iPhone-only for first release'
  );
  expect(
    !iosProjectText.includes('TARGETED_DEVICE_FAMILY = "1,2";'),
    'iOS target does not enable universal iPhone/iPad support'
  );
  expect(
    iosInfo.CFBundleURLTypes?.some((entry) => entry.CFBundleURLSchemes?.includes('com.flagarcade.app')) === true,
    'iOS auth callback URL scheme is configured'
  );

  const iosInfoPlistText = await readFile(resolve('ios/App/App/Info.plist'), 'utf8');
  const blockedIosUsageKeys = [
    'NSCameraUsageDescription',
    'NSMicrophoneUsageDescription',
    'NSPhotoLibraryUsageDescription',
    'NSLocationWhenInUseUsageDescription',
    'NSLocationAlwaysAndWhenInUseUsageDescription',
    'NSContactsUsageDescription',
    'NSHealthShareUsageDescription',
    'NSHealthUpdateUsageDescription',
  ];
  for (const key of blockedIosUsageKeys) {
    expect(!iosInfoPlistText.includes(key), `iOS Info.plist does not request ${key}`);
  }

  expect(existsSync(resolve('ios/App/App/PrivacyInfo.xcprivacy')), 'iOS privacy manifest exists');
  const iosPrivacyManifestText = await readFile(resolve('ios/App/App/PrivacyInfo.xcprivacy'), 'utf8');
  expect(iosPrivacyManifestText.includes('NSPrivacyTracking'), 'iOS privacy manifest declares tracking status');
  expect(iosPrivacyManifestText.includes('NSPrivacyAccessedAPICategoryUserDefaults'), 'iOS privacy manifest declares UserDefaults access');
  expect(iosPrivacyManifestText.includes('NSPrivacyCollectedDataTypeProductInteraction'), 'iOS privacy manifest declares product interaction data');
  const xcodeProject = await readFile(resolve('ios/App/App.xcodeproj/project.pbxproj'), 'utf8');
  const iosMarketingVersions = [...xcodeProject.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((match) => match[1].trim());
  const iosBuildNumbers = [...xcodeProject.matchAll(/CURRENT_PROJECT_VERSION = ([^;]+);/g)].map((match) => match[1].trim());
  expect(iosMarketingVersions.length > 0, 'iOS marketing version entries exist', iosMarketingVersions.join(', ') || 'missing');
  expect(iosMarketingVersions.every((version) => version === expectedMarketingVersion), 'iOS marketing versions match package major/minor', iosMarketingVersions.join(', '));
  expect(iosBuildNumbers.length > 0, 'iOS build number entries exist', iosBuildNumbers.join(', ') || 'missing');
  expect(uniqueValues([androidVersionCode, ...iosBuildNumbers]).length === 1, 'iOS and Android build numbers match', uniqueValues([androidVersionCode, ...iosBuildNumbers]).join(', '));
  expect(xcodeProject.includes('PrivacyInfo.xcprivacy'), 'iOS privacy manifest is referenced by Xcode project');
  expect(xcodeProject.includes('PrivacyInfo.xcprivacy in Resources'), 'iOS privacy manifest is bundled as a resource');

  const iosIcon = await imageMetadata('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
  expect(iosIcon?.width === 1024 && iosIcon?.height === 1024, 'iOS App Store icon is 1024x1024');

  const iosSplash = await imageMetadata('ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png');
  expect(iosSplash?.width === 2732 && iosSplash?.height === 2732, 'iOS splash source is 2732x2732');

  const storeIcon = await imageMetadata('store-assets/shared/app-icon-1024.png');
  expect(storeIcon?.width === 1024 && storeIcon?.height === 1024, 'Store asset app icon is 1024x1024');

  const playFeatureGraphic = await imageMetadata('store-assets/google-play/feature-graphic.png');
  expect(
    playFeatureGraphic?.width === 1024 && playFeatureGraphic?.height === 500,
    'Google Play feature graphic is 1024x500',
    playFeatureGraphic ? `${playFeatureGraphic.width}x${playFeatureGraphic.height}` : undefined
  );

  const storeScreenshotSlugs = [
    '01-game-modes',
    '02-perfect-passport',
    '03-share-score',
    '04-journey-mode',
    '05-flag-jeopardy',
    '06-flag-runner',
  ];

  for (const slug of storeScreenshotSlugs) {
    const appStoreScreenshot = await imageMetadata(`store-assets/app-store/iphone-6-7/${slug}.png`);
    expect(
      appStoreScreenshot?.width === 1290 && appStoreScreenshot?.height === 2796,
      `${slug} App Store screenshot is 1290x2796`,
      appStoreScreenshot ? `${appStoreScreenshot.width}x${appStoreScreenshot.height}` : undefined
    );

    const googlePlayScreenshot = await imageMetadata(`store-assets/google-play/phone-screenshots/${slug}.png`);
    expect(
      googlePlayScreenshot?.width === 1080 && googlePlayScreenshot?.height === 1920,
      `${slug} Google Play phone screenshot is 1080x1920`,
      googlePlayScreenshot ? `${googlePlayScreenshot.width}x${googlePlayScreenshot.height}` : undefined
    );
  }

  const androidIcon = await imageMetadata('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png');
  expect(androidIcon?.width === 192 && androidIcon?.height === 192, 'Android xxxhdpi launcher icon is 192x192');

  const androidSplash = await imageMetadata('android/app/src/main/res/drawable/splash.png');
  expect(Boolean(androidSplash?.width && androidSplash?.height), 'Android default splash image has dimensions');

  const modeImages = [
    'journey',
    'perfect-passport',
    'jeopardy',
    'arcade',
    'around-the-world',
    'flag-runner',
  ];

  for (const mode of modeImages) {
    const coverMetadata = await imageMetadata(`public/modes/${mode}.webp`);
    expect(
      Boolean((coverMetadata?.width ?? 0) >= 700 && (coverMetadata?.height ?? 0) >= 460),
      `${mode} mode cover is card sized`,
      coverMetadata ? `${coverMetadata.width}x${coverMetadata.height}` : undefined
    );

    const ogMetadata = await imageMetadata(`public/og/modes/${mode}.jpg`);
    expect(
      ogMetadata?.width === 1200 && ogMetadata?.height === 630,
      `${mode} mode OG image is 1200x630`,
      ogMetadata ? `${ogMetadata.width}x${ogMetadata.height}` : undefined
    );
  }

  expect(existsSync(resolve('docs/mobile-launch-checklist.md')), 'Mobile launch checklist exists');
  expect(existsSync(resolve('docs/mobile-store-metadata.md')), 'Mobile store metadata draft exists');
  expect(existsSync(resolve('docs/mobile-store-account-handoff.md')), 'Mobile store account handoff exists');
  expect(existsSync(resolve('docs/mobile-release-runbook.md')), 'Mobile release runbook exists');
  expect(existsSync(resolve('docs/mobile-privacy-data-inventory.md')), 'Mobile privacy data inventory exists');
  expect(existsSync(resolve('docs/mobile-data-deletion-runbook.md')), 'Mobile data deletion runbook exists');
  expect(existsSync(resolve('docs/mobile-store-privacy-form-answers.md')), 'Mobile store privacy form answers exist');
  expect(existsSync(resolve('docs/mobile-store-submission-package.md')), 'Mobile store submission package exists');
  expect(existsSync(resolve('docs/mobile-installed-build-qa.md')), 'Mobile installed-build QA checklist exists');
  expect(existsSync(resolve('docs/mobile-local-device-coverage.md')), 'Mobile local device coverage checklist exists');
  expect(existsSync(resolve('docs/mobile-release-evidence-template.md')), 'Mobile release evidence template exists');
  expect(existsSync(resolve('.github/workflows/mobile-preflight.yml')), 'Mobile preflight GitHub Actions workflow exists');
  expect(existsSync(resolve('scripts/mobile-signing-preflight.ts')), 'Mobile signing preflight script exists');
  expect(existsSync(resolve('scripts/check-mobile-version-consistency.ts')), 'Mobile version consistency checker script exists');
  expect(existsSync(resolve('scripts/check-mobile-public-urls.ts')), 'Mobile public URL check script exists');
  expect(existsSync(resolve('scripts/check-mobile-native-privacy.ts')), 'Mobile native privacy checker script exists');
  expect(existsSync(resolve('scripts/check-mobile-store-submission.ts')), 'Mobile store submission checker script exists');
  expect(existsSync(resolve('scripts/check-mobile-installed-qa-plan.ts')), 'Mobile installed-build QA plan checker script exists');
  expect(existsSync(resolve('scripts/check-mobile-local-device-coverage.ts')), 'Mobile local device coverage checker script exists');
  expect(existsSync(resolve('scripts/check-mobile-bundle-cleanliness.ts')), 'Mobile bundle cleanliness checker script exists');
  expect(existsSync(resolve('scripts/check-mobile-store-handoff.ts')), 'Mobile store handoff checker script exists');
  expect(existsSync(resolve('scripts/check-mobile-launch-blockers.ts')), 'Mobile launch blocker checker script exists');
  expect(existsSync(resolve('scripts/init-mobile-release-evidence.ts')), 'Mobile release evidence initializer script exists');
  expect(existsSync(resolve('scripts/check-mobile-release-evidence.ts')), 'Mobile release evidence checker script exists');
  expect(existsSync(resolve('scripts/check-mobile-release-artifacts.ts')), 'Mobile release artifact checker script exists');
  expect(existsSync(resolve('scripts/mobile-go-live-check.ts')), 'Mobile go-live gate script exists');
  expect(existsSync(resolve('scripts/generate-mobile-readiness-report.ts')), 'Mobile readiness report script exists');
  expect(existsSync(resolve('scripts/package-store-submission.ts')), 'Store submission packaging script exists');
  expect(existsSync(resolve('android/keystore.properties.example')), 'Android keystore template exists');
  expect(existsSync(resolve('store-assets/README.md')), 'Store assets README exists');
  expect(existsSync(resolve('src/pages/PrivacyPage.tsx')), 'Privacy page source exists');
  expect(existsSync(resolve('src/pages/TermsPage.tsx')), 'Terms page source exists');
  expect(existsSync(resolve('src/pages/SupportPage.tsx')), 'Support page source exists');

  const launchChecklist = await readFile(resolve('docs/mobile-launch-checklist.md'), 'utf8');
  expect(
    launchChecklist.includes('- [x] Strict release signing gate exists: `npm run mobile:signing:release`'),
    'Launch checklist records strict release signing gate'
  );

  const storeMetadata = await readFile(resolve('docs/mobile-store-metadata.md'), 'utf8');
  expect(storeMetadata.includes('Short description:'), 'Google Play short description is drafted');
  expect(storeMetadata.includes('Full description:'), 'Google Play full description is drafted');
  expect(storeMetadata.includes('Subtitle:'), 'App Store subtitle is drafted');
  expect(storeMetadata.includes('Promotional text:'), 'App Store promotional text is drafted');
  expect(storeMetadata.includes('Keywords:'), 'App Store keywords are drafted');
  expect(storeMetadata.includes('Category: Games / Educational / Trivia'), 'Store category selection is drafted');
  expect(storeMetadata.includes('No gambling or loot boxes.'), 'Rating questionnaire notes are drafted');

  const storeAccountHandoff = await readFile(resolve('docs/mobile-store-account-handoff.md'), 'utf8');
  for (const term of [
    'Apple Developer Team ID',
    'Google Play developer account holder',
    'Copyright holder',
    'Do not add passwords',
    'npm run mobile:build:ios:archive',
    'npm run mobile:build:android:release',
    'com.flagarcade.app',
  ]) {
    expect(storeAccountHandoff.includes(term), `Store account handoff covers ${term}`);
  }

  const storeAssetsReadme = await readFile(resolve('store-assets/README.md'), 'utf8');
  expect(storeAssetsReadme.includes('npm run package:store-submission'), 'Store assets README documents packaging command');
  expect(storeAssetsReadme.includes('dist/mobile-readiness-report.md'), 'Store assets README documents readiness report output');

  const mobilePreflightWorkflow = await readFile(resolve('.github/workflows/mobile-preflight.yml'), 'utf8');
  const mobilePreflightWorkflowTerms = [
    'Mobile Launch Preflight',
    'pull_request',
    'push',
    'workflow_dispatch',
    'macos-latest',
    'actions/checkout@v4',
    'actions/setup-node@v4',
    'node-version: 25',
    'npm ci',
    'npm run mobile:preflight',
    'npm run mobile:urls:check',
    'actions/upload-artifact@v4',
    'dist/mobile-store-submission',
    'dist/flag-arcade-mobile-store-submission.zip',
    'dist/mobile-readiness-report.md',
    'dist/mobile-launch-blockers.md',
  ];
  for (const term of mobilePreflightWorkflowTerms) {
    expect(mobilePreflightWorkflow.includes(term), `Mobile preflight workflow covers ${term}`);
  }

  const storeSubmissionPackage = await readFile(resolve('docs/mobile-store-submission-package.md'), 'utf8');
  expect(storeSubmissionPackage.includes('npm run mobile:preflight'), 'Submission package documents mobile preflight command');
  expect(storeSubmissionPackage.includes('npm run mobile:urls:check'), 'Submission package documents public URL check command');
  expect(storeSubmissionPackage.includes('npm run mobile:version:check'), 'Submission package documents version consistency checker command');
  expect(storeSubmissionPackage.includes('npm run mobile:privacy:check'), 'Submission package documents native privacy checker command');
  expect(storeSubmissionPackage.includes('npm run mobile:store:check'), 'Submission package documents store submission checker command');
  expect(storeSubmissionPackage.includes('npm run mobile:qa:plan'), 'Submission package documents installed-build QA plan checker command');
  expect(storeSubmissionPackage.includes('npm run mobile:devices:check'), 'Submission package documents local device coverage checker command');
  expect(storeSubmissionPackage.includes('npm run mobile:bundle:check'), 'Submission package documents bundle cleanliness checker command');
  expect(storeSubmissionPackage.includes('npm run mobile:blockers:check'), 'Submission package documents launch blocker checker command');
  expect(storeSubmissionPackage.includes('npm run mobile:handoff:check'), 'Submission package documents store handoff checker command');
  expect(storeSubmissionPackage.includes('npm run mobile:signing:preflight'), 'Submission package documents signing preflight command');
  expect(storeSubmissionPackage.includes('npm run mobile:signing:release'), 'Submission package documents strict release signing command');
  expect(storeSubmissionPackage.includes('npm run mobile:evidence:init'), 'Submission package documents release evidence initializer command');
  expect(storeSubmissionPackage.includes('npm run mobile:evidence:self-test'), 'Submission package documents release evidence self-test command');
  expect(storeSubmissionPackage.includes('npm run mobile:evidence:check'), 'Submission package documents release evidence checker command');
  expect(storeSubmissionPackage.includes('npm run mobile:artifacts:check'), 'Submission package documents release artifact checker command');
  expect(storeSubmissionPackage.includes('npm run mobile:go-live:check'), 'Submission package documents go-live gate command');
  expect(storeSubmissionPackage.includes('npm run mobile:build:ios:archive'), 'Submission package documents iOS archive command');
  expect(
    storeSubmissionPackage.includes('npm run mobile:go-live:check -- --evidence docs/release-evidence/<release-file>.md --android-aab android/app/build/outputs/bundle/release/app-release.aab --ios-archive ios/App/build/FlagArcade.xcarchive'),
    'Submission package documents go-live gate with signed artifact paths'
  );
  expect(storeSubmissionPackage.includes('npm run package:store-submission'), 'Submission package documents packaging command');
  expect(storeSubmissionPackage.includes('dist/mobile-store-submission'), 'Submission package documents packaging output path');
  expect(storeSubmissionPackage.includes('dist/flag-arcade-mobile-store-submission.zip'), 'Submission package documents packaging archive path');
  expect(storeSubmissionPackage.includes('dist/mobile-readiness-report.md'), 'Submission package documents readiness report path');
  expect(storeSubmissionPackage.includes('dist/mobile-launch-blockers.md'), 'Submission package documents launch blocker report path');
  expect(storeSubmissionPackage.includes('source git commit'), 'Submission package documents handoff source commit');
  expect(storeSubmissionPackage.includes('SHA-256 checksums'), 'Submission package documents handoff checksums');
  expect(storeSubmissionPackage.includes('byte count'), 'Submission package documents handoff byte counts');
  expect(storeSubmissionPackage.includes('com.flagarcade.app'), 'Submission package includes bundle/package id');
  expect(storeSubmissionPackage.includes('docs/mobile-store-account-handoff.md'), 'Submission package includes store account handoff path');
  expect(storeSubmissionPackage.includes('docs/mobile-release-runbook.md'), 'Submission package includes release runbook path');
  expect(storeSubmissionPackage.includes('store-assets/shared/app-icon-1024.png'), 'Submission package includes app icon path');
  expect(storeSubmissionPackage.includes('store-assets/google-play/feature-graphic.png'), 'Submission package includes Play feature graphic path');
  expect(storeSubmissionPackage.includes('android/app/build/outputs/bundle/release/app-release.aab'), 'Submission package includes Android AAB path');
  expect(storeSubmissionPackage.includes('App Review notes'), 'Submission package includes App Review notes handoff');
  expect(storeSubmissionPackage.includes('Google Play testing notes'), 'Submission package includes Google Play testing notes handoff');
  expect(storeSubmissionPackage.includes('docs/mobile-privacy-data-inventory.md'), 'Submission package links privacy inventory');
  expect(storeSubmissionPackage.includes('docs/mobile-store-privacy-form-answers.md'), 'Submission package links privacy form answers');
  expect(storeSubmissionPackage.includes('docs/mobile-data-deletion-runbook.md'), 'Submission package links deletion runbook');
  for (const slug of storeScreenshotSlugs) {
    expect(
      storeSubmissionPackage.includes(`store-assets/app-store/iphone-6-7/${slug}.png`),
      `Submission package includes ${slug} App Store screenshot`
    );
    expect(
      storeSubmissionPackage.includes(`store-assets/google-play/phone-screenshots/${slug}.png`),
      `Submission package includes ${slug} Google Play screenshot`
    );
  }

  const packageStoreSubmission = await readFile(resolve('scripts/package-store-submission.ts'), 'utf8');
  const packageStoreSubmissionTerms = [
    'dist/mobile-store-submission',
    'dist/mobile-readiness-report.md',
    'dist/mobile-launch-blockers.md',
    'mobile-readiness-report.md',
    'mobile-launch-blockers.md',
    'flag-arcade-mobile-store-submission.zip',
    'execFileSync',
    'manifest.json',
    'gitCommit',
    'Git commit',
    'archivePath',
    'sha256',
    'bytes',
    'createHash',
    'store-assets/shared/app-icon-1024.png',
    'store-assets/google-play/feature-graphic.png',
    'store-assets/app-store/iphone-6-7',
    'store-assets/google-play/phone-screenshots',
    'docs/mobile-store-account-handoff.md',
    'docs/mobile-store-submission-package.md',
    'docs/mobile-store-privacy-form-answers.md',
    'docs/mobile-release-runbook.md',
    'docs/mobile-release-evidence-template.md',
    'docs/mobile-local-device-coverage.md',
    'docs/release-evidence',
    'npm run mobile:evidence:init',
    'npm run mobile:evidence:check',
    'npm run mobile:blockers:check',
    'npm run mobile:handoff:check',
    'Signed iOS archive uploaded to TestFlight',
    'Signed Android AAB uploaded to Google Play internal testing',
  ];
  for (const term of packageStoreSubmissionTerms) {
    expect(packageStoreSubmission.includes(term), `Store submission packager covers ${term}`);
  }

  const storeHandoffChecker = await readFile(resolve('scripts/check-mobile-store-handoff.ts'), 'utf8');
  const storeHandoffCheckerTerms = [
    'dist/mobile-store-submission/manifest.json',
    'dist/flag-arcade-mobile-store-submission.zip',
    'mobile-launch-blockers.md',
    'gitCommit',
    'Manifest git commit matches current HEAD',
    'sha256',
    'bytes',
    'createHash',
    'unzip',
    'Archive includes packaged file',
    'Manifest includes required handoff file',
    'docs/mobile-release-runbook.md',
    'Manifest keeps external blocker visible',
    'Signed iOS archive uploaded to TestFlight',
    'Signed Android AAB uploaded to Google Play internal testing',
  ];
  for (const term of storeHandoffCheckerTerms) {
    expect(storeHandoffChecker.includes(term), `Store handoff checker covers ${term}`);
  }

  const launchBlockerChecker = await readFile(resolve('scripts/check-mobile-launch-blockers.ts'), 'utf8');
  const launchBlockerCheckerTerms = [
    'docs/mobile-launch-checklist.md',
    'dist/mobile-launch-blockers.md',
    'Open blocker count',
    'Launch blocker report was generated for current git commit',
    'Launch blocker report app version matches package.json',
    'Launch blocker report matches unchecked checklist items',
    'Signed Android AAB and signed iOS App Store archive exist and pass',
    'TestFlight and Google Play internal builds are uploaded',
    'App Store Connect privacy labels and Google Play Data Safety forms are submitted',
    'npm run mobile:evidence:check',
    'npm run mobile:go-live:check',
    '## Closeout Commands',
    'npm run mobile:signing:release',
    'npm run mobile:build:android:release',
    'npm run mobile:build:ios:archive',
    'npm run mobile:artifacts:check -- --android-aab android/app/build/outputs/bundle/release/app-release.aab --ios-archive ios/App/build/FlagArcade.xcarchive --manifest docs/release-evidence/mobile-<version>-build-<build>-<commit>-artifacts.json',
    'docs/release-evidence/mobile-<version>-build-<build>-<commit>.md',
    'ios/App/build/FlagArcade.xcarchive',
  ];
  for (const term of launchBlockerCheckerTerms) {
    expect(launchBlockerChecker.includes(term), `Launch blocker checker covers ${term}`);
  }

  const signingPreflight = await readFile(resolve('scripts/mobile-signing-preflight.ts'), 'utf8');
  const signingPreflightTerms = [
    'android/keystore.properties',
    'android/*.jks',
    'android/*.keystore',
    'keystore.properties.example',
    'storePassword',
    'keyAlias',
    'keyPassword',
    'DEVELOPMENT_TEAM',
    'PRODUCT_BUNDLE_IDENTIFIER = com.flagarcade.app',
    'iOS Apple Developer Team is not set',
    '--strict',
    'Strict signing preflight failed because release signing warnings remain.',
  ];
  for (const term of signingPreflightTerms) {
    expect(signingPreflight.includes(term), `Signing preflight covers ${term}`);
  }

  const publicUrlCheck = await readFile(resolve('scripts/check-mobile-public-urls.ts'), 'utf8');
  const publicUrlCheckTerms = [
    'https://flagarcade.com',
    'https://flagarcade.com/privacy',
    'https://flagarcade.com/terms',
    'https://flagarcade.com/support',
    'Flag Arcade',
    'Privacy',
    'Terms',
    'Support',
    'text/html',
  ];
  for (const term of publicUrlCheckTerms) {
    expect(publicUrlCheck.includes(term), `Public URL check covers ${term}`);
  }

  const versionConsistencyChecker = await readFile(resolve('scripts/check-mobile-version-consistency.ts'), 'utf8');
  const versionConsistencyCheckerTerms = [
    'package.json',
    'capacitor.config.ts',
    'android/app/build.gradle',
    'ios/App/App.xcodeproj/project.pbxproj',
    'docs/mobile-store-metadata.md',
    'docs/mobile-store-submission-package.md',
    'com.flagarcade.app',
    'Flag Arcade',
    'versionCode',
    'versionName',
    'MARKETING_VERSION',
    'CURRENT_PROJECT_VERSION',
    'Build number / version code',
  ];
  for (const term of versionConsistencyCheckerTerms) {
    expect(versionConsistencyChecker.includes(term), `Version consistency checker covers ${term}`);
  }

  const nativePrivacyChecker = await readFile(resolve('scripts/check-mobile-native-privacy.ts'), 'utf8');
  const nativePrivacyCheckerTerms = [
    'android.permission.INTERNET',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.CAMERA',
    'android.permission.RECORD_AUDIO',
    'android.permission.READ_CONTACTS',
    'android.permission.POST_NOTIFICATIONS',
    'android:allowBackup="false"',
    'android:fullBackupContent="false"',
    'android:usesCleartextTraffic="false"',
    'data_extraction_rules.xml',
    'file_paths.xml',
    'ITSAppUsesNonExemptEncryption',
    'NSCameraUsageDescription',
    'NSMicrophoneUsageDescription',
    'NSLocationWhenInUseUsageDescription',
    'NSUserTrackingUsageDescription',
    'PrivacyInfo.xcprivacy',
    'NSPrivacyTracking',
    'NSPrivacyCollectedDataTypeProductInteraction',
    'Android Auto Backup/device transfer is disabled',
  ];
  for (const term of nativePrivacyCheckerTerms) {
    expect(nativePrivacyChecker.includes(term), `Native privacy checker covers ${term}`);
  }

  const storeSubmissionChecker = await readFile(resolve('scripts/check-mobile-store-submission.ts'), 'utf8');
  const storeSubmissionCheckerTerms = [
    'App Store subtitle fits 30-character limit',
    'App Store promotional text fits 170-character limit',
    'App Store keywords fit 100-character limit',
    'Google Play short description fits 80-character limit',
    'Google Play full description fits 4000-character limit',
    'store-assets/shared/app-icon-1024.png',
    'store-assets/google-play/feature-graphic.png',
    'store-assets/app-store/iphone-6-7',
    'store-assets/google-play/phone-screenshots',
    'docs/mobile-store-privacy-form-answers.md',
    'docs/mobile-privacy-data-inventory.md',
    'npm run mobile:evidence:check',
  ];
  for (const term of storeSubmissionCheckerTerms) {
    expect(storeSubmissionChecker.includes(term), `Store submission checker covers ${term}`);
  }

  const installedQaPlanChecker = await readFile(resolve('scripts/check-mobile-installed-qa-plan.ts'), 'utf8');
  const installedQaPlanCheckerTerms = [
    'docs/mobile-installed-build-qa.md',
    'docs/mobile-release-evidence-template.md',
    'docs/mobile-release-runbook.md',
    'Physical iPhone',
    'Small-screen iPhone simulator or device',
    'Physical Android phone',
    'Large Android emulator or device',
    'Journey Mode',
    'Perfect Passport share',
    'Flag Jeopardy Type',
    'Around the World',
    'Flag Runner',
    'Native back',
    'Auth callback',
    'Offline launch',
    'Poor network',
    'Resume/background',
    'Legal links',
    'npm run mobile:evidence:init',
    'npm run mobile:evidence:check',
  ];
  for (const term of installedQaPlanCheckerTerms) {
    expect(installedQaPlanChecker.includes(term), `Installed-build QA plan checker covers ${term}`);
  }

  const readinessReportScript = await readFile(resolve('scripts/generate-mobile-readiness-report.ts'), 'utf8');
  const readinessReportTerms = [
    'Mobile Launch Readiness Report',
    'Mobile Launch Blockers',
    'Checklist status',
    'Locally Proven',
    'Store Handoff Outputs',
    'Remaining External Requirements',
    'Launch Decision',
    'Open blocker count',
    'Closeout Commands',
    'npm run mobile:build:android:release',
    'npm run mobile:build:ios:archive',
    'npm run mobile:artifacts:check -- --android-aab android/app/build/outputs/bundle/release/app-release.aab --ios-archive ios/App/build/FlagArcade.xcarchive --manifest docs/release-evidence/mobile-<version>-build-<build>-<commit>-artifacts.json',
    'docs/release-evidence/mobile-<version>-build-<build>-<commit>.md',
    'npm run mobile:preflight',
    'npm run mobile:version:check',
    'npm run mobile:privacy:check',
    'npm run mobile:store:check',
    'npm run mobile:qa:plan',
    'npm run mobile:devices:check',
    'npm run mobile:bundle:check',
    'npm run mobile:urls:check',
    'npm run mobile:evidence:init',
    'npm run mobile:evidence:check',
    'npm run mobile:blockers:check',
    'docs/mobile-launch-checklist.md',
    'dist/mobile-readiness-report.md',
    'dist/mobile-launch-blockers.md',
  ];
  for (const term of readinessReportTerms) {
    expect(readinessReportScript.includes(term), `Readiness report script covers ${term}`);
  }

  const installedBuildQa = await readFile(resolve('docs/mobile-installed-build-qa.md'), 'utf8');
  const localDeviceCoverage = await readFile(resolve('docs/mobile-local-device-coverage.md'), 'utf8');
  const requiredQaTerms = [
    'Journey Mode',
    'Perfect Passport',
    'Flag Jeopardy Easy',
    'Flag Jeopardy Type',
    'Arcade Mode',
    'Around the World',
    'Flag Runner',
    'Perfect Passport share',
    'Native back',
    'Auth callback',
    'Offline launch',
    'Poor network',
    'Legal links',
    'TestFlight',
    'Play internal test',
    'Store Build ID Confirmation',
    'not a local debug build',
    'App Store Connect / TestFlight build number',
    'Google Play internal test release name and version code',
  ];
  for (const term of requiredQaTerms) {
    expect(installedBuildQa.includes(term), `Installed-build QA covers ${term}`);
  }
  expect(
    installedBuildQa.includes('npm run mobile:evidence:init')
      && installedBuildQa.includes('npm run mobile:evidence:check')
      && installedBuildQa.includes('docs/release-evidence/'),
    'Installed-build QA links release evidence initializer and checker'
  );

  const localDeviceCoverageTerms = [
    'iPhone SE or smallest available iPhone simulator',
    'Latest available iPhone simulator',
    'FlagArcade_Pixel_8_API_36',
    'Large Android emulator or device',
    'Journey Mode',
    'Perfect Passport',
    'Flag Jeopardy Easy',
    'Flag Jeopardy Type',
    'Arcade Mode',
    'Around the World',
    'Flag Runner',
    'Native back',
    'Offline launch',
    'Poor network',
    'docs/release-evidence/local-device/',
    'not the final store gate',
  ];
  for (const term of localDeviceCoverageTerms) {
    expect(localDeviceCoverage.includes(term), `Local device coverage covers ${term}`);
  }

  const releaseEvidenceTemplate = await readFile(resolve('docs/mobile-release-evidence-template.md'), 'utf8');
  const releaseEvidenceTerms = [
    'Release Candidate',
    'Build Artifacts',
    'Signing Evidence',
    'Installed Build Matrix',
    'App build shown',
    'Build number / version code',
    'Required Smoke Evidence',
    'Store Console Evidence',
    'Failure Log',
    'Final Signoff',
    'TestFlight',
    'Play internal test',
    'Perfect Passport share sheet',
    'Flag Jeopardy Type mode',
    'Android native back behavior',
    'Auth callback/deep link',
    'App Privacy labels',
    'Data Safety',
    'Pre-launch report',
    'Every required row must include an evidence URL or repo-relative evidence file path',
    'Repo-relative evidence file paths must exist',
    'Artifact manifest',
    'Copyright holder',
    'Apple Developer Team ID',
    'Google Play developer account',
    'must match this release candidate',
    'Not verified',
  ];
  for (const term of releaseEvidenceTerms) {
    expect(releaseEvidenceTemplate.includes(term), `Release evidence template covers ${term}`);
  }

  const releaseEvidenceInitializer = await readFile(resolve('scripts/init-mobile-release-evidence.ts'), 'utf8');
  const releaseEvidenceInitializerTerms = [
    'docs/mobile-release-evidence-template.md',
    'docs/release-evidence',
    '--build',
    '--owner',
    '--dry-run',
    '--force',
    'Git commit',
    'Release branch',
    'Evidence owner',
    'Terms URL verified',
    'Artifact manifest',
    'Copyright holder',
    'Apple Developer Team ID',
    'Google Play developer account',
    '-artifacts.json',
    'Artifact manifest path',
    'mobile:artifacts:check',
    'npm run mobile:urls:check',
  ];
  for (const term of releaseEvidenceInitializerTerms) {
    expect(releaseEvidenceInitializer.includes(term), `Release evidence initializer covers ${term}`);
  }

  const releaseEvidenceChecker = await readFile(resolve('scripts/check-mobile-release-evidence.ts'), 'utf8');
  const releaseRunbook = await readFile(resolve('docs/mobile-release-runbook.md'), 'utf8');
  const releaseEvidenceCheckerTerms = [
    '--file',
    '--self-test',
    '--self-test-failures',
    'App version',
    'Build number / version code',
    'Git commit',
    'currentReleaseContext',
    'Release evidence app version matches package.json',
    'Release evidence build number matches native build numbers',
    'Release evidence git commit matches current HEAD',
    'Release evidence date is YYYY-MM-DD',
    'is not future-dated',
    'todayIsoDate',
    'Public site URL verified',
    'requiredUrlVerificationFields',
    'requiredBuildArtifactRows',
    'requiredSigningRows',
    'requiredCompleteSignoffFields',
    'requiredFilledSignoffFields',
    'Terms URL verified',
    'Copyright holder',
    'Apple Developer Team ID',
    'Google Play developer account',
    'build artifact is uploaded',
    'Artifact manifest',
    'Artifact manifest evidence link is valid',
    'Artifact manifest is local JSON path',
    'Artifact manifest JSON can be parsed',
    'Artifact manifest git commit matches release evidence',
    'Artifact manifest app version matches release evidence',
    'Artifact manifest build number matches release evidence',
    'Artifact manifest includes signed Android AAB',
    'Artifact manifest includes signed iOS archive',
    'isPlaceholderEvidenceTarget',
    'Placeholder evidence target',
    'malformed local artifact manifest',
    'signing evidence is verified',
    'requiredInstalledBuildRows',
    'requiredSmokeRows',
    'requiredStoreConsoleRows',
    'Installed build matrix has passing',
    'app build shown matches release build',
    'wrong installed build number',
    'invalid approval date',
    'future approval date',
    'placeholder external evidence URL',
    'local Perfect Passport challenge URL',
    'requirePublicChallengeLinkNote',
    'Perfect Passport copied public challenge link notes include public challenge URL',
    'open failure log row',
    'invalid failure severity',
    'Approval date is YYYY-MM-DD',
    'Required Smoke Evidence',
    'Store Console Evidence',
    'evidence link is valid',
    'Failure log has no unresolved rows',
    'Failure log row 1 Retest result passed',
    'Failure log row 1 Severity is valid',
    'requireSeverity',
    'Local evidence file does not exist',
    'negativeSelfTestFindings',
    'Negative self-test rejects',
    'stale git commit',
    'missing repo-relative evidence file',
    'missing copyright holder',
    'external artifact manifest',
    'weak final signoff value',
    'existsSync',
    'Physical iPhone',
    'Large Android emulator or device',
    'Fresh launch and splash',
    'Home screen icon on light/dark wallpaper',
    'Flag Runner touch controls and restart',
    'Google Play Console',
    'Pre-launch report',
    'iOS installed build smoke passed',
    'Android installed build smoke passed',
    'Store privacy forms submitted',
    'Signed release artifacts uploaded',
    'not run',
    'not uploaded',
    'not complete',
    'not verified',
  ];
  for (const term of releaseEvidenceCheckerTerms) {
    expect(releaseEvidenceChecker.includes(term), `Release evidence checker covers ${term}`);
  }

  expect(
    releaseRunbook.includes('The release evidence checker requires the `Artifact manifest` field to be a local JSON path'),
    'Release runbook documents local artifact manifest enforcement'
  );
  expect(
    releaseRunbook.includes('requires the final copyright holder, Apple Developer Team ID, and Google Play developer account'),
    'Release runbook documents final account evidence requirements'
  );
  expect(
    releaseRunbook.includes('Future-dated evidence is rejected'),
    'Release runbook documents future-dated evidence rejection'
  );
  expect(
    releaseEvidenceTemplate.includes('future-dated evidence is rejected'),
    'Release evidence template documents future-dated evidence rejection'
  );
  expect(
    releaseRunbook.includes('placeholder hosts such as `example.com`'),
    'Release runbook documents placeholder evidence URL rejection'
  );
  expect(
    releaseRunbook.includes('paste the actual copied `https://flagarcade.com` challenge URL'),
    'Release runbook documents Perfect Passport public challenge URL evidence'
  );
  expect(
    releaseEvidenceTemplate.includes('Placeholder evidence hosts such as `example.com`'),
    'Release evidence template documents placeholder evidence URL rejection'
  );
  expect(
    releaseRunbook.includes('unresolved failure rows are rejected'),
    'Release runbook documents unresolved failure row rejection'
  );
  expect(
    releaseEvidenceTemplate.includes('Every non-empty failure row must use Severity'),
    'Release evidence template documents failure row closure requirements'
  );
  expect(
    storeSubmissionPackage.includes('external artifact manifests'),
    'Submission package documents external artifact manifest rejection'
  );
  expect(
    storeSubmissionPackage.includes('Fill copyright holder, Apple Developer Team ID, and Google Play developer account'),
    'Submission package documents final account evidence fields'
  );

  const releaseArtifactChecker = await readFile(resolve('scripts/check-mobile-release-artifacts.ts'), 'utf8');
  const releaseArtifactCheckerTerms = [
    '--android-aab',
    '--ios-archive',
    '--manifest',
    'sha256',
    'Release artifact manifest written',
    'android/app/build/outputs/bundle/release/app-release.aab',
    'ios/App/build/FlagArcade.xcarchive',
    'BundleConfig.pb',
    'AndroidManifest.xml',
    'Android AAB includes signing signature file',
    'Android AAB includes signing certificate block',
    'Products/Applications',
    'Info.plist',
    '_CodeSignature/CodeResources',
    'embedded.mobileprovision',
    'codesign',
    'iOS archived app code signature verifies with codesign',
    'com.flagarcade.app',
    'CFBundleShortVersionString',
    'CFBundleVersion',
  ];
  for (const term of releaseArtifactCheckerTerms) {
    expect(releaseArtifactChecker.includes(term), `Release artifact checker covers ${term}`);
  }

  const goLiveGate = await readFile(resolve('scripts/mobile-go-live-check.ts'), 'utf8');
  const goLiveGateTerms = [
    '--evidence',
    '--android-aab',
    '--ios-archive',
    '--manifest',
    '--skip-artifacts',
    '--skip-urls',
    'Provide both --android-aab and --ios-archive for the final go-live gate',
    'Do not combine --skip-artifacts with --android-aab or --ios-archive.',
    'Artifact manifest',
    'Full go-live artifact verification needs a local Artifact manifest path',
    'Artifact generation was skipped. Verified evidence must already include the local artifact manifest',
    'mobile:preflight',
    'mobile:evidence:check',
    'mobile:artifacts:check',
    'mobile:urls:check',
    'Mobile go-live gate passed.',
    'Signed artifacts, release evidence, preflight, and public URLs passed.',
    'App Store Connect',
    'Google Play Console',
  ];
  for (const term of goLiveGateTerms) {
    expect(goLiveGate.includes(term), `Go-live gate covers ${term}`);
  }

  expect(
    storeSubmissionPackage.includes('previously generated local artifact manifest'),
    'Submission package documents skip-artifacts still requires a local artifact manifest'
  );
  expect(
    releaseRunbook.includes('external manifest links are not accepted by the go-live gate'),
    'Release runbook documents skip-artifacts local manifest requirement'
  );

  const deletionRunbook = await readFile(resolve('docs/mobile-data-deletion-runbook.md'), 'utf8');
  const deletionRunbookTerms = [
    'Delete Account',
    'support@flagarcade.com',
    'within 30 days',
    'public.user_progress',
    'public.leaderboard_scores',
    'public.leaderboard_monthly',
    'public.play_sessions',
    'Supabase Auth',
  ];
  for (const term of deletionRunbookTerms) {
    expect(deletionRunbook.includes(term), `Deletion runbook covers ${term}`);
  }

  const privacyFormAnswers = await readFile(resolve('docs/mobile-store-privacy-form-answers.md'), 'utf8');
  const privacyFormAnswerTerms = [
    'Apple App Privacy Details',
    'Google Play Data Safety',
    'Tracking',
    'Data linked to the user',
    'Data not linked to the user',
    'Data encrypted in transit',
    'Delete Account',
    'support@flagarcade.com',
    'within 30 days',
    'android.permission.INTERNET',
    'PrivacyInfo.xcprivacy',
  ];
  for (const term of privacyFormAnswerTerms) {
    expect(privacyFormAnswers.includes(term), `Privacy form answers cover ${term}`);
  }

  const appSource = await readFile(resolve('src/App.tsx'), 'utf8');
  expect(appSource.includes('path="/privacy"'), 'Privacy route is registered');
  expect(appSource.includes('path="/terms"'), 'Terms route is registered');
  expect(appSource.includes('path="/support"'), 'Support route is registered');

  const navBarSource = await readFile(resolve('src/components/NavBar.tsx'), 'utf8');
  expect(navBarSource.includes('Delete Account'), 'Signed-in drawer includes Delete Account action');
  expect(navBarSource.includes('buildAccountDeletionMailto'), 'Signed-in drawer uses account deletion mailto helper');

  const supportSource = await readFile(resolve('src/pages/SupportPage.tsx'), 'utf8');
  expect(supportSource.includes('Account Deletion'), 'Support page includes account deletion section');
  expect(supportSource.includes('support@flagarcade.com') || supportSource.includes('SUPPORT_EMAIL'), 'Support page includes support email');

  const privacySource = await readFile(resolve('src/pages/PrivacyPage.tsx'), 'utf8');
  expect(privacySource.includes('Delete Account'), 'Privacy page mentions in-app Delete Account path');
  expect(privacySource.includes('within 30 days'), 'Privacy page includes deletion timing');
  expect(privacySource.includes('support@flagarcade.com') || privacySource.includes('SUPPORT_EMAIL'), 'Privacy page includes support email');

  const seoGeneratorSource = await readFile(resolve('scripts/generate-seo-pages.ts'), 'utf8');
  expect(seoGeneratorSource.includes('Delete Account'), 'Static privacy page mentions in-app Delete Account path');
  expect(seoGeneratorSource.includes('within 30 days'), 'Static privacy page includes deletion timing');
  expect(seoGeneratorSource.includes('support@flagarcade.com'), 'Static privacy page includes support email');

  const gitignore = await readFile(resolve('.gitignore'), 'utf8');
  expect(gitignore.includes('android/keystore.properties'), 'Android keystore properties are gitignored');
  expect(gitignore.includes('android/*.jks'), 'Android JKS files are gitignored');

  const failed = checks.filter((check) => !check.ok);
  for (const check of checks) {
    const prefix = check.ok ? 'PASS' : 'FAIL';
    console.log(`${prefix} ${check.label}${check.detail ? ` (${check.detail})` : ''}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} mobile launch audit check(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${checks.length} mobile launch audit checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
