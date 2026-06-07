import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

type Args = {
  evidenceFile?: string;
  androidAab?: string;
  iosArchive?: string;
  skipUrls: boolean;
};

type Step = {
  label: string;
  command: string;
  args: string[];
};

function parseArgs(argv: string[]): Args {
  const args: Args = { skipUrls: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--skip-urls') {
      args.skipUrls = true;
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

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.evidenceFile) {
    throw new Error('Usage: npm run mobile:go-live:check -- --evidence docs/release-evidence/<release-file>.md');
  }

  const evidencePath = path.resolve(root, args.evidenceFile);
  if (!existsSync(evidencePath)) {
    throw new Error(`Release evidence file does not exist: ${path.relative(root, evidencePath)}`);
  }

  const steps: Step[] = [
    {
      label: 'Unsigned mobile preflight',
      command: 'npm',
      args: ['run', 'mobile:preflight'],
    },
    {
      label: 'Completed release evidence',
      command: 'npm',
      args: ['run', 'mobile:evidence:check', '--', '--file', path.relative(root, evidencePath)],
    },
  ];

  if (args.androidAab || args.iosArchive) {
    if (!args.androidAab || !args.iosArchive) {
      throw new Error('Provide both --android-aab and --ios-archive, or omit both artifact paths.');
    }

    steps.push({
      label: 'Signed release artifacts',
      command: 'npm',
      args: [
        'run',
        'mobile:artifacts:check',
        '--',
        '--android-aab',
        args.androidAab,
        '--ios-archive',
        args.iosArchive,
      ],
    });
  }

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
  console.log('Confirm App Store Connect and Google Play Console are submitted with the same signed builds referenced in the evidence file.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
