// Vercel serverless function that ingests gameplay analytics events.
// POST /api/track  with one of:
//   { event: 'start', id, device_id, mode, platform?, started_at?, user_id?, metadata? }
//   { event: 'end',   id, ended_at?, duration_ms?, completed?, score?, correct?, total? }
//
// One play_sessions row per session id: 'start' inserts it, 'end' updates it.
// Public (NOT behind Basic Auth) — anonymous players must be able to reach it.
// Uses the Supabase service role key so RLS is bypassed; the table has no
// client policies, so writes can only happen through here. Best-effort: any
// bad/oversized payload is rejected quietly without disrupting gameplay.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const MODES = ['journey', 'arcade', 'around_the_world', 'jeopardy', 'flag_runner'];
const PLATFORMS = ['web', 'ios', 'android'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Coerce to a bounded integer or null (drops NaN / non-finite / absurd values).
function intOrNull(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  const n = Math.trunc(v);
  if (n < -1_000_000_000 || n > 1_000_000_000) return null;
  return n;
}

function isoOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, {
      error: 'Supabase env vars not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const id = typeof body.id === 'string' ? body.id : '';
  if (!UUID_RE.test(id)) return json(400, { error: 'valid session id (uuid) is required' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (body.event === 'start') {
    const mode = typeof body.mode === 'string' ? body.mode : '';
    if (!MODES.includes(mode)) return json(400, { error: 'invalid mode' });

    const deviceId = typeof body.device_id === 'string' ? body.device_id.slice(0, 64) : '';
    if (!deviceId) return json(400, { error: 'device_id is required' });

    const platform = PLATFORMS.includes(body.platform as string) ? (body.platform as string) : 'web';
    const userId = typeof body.user_id === 'string' && UUID_RE.test(body.user_id) ? body.user_id : null;

    // Country comes from Vercel's edge geo header (server-side, no IP stored).
    // Absent locally / for unknown IPs.
    const rawCountry = req.headers.get('x-vercel-ip-country') || '';
    const country = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : null;

    // Cap metadata size so a bad client can't write huge blobs.
    let metadata: Record<string, unknown> = {};
    if (body.metadata && typeof body.metadata === 'object') {
      const serialized = JSON.stringify(body.metadata);
      if (serialized.length <= 2000) metadata = body.metadata as Record<string, unknown>;
    }

    const { error } = await supabase.from('play_sessions').insert({
      id,
      device_id: deviceId,
      user_id: userId,
      mode,
      platform,
      country,
      started_at: isoOrNull(body.started_at) ?? new Date().toISOString(),
      completed: false,
      metadata,
    });
    if (error) return json(500, { error: error.message });
    return new Response(null, { status: 204 });
  }

  if (body.event === 'end') {
    const patch: Record<string, unknown> = {
      ended_at: isoOrNull(body.ended_at) ?? new Date().toISOString(),
      duration_ms: intOrNull(body.duration_ms),
      completed: body.completed === true,
      score: intOrNull(body.score),
      correct: intOrNull(body.correct),
      total: intOrNull(body.total),
    };

    // Update by id. If the 'start' never landed (e.g. dropped), there's nothing
    // to update — that's fine; we don't fabricate a row without a start.
    const { error } = await supabase.from('play_sessions').update(patch).eq('id', id);
    if (error) return json(500, { error: error.message });
    return new Response(null, { status: 204 });
  }

  return json(400, { error: "event must be 'start' or 'end'" });
}

export const config = { runtime: 'edge' };
