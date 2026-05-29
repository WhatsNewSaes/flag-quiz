// Vercel serverless function backing the /admin dashboard's CRM state.
// GET  /api/state            → returns { [url]: { status, notes } } for all prospects
// POST /api/state {url, status?, notes?} → upserts that prospect's row
//
// Gated by HTTP Basic Auth via middleware.ts (same CRM_PASSWORD as /admin).
// Uses the Supabase service role key, so RLS is bypassed — never expose this
// key to the client.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, {
      error: 'Supabase env vars not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('crm_prospects')
      .select('url, status, notes');
    if (error) return json(500, { error: error.message });
    const map: Record<string, { status: string; notes: string }> = {};
    for (const row of data || []) {
      map[row.url] = { status: row.status || '', notes: row.notes || '' };
    }
    return json(200, map);
  }

  if (req.method === 'POST') {
    let body: { url?: string; status?: string; notes?: string };
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'Invalid JSON body' });
    }
    const url = (body.url || '').trim();
    if (!url) return json(400, { error: 'url is required' });

    // Fetch existing row so we can partial-update (status OR notes, not both).
    const { data: existing } = await supabase
      .from('crm_prospects')
      .select('status, notes')
      .eq('url', url)
      .maybeSingle();

    const next = {
      url,
      status: body.status !== undefined ? body.status : existing?.status ?? '',
      notes: body.notes !== undefined ? body.notes : existing?.notes ?? '',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('crm_prospects').upsert(next, { onConflict: 'url' });
    if (error) return json(500, { error: error.message });
    return json(200, { ok: true });
  }

  return json(405, { error: 'Method not allowed' });
}

export const config = { runtime: 'edge' };
