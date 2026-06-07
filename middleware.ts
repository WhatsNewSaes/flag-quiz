// Vercel Edge Middleware — HTTP Basic Auth gate for /admin/*.
// Password is read from CRM_PASSWORD env var; username is always "seth".
// To set the password: `vercel env add CRM_PASSWORD production` (interactive)
// or pipe it: `echo "the-password" | vercel env add CRM_PASSWORD production`

import { next } from '@vercel/edge';

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/state', '/api/analytics', '/play/perfect-passport'],
};

const AUTH_USER = 'seth';
const PREVIEW_BOT_RE = /\b(Twitterbot|facebookexternalhit|Facebot|Slackbot|Discordbot|LinkedInBot|WhatsApp|TelegramBot|iMessage|Messages|Google-Structured-Data-Testing-Tool|Pinterest|SkypeUriPreview|bitlybot)\b/i;

export default function middleware(request: Request): Response {
  const url = new URL(request.url);

  if (url.pathname === '/play/perfect-passport' && url.searchParams.get('challenge') === '1') {
    const userAgent = request.headers.get('user-agent') || '';
    if (PREVIEW_BOT_RE.test(userAgent)) {
      return challengePreviewResponse(url);
    }

    return next();
  }

  if (url.pathname === '/play/perfect-passport') {
    return next();
  }

  const expected = process.env.CRM_PASSWORD || '';
  if (!expected) {
    return new Response('CRM_PASSWORD env var not configured on this deployment', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const header = request.headers.get('authorization') || '';
  if (header.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6));
      const sep = decoded.indexOf(':');
      const user = sep >= 0 ? decoded.slice(0, sep) : '';
      const pass = sep >= 0 ? decoded.slice(sep + 1) : '';
      if (user === AUTH_USER && constantTimeEqual(pass, expected)) {
        return next();
      }
    } catch {
      // fall through to 401
    }
  }

  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="FlagArcade CRM"',
      'Content-Type': 'text/plain',
    },
  });
}

function challengePreviewResponse(url: URL): Response {
  const score = clean(url.searchParams.get('score'), '197-0', 12);
  const title = clean(url.searchParams.get('title'), 'Perfect Passport', 40);
  const grade = clean(url.searchParams.get('grade'), 'S+', 3);
  const best = clean(url.searchParams.get('best'), '10', 2);
  const ogImage = new URL('/api/og-perfect-passport', url.origin);
  ogImage.searchParams.set('score', score);
  ogImage.searchParams.set('title', title);
  ogImage.searchParams.set('grade', grade);
  ogImage.searchParams.set('best', best);

  const pageTitle = `Can you beat ${score} in Perfect Passport?`;
  const description = `${title}. Grade ${grade}. ${best}/10 best picks. Draft 10 countries and try to beat this score.`;

  return new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(url.toString())}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(url.toString())}">
  <meta property="og:image" content="${escapeHtml(ogImage.toString())}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage.toString())}">
</head>
<body>
  <main>
    <h1>${escapeHtml(pageTitle)}</h1>
    <p>${escapeHtml(description)}</p>
    <p><a href="${escapeHtml(url.toString())}">Play Perfect Passport</a></p>
  </main>
</body>
</html>`, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}

function clean(value: string | null, fallback: string, maxLength: number): string {
  const cleanValue = (value || fallback).replace(/[^\w\s+-.]/g, '').trim();
  return (cleanValue || fallback).slice(0, maxLength);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Constant-time string comparison to avoid leaking the password length via timing.
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
