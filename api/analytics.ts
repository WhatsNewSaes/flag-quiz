// Vercel serverless function backing the /admin/analytics dashboard.
// GET /api/analytics?since=7d|30d|90d
//   → { since, days, totals, summary: [...per mode], timeseries: [...per day] }
//
// Gated by HTTP Basic Auth via middleware.ts (same CRM_PASSWORD as /admin).
// Uses the Supabase service role key (bypasses RLS) — never expose to the client.
// Aggregation is done by SQL functions defined in supabase/schema.sql.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const WINDOWS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') return json(405, { error: 'Method not allowed' });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, {
      error: 'Supabase env vars not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    });
  }

  const sinceParam = new URL(req.url).searchParams.get('since') || '30d';
  const days = WINDOWS[sinceParam] ?? 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [totals, summary, timeseries, byCountry, journey] = await Promise.all([
    supabase.rpc('get_play_totals', { p_since: since }),
    supabase.rpc('get_play_summary', { p_since: since }),
    supabase.rpc('get_play_timeseries', { p_since: since }),
    supabase.rpc('get_play_by_country', { p_since: since }),
    supabase.rpc('get_journey_progression', { p_since: since }),
  ]);

  const err = totals.error || summary.error || timeseries.error || byCountry.error || journey.error;
  if (err) return json(500, { error: err.message });

  return json(200, {
    since,
    days,
    totals: (totals.data && totals.data[0]) || {
      plays: 0,
      unique_players: 0,
      completed_plays: 0,
      total_duration_ms: 0,
    },
    summary: summary.data || [],
    timeseries: timeseries.data || [],
    byCountry: byCountry.data || [],
    journey: journey.data || [],
  });
}

export const config = { runtime: 'edge' };
