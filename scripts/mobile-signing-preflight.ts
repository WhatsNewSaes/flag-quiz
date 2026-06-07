import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

type Finding = {
  status: 'PASS' | 'WARN' | 'FAIL';
  label: string;
  detail?: string;
};

const root = process.cwd();
const findings: Finding[] = [];

function resolve(...segments: string[]) {
  return path.join(root, ...segments);
}

function add(status: Finding['status'], label: string, detail?: string) {
  findings.push({ status, label, detail });
}

function hasPlaceholder(value: string) {
  return value.includes('replace-with') || value.trim().length === 0;
}

function parseProperties(source: string) {
  const properties = new Map<string, string>();
  for (const line of source.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    properties.set(trimmed.slice(0, separator).trim(), trimmed.slice(separator + 1).trim());
  }
  return properties;
}

async function main() {
  const gitignore = await readFile(resolve('.gitignore'), 'utf8');
  const androidBuildGradle = await readFile(resolve('android/app/build.gradle'), 'utf8');
  const xcodeProject = await readFile(resolve('ios/App/App.xcodeproj/project.pbxproj'), 'utf8');

  add(
    gitignore.includes('android/keystore.properties') ? 'PASS' : 'FAIL',
    'Android keystore.properties is gitignored'
  );
  add(gitignore.includes('android/*.jks') ? 'PASS' : 'FAIL', 'Android .jks files are gitignored');
  add(gitignore.includes('android/*.keystore') ? 'PASS' : 'FAIL', 'Android .keystore files are gitignored');

  const androidGradleSigningConfigured = androidBuildGradle.includes("rootProject.file('keystore.properties')")
    && androidBuildGradle.includes('signingConfigs')
    && androidBuildGradle.includes('signingConfig signingConfigs.release');
  add(
    androidGradleSigningConfigured ? 'PASS' : 'FAIL',
    'Android Gradle release signing is conditional on local keystore.properties'
  );

  const templatePath = resolve('android/keystore.properties.example');
  add(existsSync(templatePath) ? 'PASS' : 'FAIL', 'Android keystore template exists');

  const keystorePath = resolve('android/keystore.properties');
  if (!existsSync(keystorePath)) {
    add(
      'WARN',
      'Android release signing secrets are not configured locally',
      'Create android/keystore.properties from the example before running a signed Play AAB.'
    );
  } else {
    const properties = parseProperties(await readFile(keystorePath, 'utf8'));
    const requiredKeys = ['storeFile', 'storePassword', 'keyAlias', 'keyPassword'];
    for (const key of requiredKeys) {
      const value = properties.get(key) ?? '';
      add(hasPlaceholder(value) ? 'FAIL' : 'PASS', `Android keystore property ${key} is filled`);
    }

    const storeFile = properties.get('storeFile');
    if (storeFile) {
      const storeFilePath = resolve('android', storeFile);
      add(existsSync(storeFilePath) ? 'PASS' : 'FAIL', 'Android keystore file exists', storeFile);
    }
  }

  add(
    xcodeProject.includes('PRODUCT_BUNDLE_IDENTIFIER = com.flagarcade.app;') ? 'PASS' : 'FAIL',
    'iOS bundle identifier is com.flagarcade.app'
  );
  add(xcodeProject.includes('MARKETING_VERSION = 1.0;') ? 'PASS' : 'FAIL', 'iOS marketing version is 1.0');
  add(xcodeProject.includes('CURRENT_PROJECT_VERSION = 1;') ? 'PASS' : 'FAIL', 'iOS build number is 1');
  add(xcodeProject.includes('CODE_SIGN_STYLE = Automatic;') ? 'PASS' : 'WARN', 'iOS automatic code signing is enabled');

  const teamMatches = [...xcodeProject.matchAll(/DEVELOPMENT_TEAM = ([A-Z0-9]+);/g)].map((match) => match[1]);
  if (teamMatches.length === 0) {
    add(
      'WARN',
      'iOS Apple Developer Team is not set in the project',
      'Set the team in Xcode before creating a signed App Store archive.'
    );
  } else {
    add('PASS', 'iOS Apple Developer Team is set', [...new Set(teamMatches)].join(', '));
  }

  for (const finding of findings) {
    const detail = finding.detail ? ` (${finding.detail})` : '';
    console.log(`${finding.status} ${finding.label}${detail}`);
  }

  const failures = findings.filter((finding) => finding.status === 'FAIL');
  const warnings = findings.filter((finding) => finding.status === 'WARN');
  console.log(`\n${findings.length} signing preflight checks: ${failures.length} fail, ${warnings.length} warn.`);

  if (failures.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
