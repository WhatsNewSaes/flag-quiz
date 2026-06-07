// Lightweight, best-effort gameplay analytics. Every call here is fire-and-forget
// and wrapped so a failure can never disrupt gameplay. Sessions are posted to the
// /api/track serverless endpoint, which writes them to Supabase with the service
// role key. Players are mostly anonymous, so we key "unique players" on an
// anonymous device id stored in localStorage; a user id is attached when signed in.

import { Capacitor } from '@capacitor/core';

export type PlayMode = 'journey' | 'arcade' | 'around_the_world' | 'jeopardy' | 'flag_runner';

export interface SessionResult {
  completed?: boolean;
  score?: number | null;
  correct?: number | null;
  total?: number | null;
  metadata?: Record<string, unknown>;
}

export interface SessionHandle {
  id: string;
  mode: PlayMode;
  startedAt: number;
  ended: boolean;
}

// Tracking is a no-op when Supabase isn't configured (e.g. local dev without env,
// or the placeholder client in src/lib/supabase.ts).
const ENABLED = Boolean(import.meta.env.VITE_SUPABASE_URL);
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://flagarcade.com';

const DEVICE_ID_KEY = 'fa_device_id';

// User id is set by AuthContext on auth state changes so this module stays
// decoupled from React context (embed routes have no AuthProvider).
let currentUserId: string | null = null;
export function setAnalyticsUser(userId: string | null): void {
  currentUserId = userId;
}

function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  // Fallback for older webviews without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (private mode / SSR) — use an ephemeral id.
    return uuid();
  }
}

export function getPlatform(): 'web' | 'ios' | 'android' {
  const p = Capacitor.getPlatform();
  return p === 'ios' || p === 'android' ? p : 'web';
}

function post(payload: Record<string, unknown>, beacon = false): void {
  if (!ENABLED) return;
  try {
    const url = Capacitor.isNativePlatform() ? `${SITE_URL}/api/track` : '/api/track';
    const data = JSON.stringify(payload);
    if (beacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }));
      return;
    }
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never throw from analytics */
  }
}

// Sessions still open when the page is hidden/closed (tab close, refresh, app
// backgrounded) are flushed as not-completed via sendBeacon.
const activeSessions = new Set<SessionHandle>();
let flushRegistered = false;

function registerFlush(): void {
  if (flushRegistered || typeof window === 'undefined') return;
  flushRegistered = true;
  const flush = () => {
    activeSessions.forEach((handle) => endSession(handle, { completed: false }));
  };
  // pagehide covers tab close / bfcache; visibilitychange covers mobile backgrounding.
  window.addEventListener('pagehide', flush);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

export function startSession(mode: PlayMode, metadata?: Record<string, unknown>): SessionHandle {
  const handle: SessionHandle = { id: uuid(), mode, startedAt: Date.now(), ended: false };
  if (!ENABLED) return handle;
  registerFlush();
  activeSessions.add(handle);
  post({
    event: 'start',
    id: handle.id,
    device_id: getDeviceId(),
    user_id: currentUserId,
    mode,
    platform: getPlatform(),
    started_at: new Date(handle.startedAt).toISOString(),
    metadata: metadata ?? {},
  });
  return handle;
}

export function endSession(handle: SessionHandle | null, result: SessionResult = {}): void {
  if (!handle || handle.ended) return;
  handle.ended = true;
  activeSessions.delete(handle);
  if (!ENABLED) return;
  const endedAt = Date.now();
  post(
    {
      event: 'end',
      id: handle.id,
      ended_at: new Date(endedAt).toISOString(),
      duration_ms: endedAt - handle.startedAt,
      completed: result.completed ?? false,
      score: result.score ?? null,
      correct: result.correct ?? null,
      total: result.total ?? null,
    },
    true,
  );
}
