// Vercel Edge Middleware — HTTP Basic Auth gate for /admin/*.
// Password is read from CRM_PASSWORD env var; username is always "seth".
// To set the password: `vercel env add CRM_PASSWORD production` (interactive)
// or pipe it: `echo "the-password" | vercel env add CRM_PASSWORD production`

import { next } from '@vercel/edge';

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};

const AUTH_USER = 'seth';

export default function middleware(request: Request): Response {
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

// Constant-time string comparison to avoid leaking the password length via timing.
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
