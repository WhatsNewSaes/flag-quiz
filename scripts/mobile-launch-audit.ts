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

async function main() {
  const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  expect(Boolean(packageJson.scripts?.['mobile:audit']), 'package.json exposes mobile:audit');
  expect(Boolean(packageJson.scripts?.['mobile:build:android:debug']), 'package.json exposes Android debug build script');
  expect(Boolean(packageJson.scripts?.['mobile:build:android:release']), 'package.json exposes Android release AAB script');
  expect(Boolean(packageJson.scripts?.['mobile:build:ios:debug']), 'package.json exposes iOS debug build script');

  const capacitorConfig = await readFile(resolve('capacitor.config.ts'), 'utf8');
  expect(capacitorConfig.includes("appId: 'com.flagarcade.app'"), 'Capacitor app id is com.flagarcade.app');
  expect(capacitorConfig.includes("appName: 'Flag Arcade'"), 'Capacitor app name is Flag Arcade');
  expect(capacitorConfig.includes("webDir: 'dist'"), 'Capacitor webDir is dist');
  expect(capacitorConfig.includes('StatusBar'), 'Capacitor status bar plugin configured');
  expect(capacitorConfig.includes('SplashScreen'), 'Capacitor splash screen plugin configured');
  expect(capacitorConfig.includes('Keyboard'), 'Capacitor keyboard plugin configured');

  const androidManifest = await readFile(resolve('android/app/src/main/AndroidManifest.xml'), 'utf8');
  expect(androidManifest.includes('android:screenOrientation="portrait"'), 'Android main activity is portrait locked');
  expect(
    androidManifest.includes('android:scheme="com.flagarcade.app"')
      && androidManifest.includes('android:host="auth"')
      && androidManifest.includes('android:pathPrefix="/callback"'),
    'Android auth callback deep link is configured'
  );
  expect(androidManifest.includes('android.permission.INTERNET'), 'Android internet permission is present');

  const iosInfoRaw = execFileSync('plutil', ['-convert', 'json', '-o', '-', resolve('ios/App/App/Info.plist')], {
    encoding: 'utf8',
  });
  const iosInfo = JSON.parse(iosInfoRaw) as {
    CFBundleDisplayName?: string;
    UIRequiresFullScreen?: boolean;
    UISupportedInterfaceOrientations?: string[];
    'UISupportedInterfaceOrientations~ipad'?: string[];
    CFBundleURLTypes?: Array<{ CFBundleURLSchemes?: string[] }>;
  };
  expect(iosInfo.CFBundleDisplayName === 'Flag Arcade', 'iOS display name is Flag Arcade');
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
    iosInfo.CFBundleURLTypes?.some((entry) => entry.CFBundleURLSchemes?.includes('com.flagarcade.app')) === true,
    'iOS auth callback URL scheme is configured'
  );

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
  expect(existsSync(resolve('docs/mobile-release-runbook.md')), 'Mobile release runbook exists');
  expect(existsSync(resolve('android/keystore.properties.example')), 'Android keystore template exists');
  expect(existsSync(resolve('store-assets/README.md')), 'Store assets README exists');
  expect(existsSync(resolve('src/pages/PrivacyPage.tsx')), 'Privacy page source exists');
  expect(existsSync(resolve('src/pages/TermsPage.tsx')), 'Terms page source exists');
  expect(existsSync(resolve('src/pages/SupportPage.tsx')), 'Support page source exists');

  const appSource = await readFile(resolve('src/App.tsx'), 'utf8');
  expect(appSource.includes('path="/privacy"'), 'Privacy route is registered');
  expect(appSource.includes('path="/terms"'), 'Terms route is registered');
  expect(appSource.includes('path="/support"'), 'Support route is registered');

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
