import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

type Finding = {
  label: string;
  ok: boolean;
  detail?: string;
};

const root = process.cwd();
const findings: Finding[] = [];
const blockedFileNames = new Set(['.DS_Store', 'Thumbs.db']);
const scannedRoots = [
  'public',
  'dist',
  'android/app/src/main/assets/public',
  'ios/App/App/public',
];

function resolve(...segments: string[]) {
  return path.join(root, ...segments);
}

function pass(label: string, detail?: string) {
  findings.push({ label, ok: true, detail });
}

function fail(label: string, detail?: string) {
  findings.push({ label, ok: false, detail });
}

async function findBlockedFiles(relativeRoot: string) {
  const start = resolve(relativeRoot);
  if (!existsSync(start)) return [];

  const matches: string[] = [];
  const pending = [start];

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) continue;

    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(absolute);
      } else if (entry.isFile() && blockedFileNames.has(entry.name)) {
        matches.push(path.relative(root, absolute).split(path.sep).join('/'));
      }
    }
  }

  return matches.sort();
}

async function main() {
  for (const relativeRoot of scannedRoots) {
    const matches = await findBlockedFiles(relativeRoot);
    if (matches.length === 0) {
      pass(`No blocked OS metadata files in ${relativeRoot}`);
    } else {
      fail(`No blocked OS metadata files in ${relativeRoot}`, matches.join(', '));
    }
  }

  const failed = findings.filter((finding) => !finding.ok);
  for (const finding of findings) {
    const prefix = finding.ok ? 'PASS' : 'FAIL';
    console.log(`${prefix} ${finding.label}${finding.detail ? ` (${finding.detail})` : ''}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} mobile bundle cleanliness check(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${findings.length} mobile bundle cleanliness checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
