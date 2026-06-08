import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

type Args = {
  evidenceFile?: string;
  androidAab?: string;
  iosArchive?: string;
  skipArtifacts: boolean;
  skipUrls: boolean;
};

type Step = {
  label: string;
  command: string;
  args: string[];
};

function parseArgs(argv: string[]): Args {
  const args: Args = { skipArtifacts: false, skipUrls: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--skip-urls') {
      args.skipUrls = true;
      continue;
    }

    if (arg === '--skip-artifacts') {
      args.skipArtifacts = true;
      continue;
    }

    if ((arg === '--evidence' || arg === '--file' || arg === '-f') && next) {
      args.evidenceFile = next;
      index += 1;
      continue;
    }

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

    if (!arg.startsWith('-') && !args.evidenceFile) {
      args.evidenceFile = arg;
      continue;
    }

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  return args;
}

function runStep(step: Step) {
  console.log(`\n==> ${step.label}`);
  execFileSync(step.command, step.args, {
    cwd: root,
    stdio: 'inherit',
  });
}

function fieldValue(markdown: string, label: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = markdown.match(new RegExp(`^- ${escapedLabel}:[ \\t]*(.*)$`, 'm'));
  return match?.[1]?.trim();
}

function evidenceTarget(value: string) {
  const trimmed = value.trim();
  const markdownLink = trimmed.match(/^\[[^\]]+\]\(([^)]+)\)$/);
  return (markdownLink?.[1] ?? trimmed).trim();
}

function isExternalEvidenceTarget(target: string) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(target);
}

function artifactManifestPath(markdown: string) {
  const value = fieldValue(markdown, 'Artifact manifest');
  if (!value || ['tbd', 'todo', 'pending'].includes(value.toLowerCase())) {
    throw new Error('Release evidence must include an Artifact manifest path before running the final go-live gate.');
  }

  const target = evidenceTarget(value);
  if (!target || target.startsWith('#') || target.includes('<release-file>')) {
    throw new Error(`Release evidence Artifact manifest is still a placeholder: ${value}`);
  }

  if (isExternalEvidenceTarget(target)) {
    throw new Error('Full go-live artifact verification needs a local Artifact manifest path so mobile:artifacts:check can write hashes before evidence validation.');
  }

  return target;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.evidenceFile) {
    throw new Error('Usage: npm run mobile:go-live:check -- --evidence docs/release-evidence/<release-file>.md');
  }

  const evidencePath = path.resolve(root, args.evidenceFile);
  if (!existsSync(evidencePath)) {
    throw new Error(`Release evidence file does not exist: ${path.relative(root, evidencePath)}`);
  }
  const evidenceMarkdown = readFileSync(evidencePath, 'utf8');

  const steps: Step[] = [
    {
      label: 'Unsigned mobile preflight',
      command: 'npm',
      args: ['run', 'mobile:preflight'],
    },
    {
      label: 'Final store account handoff',
      command: 'npm',
      args: ['run', 'mobile:accounts:release'],
    },
  ];

  if (args.skipArtifacts && (args.androidAab || args.iosArchive)) {
    throw new Error('Do not combine --skip-artifacts with --android-aab or --ios-archive.');
  }

  if (!args.skipArtifacts && (!args.androidAab || !args.iosArchive)) {
    throw new Error('Provide both --android-aab and --ios-archive for the final go-live gate, or pass --skip-artifacts for evidence-only review.');
  }

  const manifestPath = artifactManifestPath(evidenceMarkdown);

  if (!args.skipArtifacts) {
    const androidAab = args.androidAab as string;
    const iosArchive = args.iosArchive as string;

    steps.push({
      label: 'Strict release signing preflight',
      command: 'npm',
      args: ['run', 'mobile:signing:release'],
    });

    steps.push({
      label: 'Signed release artifacts',
      command: 'npm',
      args: [
        'run',
        'mobile:artifacts:check',
        '--',
        '--android-aab',
        androidAab,
        '--ios-archive',
        iosArchive,
        '--manifest',
        manifestPath,
      ],
    });
  }

  steps.push({
    label: 'Completed release evidence',
    command: 'npm',
    args: ['run', 'mobile:evidence:check', '--', '--file', path.relative(root, evidencePath)],
  });

  if (!args.skipUrls) {
    steps.push({
      label: 'Public store listing URLs',
      command: 'npm',
      args: ['run', 'mobile:urls:check'],
    });
  }

  for (const step of steps) {
    runStep(step);
  }

  console.log('\nMobile go-live gate passed.');
  if (args.skipArtifacts) {
    console.log(`Artifact generation was skipped. Verified evidence must already include the local artifact manifest at ${manifestPath}.`);
  } else {
    console.log('Final account handoff, strict signing, signed artifacts, release evidence, preflight, and public URLs passed. Confirm App Store Connect and Google Play Console are submitted with these same builds.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
