import { execFileSync } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const templatePath = path.join(root, 'docs/mobile-release-evidence-template.md');
const evidenceDirectory = path.join(root, 'docs/release-evidence');

type PackageJson = {
  version?: string;
};

type Args = {
  buildNumber?: string;
  owner?: string;
  output?: string;
  force: boolean;
  dryRun: boolean;
};

function commandOutput(command: string, args: string[]) {
  try {
    return execFileSync(command, args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    force: false,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--force') {
      args.force = true;
      continue;
    }

    if (arg === '--dry-run') {
      args.dryRun = true;
      continue;
    }

    if (arg === '--build' && next) {
      args.buildNumber = next;
      index += 1;
      continue;
    }

    if (arg === '--owner' && next) {
      args.owner = next;
      index += 1;
      continue;
    }

    if (arg === '--out' && next) {
      args.output = next;
      index += 1;
      continue;
    }

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  return args;
}

function replaceLine(markdown: string, label: string, value: string) {
  return markdown.replace(new RegExp(`- ${label}:.*`), `- ${label}: ${value}`);
}

function firstMatch(source: string, pattern: RegExp) {
  return source.match(pattern)?.[1]?.trim() ?? '';
}

async function currentNativeBuildNumber() {
  const androidBuildGradle = await readFile(path.join(root, 'android/app/build.gradle'), 'utf8');
  const buildNumber = firstMatch(androidBuildGradle, /versionCode\s+(\d+)/);
  if (!buildNumber) {
    throw new Error('Could not derive the native build number from android/app/build.gradle. Pass --build explicitly.');
  }
  return buildNumber;
}

function artifactManifestPathForEvidence(outputPath: string) {
  const parsedPath = path.parse(outputPath);
  return path.join(parsedPath.dir, `${parsedPath.name}-artifacts.json`);
}

async function pathExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')) as PackageJson;
  const template = await readFile(templatePath, 'utf8');

  const version = packageJson.version ?? 'unknown';
  const buildNumber = args.buildNumber ?? await currentNativeBuildNumber();
  const commit = commandOutput('git', ['rev-parse', '--short', 'HEAD']);
  const branch = commandOutput('git', ['branch', '--show-current']);
  const date = new Date().toISOString().slice(0, 10);
  const fileName = `mobile-${version}-build-${buildNumber}-${commit}.md`;
  const outputPath = path.resolve(root, args.output ?? path.join(evidenceDirectory, fileName));
  const artifactManifestPath = artifactManifestPathForEvidence(outputPath);
  const relativeArtifactManifestPath = path.relative(root, artifactManifestPath);

  let evidence = template;
  evidence = replaceLine(evidence, 'App version', version);
  evidence = replaceLine(evidence, 'Build number / version code', buildNumber);
  evidence = replaceLine(evidence, 'Git commit', commit);
  evidence = replaceLine(evidence, 'Release branch', branch || 'unknown');
  evidence = replaceLine(evidence, 'Evidence owner', args.owner ?? 'TBD');
  evidence = replaceLine(evidence, 'Evidence date', date);
  evidence = replaceLine(evidence, 'Public site URL verified', 'Pending - run `npm run mobile:urls:check`');
  evidence = replaceLine(evidence, 'Privacy URL verified', 'Pending - run `npm run mobile:urls:check`');
  evidence = replaceLine(evidence, 'Terms URL verified', 'Pending - run `npm run mobile:urls:check`');
  evidence = replaceLine(evidence, 'Support URL verified', 'Pending - run `npm run mobile:urls:check`');
  evidence = replaceLine(evidence, 'Artifact manifest', relativeArtifactManifestPath);

  const relativeOutputPath = path.relative(root, outputPath);

  if (args.dryRun) {
    console.log(`Would write ${relativeOutputPath}`);
    console.log(`Release candidate: version ${version}, build ${buildNumber}, commit ${commit}`);
    console.log(`Artifact manifest: ${relativeArtifactManifestPath}`);
    return;
  }

  if (!args.force && await pathExists(outputPath)) {
    throw new Error(`${relativeOutputPath} already exists. Use --force to overwrite it.`);
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, evidence);

  console.log(`Wrote ${relativeOutputPath}`);
  console.log(`Artifact manifest path: ${relativeArtifactManifestPath}`);
  console.log('Next: run mobile:artifacts:check with --manifest, then fill signed build ids, device QA results, store-console statuses, and final signoff.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
