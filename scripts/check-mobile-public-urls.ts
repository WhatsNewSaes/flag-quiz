type UrlCheck = {
  label: string;
  url: string;
  expectedText: string;
};

const checks: UrlCheck[] = [
  {
    label: 'Marketing URL',
    url: 'https://flagarcade.com',
    expectedText: 'Flag Arcade',
  },
  {
    label: 'Privacy Policy URL',
    url: 'https://flagarcade.com/privacy',
    expectedText: 'Privacy',
  },
  {
    label: 'Terms URL',
    url: 'https://flagarcade.com/terms',
    expectedText: 'Terms',
  },
  {
    label: 'Support URL',
    url: 'https://flagarcade.com/support',
    expectedText: 'Support',
  },
];

async function checkUrl(check: UrlCheck) {
  const response = await fetch(check.url, {
    headers: {
      'User-Agent': 'FlagArcadeMobileLaunchCheck/1.0',
    },
    signal: AbortSignal.timeout(10000),
  });

  const body = await response.text();
  const contentType = response.headers.get('content-type') ?? '';
  const ok = response.ok
    && contentType.toLowerCase().includes('text/html')
    && body.includes(check.expectedText);

  return {
    ...check,
    ok,
    status: response.status,
    contentType,
    hasExpectedText: body.includes(check.expectedText),
  };
}

async function main() {
  const results = await Promise.allSettled(checks.map(checkUrl));
  let failures = 0;

  for (const result of results) {
    if (result.status === 'rejected') {
      failures += 1;
      console.log(`FAIL ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
      continue;
    }

    const check = result.value;
    if (!check.ok) failures += 1;
    const status = check.ok ? 'PASS' : 'FAIL';
    console.log(
      `${status} ${check.label}: ${check.url} (${check.status}, ${check.contentType || 'unknown content type'}, expected text: ${check.hasExpectedText ? 'yes' : 'no'})`,
    );
  }

  console.log(`\n${checks.length} public URL checks: ${failures} fail.`);
  if (failures > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
