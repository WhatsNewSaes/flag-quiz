"""
Phase 5 (bonus): generate a self-contained HTML dashboard that reads `prospects`
and lets you track outreach status per row, with filters, search, sort, and CSV
export of the visible subset.

State (status + notes per prospect) is persisted in browser localStorage —
nothing leaves your machine. Double-click the file to open.

Run: python phase5_dashboard.py
Output: ./output/dashboard.html
"""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

HERE = Path(__file__).parent
DB_PATH = HERE / "data" / "prospects.db"
OUT_PATH = HERE / "output" / "dashboard.html"
# Also publish into the Vite public/ tree so the dashboard ships as a static
# asset on flagarcade.com at /admin/dashboard. Path is relative to this script:
#   tools/backlink-prospector/phase5_dashboard.py
#   ../../public/admin/dashboard.html
PUBLIC_PATH = HERE / ".." / ".." / "public" / "admin" / "dashboard.html"


def load_prospects() -> list[dict]:
    con = sqlite3.connect(DB_PATH)
    rows = con.execute(
        """SELECT url, tier, score, contact_email, pitch_hook, signals_json
           FROM prospects ORDER BY score DESC, tier ASC, url ASC"""
    ).fetchall()
    con.close()
    out: list[dict] = []
    for url, tier, score, email, pitch, sig_json in rows:
        sig = json.loads(sig_json) if sig_json else {}
        out.append({
            "url": url,
            "tier": tier,
            "score": score,
            "contact_email": email or "",
            "pitch_hook": pitch or "",
            "title": sig.get("title") or "",
            "domain": sig.get("domain") or "",
            "topical_score": sig.get("topical_score") or 0,
            "outbound_count": sig.get("outbound_count") or 0,
            "broken_count": sig.get("broken_count") or 0,
            "has_competitor_links": bool(sig.get("has_competitor_links")),
            "has_broken_hook": bool(sig.get("broken_competitor_or_topical")),
            "edu_like": bool(sig.get("edu_like")),
            "homeschool_like": bool(sig.get("homeschool_like")),
            "last_modified": sig.get("last_modified_parsed") or "",
            "email_count": sig.get("email_count") or 0,
            "negative": bool(sig.get("negative_url_pattern")),
            # Optional pre-fill hints used by the dashboard on first load
            # (existing localStorage entries are never overwritten).
            "default_status": sig.get("default_status") or "",
            "default_notes": sig.get("default_notes") or "",
            "submission_type": sig.get("submission_type") or "",
        })
    return out


_HTML_TEMPLATE_OLD_TABLE_UNUSED = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Flag Arcade — Backlink CRM</title>
<style>
  :root {
    --bg:#fdf2f8;
    --surface:#fff;
    --border:#2d2d2d;
    --text:#2d2d2d;
    --muted:#6b7280;
    --pink:#ec4899;
    --blue:#7ec8e3;
    --green:#10b981;
    --amber:#f59e0b;
    --red:#ef4444;
    --shadow: 3px 3px 0 0 rgba(45,45,45,.15);
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color:var(--text);
    background:var(--bg);
    padding:24px;
    line-height:1.5;
  }
  header{
    background:var(--surface);
    border:2px solid var(--border);
    box-shadow:var(--shadow);
    padding:20px 24px;
    margin-bottom:20px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:16px;
  }
  header h1{font-size:18px;letter-spacing:.04em}
  header .subtitle{color:var(--muted);font-size:13px;margin-top:4px}
  .stats{
    display:grid;
    grid-template-columns:repeat(6,minmax(0,1fr));
    gap:10px;
    margin-bottom:20px;
  }
  .stat{
    background:var(--surface);
    border:2px solid var(--border);
    box-shadow:var(--shadow);
    padding:12px 16px;
  }
  .stat .v{font-size:24px;font-weight:700}
  .stat .l{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
  .stat.t1 .v{color:var(--pink)}
  .stat.t2 .v{color:var(--blue)}
  .stat.t3 .v{color:var(--muted)}
  .stat.emailed .v{color:var(--amber)}
  .stat.replied .v{color:var(--green)}
  .stat.linked .v{color:var(--green)}

  .filters{
    background:var(--surface);
    border:2px solid var(--border);
    box-shadow:var(--shadow);
    padding:16px;
    margin-bottom:20px;
    display:flex;
    flex-wrap:wrap;
    gap:12px 16px;
    align-items:center;
  }
  .filters label{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;display:inline-flex;align-items:center;gap:6px}
  .filters input[type=search],
  .filters select{
    border:1.5px solid var(--border);
    background:#fff;
    padding:6px 10px;
    font-size:13px;
    color:var(--text);
    border-radius:0;
    font-family:inherit;
  }
  .filters input[type=search]{width:280px}
  .filters input[type=checkbox]{transform:translateY(1px)}
  .filters .spacer{flex:1}
  .filters .clear{
    background:transparent;border:1px solid var(--border);padding:6px 10px;font-size:12px;cursor:pointer;font-family:inherit;
  }
  .filters .clear:hover{background:#f3f4f6}
  .filters .export{
    background:var(--blue);border:2px solid var(--border);padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;color:#fff;text-transform:uppercase;letter-spacing:.04em;font-family:inherit;
  }

  table{
    width:100%;
    background:var(--surface);
    border:2px solid var(--border);
    box-shadow:var(--shadow);
    border-collapse:collapse;
    font-size:13px;
  }
  thead th{
    background:var(--blue);
    color:#fff;
    text-align:left;
    padding:8px 10px;
    font-size:11px;
    text-transform:uppercase;
    letter-spacing:.06em;
    border-bottom:2px solid var(--border);
    cursor:pointer;
    user-select:none;
    white-space:nowrap;
  }
  thead th.sortable:hover{filter:brightness(1.08)}
  thead th .arrow{display:inline-block;margin-left:4px;opacity:.5;font-size:10px}
  thead th.active .arrow{opacity:1}
  tbody td{padding:10px;border-bottom:1px solid #e5e7eb;vertical-align:top}
  tbody tr:nth-child(even){background:#fafafa}
  tbody tr.status-emailed{background:#fef3c7}
  tbody tr.status-replied{background:#d1fae5}
  tbody tr.status-linked{background:#d1fae5;border-left:4px solid var(--green)}
  tbody tr.status-dead{opacity:.45}
  tbody tr.expanded td.url-cell{padding-bottom:0}

  .tier-pill{
    display:inline-block;padding:2px 8px;font-size:11px;font-weight:700;border:1.5px solid var(--border);
  }
  .tier-1{background:var(--pink);color:#fff}
  .tier-2{background:var(--blue);color:#fff}
  .tier-3{background:#e5e7eb}

  .score{font-weight:700}
  .score.hi{color:var(--green)}
  .score.med{color:var(--amber)}
  .score.lo{color:var(--muted)}

  .url-cell a{color:var(--text);text-decoration:none;border-bottom:1px solid var(--muted)}
  .url-cell a:hover{color:var(--pink);border-color:var(--pink)}
  .title-line{color:var(--muted);font-size:11px;margin-top:2px;max-width:540px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

  .pitch{font-size:12px;max-width:340px}
  .pitch .broken-url{color:var(--red);word-break:break-all}
  .pitch.empty{color:var(--muted);font-style:italic}

  .email-cell{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px}
  .email-cell a{color:var(--blue)}

  .tags{margin-top:4px;display:flex;gap:4px;flex-wrap:wrap}
  .tag{
    display:inline-block;padding:1px 6px;font-size:10px;border:1px solid var(--border);
    text-transform:uppercase;letter-spacing:.04em;
  }
  .tag.edu{background:#eef2ff;color:#3730a3}
  .tag.k12{background:#ecfeff;color:#0e7490}
  .tag.acuk{background:#fef3c7;color:#92400e}
  .tag.home{background:#fce7f3;color:#9d174d}
  .tag.comp{background:#fee2e2;color:#991b1b}
  .tag.broken{background:#fef9c3;color:#854d0e}
  .tag.neg{background:#f3f4f6;color:var(--muted)}

  select.status-select{
    border:1.5px solid var(--border);background:#fff;padding:4px 6px;font-size:12px;font-family:inherit;width:100%;border-radius:0;
  }
  select.status-select.emailed{background:#fef3c7}
  select.status-select.replied{background:#d1fae5}
  select.status-select.linked{background:#10b981;color:#fff}
  select.status-select.dead{background:#e5e7eb;color:var(--muted)}

  textarea.notes{
    width:100%;border:1.5px solid var(--border);padding:6px;font-size:12px;font-family:inherit;
    background:#fff;min-height:60px;resize:vertical;margin-top:6px;border-radius:0;
  }

  .expand-btn{
    background:transparent;border:none;color:var(--muted);cursor:pointer;font-size:11px;padding:0;margin-top:4px;font-family:inherit;
  }
  .expand-btn:hover{color:var(--text)}

  .expanded-row td{background:#fafafa;border-top:none;font-size:12px}
  .expanded-row .signals{font-family:ui-monospace,Menlo,monospace;font-size:11px;color:var(--muted);white-space:pre-wrap}

  .empty-state{
    text-align:center;padding:40px;color:var(--muted);font-size:14px;
  }

  .sync-pill{
    display:inline-flex;align-items:center;gap:6px;
    font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;
    padding:4px 10px;border:1px solid var(--border);background:#fff;
  }
  .sync-pill .dot{width:8px;height:8px;border-radius:50%;background:#9ca3af;display:inline-block}
  .sync-pill.synced .dot{background:var(--green)}
  .sync-pill.pending .dot{background:var(--amber);animation:pulse 1s ease-in-out infinite}
  .sync-pill.error .dot{background:var(--red)}
  .sync-pill.offline .dot{background:#9ca3af}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

  @media (max-width:900px){
    .stats{grid-template-columns:repeat(3,1fr)}
    table{font-size:12px}
    .pitch{max-width:none}
  }
</style>
</head>
<body>

<header>
  <div>
    <h1>FLAG ARCADE — BACKLINK CRM</h1>
    <div class="subtitle">__N_TOTAL__ scored prospects · click a column to sort · status saves locally</div>
  </div>
  <div style="font-size:11px;color:var(--muted);text-align:right">
    <div id="sync-pill" class="sync-pill offline"><span class="dot"></span><span id="sync-label">offline</span></div>
    <div style="margin-top:6px">Generated __GENERATED__</div>
  </div>
</header>

<div class="stats">
  <div class="stat t1"><div class="v" id="ct-t1">–</div><div class="l">Tier 1</div></div>
  <div class="stat t2"><div class="v" id="ct-t2">–</div><div class="l">Tier 2</div></div>
  <div class="stat t3"><div class="v" id="ct-t3">–</div><div class="l">Tier 3</div></div>
  <div class="stat emailed"><div class="v" id="ct-emailed">–</div><div class="l">Emailed</div></div>
  <div class="stat replied"><div class="v" id="ct-replied">–</div><div class="l">Replied</div></div>
  <div class="stat linked"><div class="v" id="ct-linked">–</div><div class="l">Linked</div></div>
</div>

<div class="filters">
  <label>Tier
    <select id="f-tier">
      <option value="">All</option>
      <option value="1">Tier 1</option>
      <option value="2">Tier 2</option>
      <option value="3">Tier 3</option>
    </select>
  </label>
  <label>Status
    <select id="f-status">
      <option value="">All</option>
      <option value="">— New —</option>
      <option value="not_contacted">Not contacted</option>
      <option value="emailed">Emailed</option>
      <option value="replied">Replied</option>
      <option value="linked">Linked</option>
      <option value="dead">Dead</option>
    </select>
  </label>
  <label>Search <input id="f-search" type="search" placeholder="url, domain, title, email…"></label>
  <label><input id="f-email" type="checkbox"> has email</label>
  <label><input id="f-comp" type="checkbox"> links to competitor</label>
  <label><input id="f-broken" type="checkbox"> broken-link hook</label>
  <label><input id="f-edu" type="checkbox"> .edu/.ac.uk/k12</label>
  <span class="spacer"></span>
  <button class="clear" id="f-clear">Clear filters</button>
  <button class="export" id="f-export">Export visible (CSV)</button>
</div>

<table>
  <thead>
    <tr>
      <th class="sortable" data-sort="tier">Tier <span class="arrow">↕</span></th>
      <th class="sortable" data-sort="score">Score <span class="arrow">↕</span></th>
      <th class="sortable" data-sort="url">URL / Domain <span class="arrow">↕</span></th>
      <th>Pitch hook</th>
      <th>Contact</th>
      <th class="sortable" data-sort="last_modified">Updated <span class="arrow">↕</span></th>
      <th style="width:140px">Status</th>
    </tr>
  </thead>
  <tbody id="rows"></tbody>
</table>

<script>
const DATA = __DATA__;
const STORAGE_KEY = 'flagarcade_crm_v1';
// API_BASE is derived from window.location so the same dashboard.html works at:
//   /dashboard.html                 → /api/state          (local serve.py)
//   /admin/dashboard.html           → /admin/api/state    (proxied via Vercel rewrite)
//   /admin/                         → /admin/api/state    (proxied via Vercel rewrite)
const _basePath = window.location.pathname.replace(/\/[^/]*$/, '') || '';
const API_BASE = _basePath + '/api/state';

// ── state persistence ──
// Source of truth: the server (SQLite). localStorage is just an offline cache
// so the table renders something usable while we wait for the API to respond.
function loadCache(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch(e){ return {}; }
}
function saveCache(s){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch(e){}
}
let state = loadCache();

function getRowState(url){
  return state[url] || {status:'', notes:''};
}
function setRowState(url, patch){
  const cur = getRowState(url);
  state[url] = {...cur, ...patch};
  saveCache(state);
}

// ── sync indicator ──
const syncPill = document.getElementById('sync-pill');
const syncLabel = document.getElementById('sync-label');
let onlineMode = false;
function setSync(mode, label){
  syncPill.className = 'sync-pill ' + mode;
  syncLabel.textContent = label;
}

// ── server sync ──
async function pullServerState(){
  try {
    const resp = await fetch(API_BASE, {method:'GET'});
    if (!resp.ok) throw new Error('http ' + resp.status);
    const server = await resp.json();
    // server wins — overwrite local cache
    state = {};
    for (const [url, v] of Object.entries(server)){
      state[url] = {status: v.status || '', notes: v.notes || ''};
    }
    saveCache(state);
    onlineMode = true;
    setSync('synced', 'synced');
    return true;
  } catch (e) {
    onlineMode = false;
    setSync('offline', 'offline (file://)');
    return false;
  }
}

// Per-URL debounce for notes so we don't fire on every keystroke
const _noteTimers = new Map();
async function pushOne(url, patch){
  // optimistic local write
  setRowState(url, patch);
  if (!onlineMode) return; // staying in localStorage-only mode
  setSync('pending', 'saving…');
  try {
    const resp = await fetch(API_BASE, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({url, ...patch}),
    });
    if (!resp.ok) throw new Error('http ' + resp.status);
    setSync('synced', 'synced');
  } catch (e) {
    setSync('error', 'save failed (will retry)');
    // schedule a retry
    setTimeout(() => pushOne(url, patch), 3000);
  }
}
function pushNoteDebounced(url, notes){
  clearTimeout(_noteTimers.get(url));
  _noteTimers.set(url, setTimeout(() => pushOne(url, {notes}), 600));
}

// ── filters ──
const ui = {
  tier:   document.getElementById('f-tier'),
  status: document.getElementById('f-status'),
  search: document.getElementById('f-search'),
  email:  document.getElementById('f-email'),
  comp:   document.getElementById('f-comp'),
  broken: document.getElementById('f-broken'),
  edu:    document.getElementById('f-edu'),
  clear:  document.getElementById('f-clear'),
  export: document.getElementById('f-export'),
  rows:   document.getElementById('rows'),
};
const sortState = {col: 'score', dir: 'desc'};

function applyFilters(){
  let rows = DATA.slice();
  const t = ui.tier.value;
  if (t) rows = rows.filter(r => String(r.tier) === t);
  const st = ui.status.value;
  if (st === 'not_contacted'){
    rows = rows.filter(r => !(getRowState(r.url).status));
  } else if (st){
    rows = rows.filter(r => getRowState(r.url).status === st);
  }
  const q = ui.search.value.trim().toLowerCase();
  if (q){
    rows = rows.filter(r =>
      (r.url||'').toLowerCase().includes(q) ||
      (r.domain||'').toLowerCase().includes(q) ||
      (r.title||'').toLowerCase().includes(q) ||
      (r.contact_email||'').toLowerCase().includes(q) ||
      (r.pitch_hook||'').toLowerCase().includes(q)
    );
  }
  if (ui.email.checked) rows = rows.filter(r => r.contact_email);
  if (ui.comp.checked)  rows = rows.filter(r => r.has_competitor_links);
  if (ui.broken.checked)rows = rows.filter(r => r.has_broken_hook);
  if (ui.edu.checked)   rows = rows.filter(r => r.edu_like);
  // sort
  const col = sortState.col, dir = sortState.dir === 'asc' ? 1 : -1;
  rows.sort((a,b) => {
    let av = a[col], bv = b[col];
    if (col === 'last_modified'){ av = av||''; bv = bv||''; }
    if (typeof av === 'string') return av.localeCompare(bv) * dir;
    return (av - bv) * dir;
  });
  return rows;
}

function tagFor(r){
  const tags = [];
  if (r.edu_like && (r.domain||'').endsWith('.edu')) tags.push('<span class="tag edu">.edu</span>');
  else if (r.edu_like && (r.domain||'').endsWith('.ac.uk')) tags.push('<span class="tag acuk">.ac.uk</span>');
  else if (r.edu_like && (r.domain||'').includes('.k12.')) tags.push('<span class="tag k12">k12</span>');
  if (r.homeschool_like) tags.push('<span class="tag home">homeschool</span>');
  if (r.has_competitor_links) tags.push('<span class="tag comp">→ competitor</span>');
  if (r.has_broken_hook) tags.push('<span class="tag broken">broken-link pitch</span>');
  if (r.negative) tags.push('<span class="tag neg">flagged URL</span>');
  return tags.join('');
}

function pitchHTML(r){
  if (!r.pitch_hook) return '<div class="pitch empty">—</div>';
  // highlight broken URLs in pitch hooks
  const url = (r.pitch_hook.match(/(https?:\/\/\S+?)(?:\s|\(|$)/)||[])[1];
  let h = r.pitch_hook.replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
  if (url){
    h = h.replace(url, `<a class="broken-url" href="${url}" target="_blank" rel="noopener">${url}</a>`);
  }
  return `<div class="pitch">${h}</div>`;
}

function render(){
  const rows = applyFilters();
  ui.rows.innerHTML = '';
  if (rows.length === 0){
    ui.rows.innerHTML = '<tr><td colspan="7"><div class="empty-state">No prospects match the current filters.</div></td></tr>';
  } else {
    for (const r of rows){
      const s = getRowState(r.url);
      const status = s.status || '';
      const tr = document.createElement('tr');
      tr.className = 'row' + (status ? ' status-' + status : '');
      tr.dataset.url = r.url;
      const scoreClass = r.score >= 70 ? 'hi' : r.score >= 40 ? 'med' : 'lo';
      const displayUrl = r.url.length > 95 ? r.url.slice(0, 92) + '…' : r.url;
      tr.innerHTML = `
        <td><span class="tier-pill tier-${r.tier}">T${r.tier}</span></td>
        <td><span class="score ${scoreClass}">${r.score}</span></td>
        <td class="url-cell">
          <a href="${r.url}" target="_blank" rel="noopener">${displayUrl}</a>
          ${r.title ? `<div class="title-line">${r.title.replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</div>` : ''}
          <div class="tags">${tagFor(r)}</div>
          <button class="expand-btn" data-action="expand">▸ details</button>
        </td>
        <td>${pitchHTML(r)}</td>
        <td class="email-cell">${r.contact_email ? `<a href="mailto:${r.contact_email}">${r.contact_email}</a>` : '<span style="color:var(--muted)">—</span>'}</td>
        <td style="font-size:11px;color:var(--muted)">${(r.last_modified || '').slice(0,10) || '—'}</td>
        <td>
          <select class="status-select ${status}" data-action="status">
            <option value="">— new —</option>
            <option value="not_contacted" ${status==='not_contacted'?'selected':''}>not contacted</option>
            <option value="emailed" ${status==='emailed'?'selected':''}>emailed</option>
            <option value="replied" ${status==='replied'?'selected':''}>replied</option>
            <option value="linked" ${status==='linked'?'selected':''}>linked ★</option>
            <option value="dead" ${status==='dead'?'selected':''}>dead</option>
          </select>
        </td>
      `;
      ui.rows.appendChild(tr);
    }
  }
  updateStats();
  updateSortIndicators();
}

function updateStats(){
  document.getElementById('ct-t1').textContent = DATA.filter(r => r.tier===1).length;
  document.getElementById('ct-t2').textContent = DATA.filter(r => r.tier===2).length;
  document.getElementById('ct-t3').textContent = DATA.filter(r => r.tier===3).length;
  document.getElementById('ct-emailed').textContent = Object.values(state).filter(s => s.status==='emailed').length;
  document.getElementById('ct-replied').textContent = Object.values(state).filter(s => s.status==='replied').length;
  document.getElementById('ct-linked').textContent = Object.values(state).filter(s => s.status==='linked').length;
}

function updateSortIndicators(){
  document.querySelectorAll('thead th.sortable').forEach(th => {
    th.classList.toggle('active', th.dataset.sort === sortState.col);
    const arrow = th.querySelector('.arrow');
    if (th.dataset.sort === sortState.col){
      arrow.textContent = sortState.dir === 'asc' ? '↑' : '↓';
    } else {
      arrow.textContent = '↕';
    }
  });
}

// ── event delegation ──
document.querySelectorAll('thead th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.dataset.sort;
    if (sortState.col === col){
      sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
    } else {
      sortState.col = col;
      sortState.dir = col === 'score' || col === 'tier' ? 'desc' : 'asc';
    }
    render();
  });
});

ui.rows.addEventListener('change', e => {
  const sel = e.target;
  if (sel.dataset.action !== 'status') return;
  const tr = sel.closest('tr');
  const url = tr.dataset.url;
  const val = sel.value;
  pushOne(url, {status: val});
  tr.className = 'row' + (val ? ' status-' + val : '');
  sel.className = 'status-select ' + val;
  updateStats();
});

ui.rows.addEventListener('click', e => {
  const btn = e.target.closest('[data-action="expand"]');
  if (!btn) return;
  const tr = btn.closest('tr');
  const url = tr.dataset.url;
  const r = DATA.find(x => x.url === url);
  // toggle expanded row
  const next = tr.nextElementSibling;
  if (next && next.classList.contains('expanded-row')){
    next.remove();
    btn.textContent = '▸ details';
    return;
  }
  const s = getRowState(url);
  const exp = document.createElement('tr');
  exp.className = 'expanded-row';
  const sig = {
    domain: r.domain,
    topical_score: r.topical_score,
    outbound_count: r.outbound_count,
    broken_count: r.broken_count,
    has_competitor_links: r.has_competitor_links,
    has_broken_hook: r.has_broken_hook,
    edu_like: r.edu_like,
    homeschool_like: r.homeschool_like,
    email_count: r.email_count,
    last_modified: r.last_modified,
    negative_url_pattern: r.negative,
  };
  exp.innerHTML = `
    <td colspan="7" style="padding:14px 16px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <div>
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">Notes</div>
          <textarea class="notes" data-action="notes" placeholder="Personal notes — date emailed, response, follow-up plan…">${(s.notes||'').replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</textarea>
        </div>
        <div>
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">Scoring signals</div>
          <div class="signals">${JSON.stringify(sig, null, 2)}</div>
        </div>
      </div>
    </td>
  `;
  tr.parentNode.insertBefore(exp, tr.nextSibling);
  btn.textContent = '▾ details';
});

ui.rows.addEventListener('input', e => {
  const ta = e.target;
  if (ta.dataset.action !== 'notes') return;
  const tr = ta.closest('.expanded-row').previousElementSibling;
  const url = tr.dataset.url;
  // optimistic local write immediately, debounced server write
  setRowState(url, {notes: ta.value});
  pushNoteDebounced(url, ta.value);
});

[ui.tier, ui.status, ui.email, ui.comp, ui.broken, ui.edu].forEach(el => el.addEventListener('change', render));
ui.search.addEventListener('input', render);
ui.clear.addEventListener('click', () => {
  ui.tier.value=''; ui.status.value=''; ui.search.value='';
  ui.email.checked=false; ui.comp.checked=false; ui.broken.checked=false; ui.edu.checked=false;
  render();
});
ui.export.addEventListener('click', () => {
  const rows = applyFilters();
  const cols = ['tier','score','url','domain','contact_email','pitch_hook','last_modified','status','notes','topical_score','outbound_count','broken_count','has_competitor_links','title'];
  const lines = [cols.join(',')];
  for (const r of rows){
    const s = getRowState(r.url);
    const cells = cols.map(c => {
      let v;
      if (c === 'status') v = s.status || '';
      else if (c === 'notes') v = s.notes || '';
      else v = r[c] === undefined ? '' : r[c];
      v = String(v).replace(/"/g, '""');
      return /[",\n]/.test(v) ? `"${v}"` : v;
    });
    lines.push(cells.join(','));
  }
  const blob = new Blob([lines.join('\n')], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `flagarcade_prospects_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
});

// initial render from cache, then upgrade with server data
render();
pullServerState().then(ok => { if (ok) render(); });

// re-pull every 60s in case another browser tab made changes
setInterval(() => { if (onlineMode) pullServerState().then(ok => { if (ok) render(); }); }, 60000);
</script>
</body>
</html>
"""


HTML_TEMPLATE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Flag Arcade — Backlink CRM</title>
<style>
  :root{
    --bg:#fdf2f8;
    --surface:#fff;
    --border:#2d2d2d;
    --text:#2d2d2d;
    --muted:#6b7280;
    --pink:#ec4899;
    --blue:#7ec8e3;
    --green:#10b981;
    --amber:#f59e0b;
    --red:#ef4444;
    --shadow:3px 3px 0 0 rgba(45,45,45,.15);
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{
    font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    color:var(--text);background:var(--bg);padding:16px;line-height:1.45;
  }
  header{
    background:var(--surface);border:2px solid var(--border);box-shadow:var(--shadow);
    padding:16px 20px;margin-bottom:14px;
    display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;
  }
  header h1{font-size:16px;letter-spacing:.04em}
  header .subtitle{color:var(--muted);font-size:12px;margin-top:4px}
  .sync-pill{
    display:inline-flex;align-items:center;gap:6px;
    font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;
    padding:4px 10px;border:1px solid var(--border);background:#fff;
  }
  .sync-pill .dot{width:8px;height:8px;border-radius:50%;background:#9ca3af;display:inline-block}
  .sync-pill.synced .dot{background:var(--green)}
  .sync-pill.pending .dot{background:var(--amber);animation:pulse 1s ease-in-out infinite}
  .sync-pill.error .dot{background:var(--red)}
  .sync-pill.offline .dot{background:#9ca3af}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

  .filters{
    background:var(--surface);border:2px solid var(--border);box-shadow:var(--shadow);
    padding:12px 16px;margin-bottom:14px;
    display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;font-size:12px;
  }
  .filters label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;display:inline-flex;align-items:center;gap:6px}
  .filters input[type=search],
  .filters select{
    border:1.5px solid var(--border);background:#fff;padding:5px 9px;font-size:13px;color:var(--text);border-radius:0;font-family:inherit;
  }
  .filters input[type=search]{width:240px}
  .filters .spacer{flex:1}
  .filters .clear,
  .filters .export{
    border:2px solid var(--border);padding:5px 11px;font-size:11px;cursor:pointer;font-family:inherit;text-transform:uppercase;letter-spacing:.04em;
  }
  .filters .clear{background:transparent}
  .filters .clear:hover{background:#f3f4f6}
  .filters .export{background:var(--blue);color:#fff;font-weight:600}

  /* ── kanban ── */
  .kanban{
    display:grid;
    grid-template-columns:repeat(5, minmax(260px, 1fr));
    gap:12px;
    align-items:start;
  }
  .col{
    background:var(--surface);border:2px solid var(--border);box-shadow:var(--shadow);
    display:flex;flex-direction:column;min-height:120px;max-height:calc(100vh - 200px);
  }
  .col-head{
    padding:10px 12px;border-bottom:2px solid var(--border);
    display:flex;align-items:center;justify-content:space-between;gap:8px;
    text-transform:uppercase;letter-spacing:.06em;font-size:11px;font-weight:700;
    background:#fafafa;
  }
  .col-head .ct{
    background:var(--border);color:#fff;padding:2px 8px;font-size:11px;font-weight:700;min-width:24px;text-align:center;
  }
  .col[data-status="new"] .col-head{background:#fdf2f8}
  .col[data-status="emailed"] .col-head{background:#fef3c7}
  .col[data-status="replied"] .col-head{background:#dcfce7}
  .col[data-status="linked"] .col-head{background:#d1fae5;color:#065f46}
  .col[data-status="linked"] .col-head .ct{background:var(--green)}
  .col[data-status="dead"] .col-head{background:#f3f4f6;color:var(--muted)}
  .col-body{padding:8px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:8px}

  /* ── card ── */
  .card{
    background:var(--surface);border:1.5px solid var(--border);
    padding:8px 10px;cursor:pointer;
    transition:transform .08s ease, box-shadow .08s ease;
  }
  .card:hover{transform:translate(-1px,-1px);box-shadow:2px 2px 0 0 rgba(45,45,45,.2)}
  .card.dead{opacity:.55}
  .card-top{display:flex;align-items:center;gap:6px;margin-bottom:4px}
  .tier-pill{
    display:inline-block;padding:1px 6px;font-size:10px;font-weight:700;border:1.5px solid var(--border);
  }
  .tier-1{background:var(--pink);color:#fff}
  .tier-2{background:var(--blue);color:#fff}
  .tier-3{background:#e5e7eb}
  .score{font-weight:700;font-size:12px}
  .score.hi{color:var(--green)}
  .score.med{color:var(--amber)}
  .score.lo{color:var(--muted)}
  .domain{
    color:var(--muted);font-size:11px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    font-family:ui-monospace,Menlo,monospace;
  }
  .card-title{
    font-size:12.5px;font-weight:500;margin:2px 0 4px;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.3;
  }
  .card-pitch{
    font-size:11px;color:var(--text);margin-top:4px;line-height:1.35;
    display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
  }
  .card-pitch.empty{color:var(--muted);font-style:italic}
  .card-meta{
    margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;
    font-size:10px;
  }
  .tag{
    padding:1px 5px;border:1px solid var(--border);text-transform:uppercase;letter-spacing:.04em;
  }
  .tag.edu{background:#eef2ff;color:#3730a3}
  .tag.k12{background:#ecfeff;color:#0e7490}
  .tag.acuk{background:#fef3c7;color:#92400e}
  .tag.home{background:#fce7f3;color:#9d174d}
  .tag.comp{background:#fee2e2;color:#991b1b}
  .tag.broken{background:#fef9c3;color:#854d0e}
  .tag.email{background:#dbeafe;color:#1e3a8a}

  /* ── expanded modal ── */
  .modal-backdrop{
    position:fixed;inset:0;background:rgba(45,45,45,.55);display:none;align-items:center;justify-content:center;z-index:100;padding:20px;
  }
  .modal-backdrop.open{display:flex}
  .modal{
    background:var(--surface);border:2px solid var(--border);box-shadow:6px 6px 0 0 rgba(45,45,45,.25);
    max-width:760px;width:100%;max-height:92vh;overflow:auto;
    padding:20px 22px;
  }
  .modal h2{font-size:14px;letter-spacing:.04em;text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .modal .url-line{font-family:ui-monospace,Menlo,monospace;font-size:12px;word-break:break-all;margin-bottom:14px}
  .modal .url-line a{color:var(--pink);text-decoration:none;border-bottom:1px solid var(--pink)}
  .modal .section-label{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:14px 0 4px}
  .modal .pitch-text{font-size:13px;line-height:1.5;background:#fef9c3;padding:10px 12px;border:1px solid var(--border);margin-bottom:12px}
  .modal .pitch-text .broken-url{color:var(--red);word-break:break-all}
  .modal .pitch-text.empty{color:var(--muted);font-style:italic;background:#fafafa}
  .modal .contact-row{display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:14px}
  .modal .contact-row .email{
    background:var(--blue);color:#fff;padding:6px 12px;border:2px solid var(--border);text-decoration:none;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.04em;font-family:inherit;cursor:pointer;
  }
  .modal .contact-row .email:hover{filter:brightness(.95)}
  .modal .contact-row .email.flash{background:var(--green);border-color:var(--green)}
  .modal textarea.notes{
    width:100%;border:1.5px solid var(--border);padding:8px;font-size:13px;font-family:inherit;background:#fff;min-height:90px;resize:vertical;border-radius:0;
  }

  /* ── email composer ── */
  .email-toolbar{
    display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:8px;
  }
  .email-toolbar label{
    font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;display:inline-flex;align-items:center;gap:6px;
  }
  .email-toolbar select{
    border:1.5px solid var(--border);background:#fff;padding:4px 8px;font-size:12px;font-family:inherit;border-radius:0;
  }
  .email-toolbar .spacer{flex:1}
  .btn-tiny{
    border:1.5px solid var(--border);background:#fff;padding:4px 10px;font-size:11px;font-family:inherit;text-transform:uppercase;letter-spacing:.04em;cursor:pointer;font-weight:600;
  }
  .btn-tiny:hover{background:#f3f4f6}
  .btn-tiny.primary{background:var(--blue);color:#fff;border-color:var(--border)}
  .btn-tiny.primary:hover{filter:brightness(.95);background:var(--blue)}
  .btn-tiny.flash{background:var(--green);color:#fff;border-color:var(--green)}
  .email-field{display:block;margin-bottom:8px}
  .email-field > span{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:3px}
  .email-field input,
  .email-field textarea{
    width:100%;border:1.5px solid var(--border);padding:7px 9px;font-size:13px;font-family:inherit;background:#fff;border-radius:0;
  }
  .email-field textarea{min-height:220px;resize:vertical;line-height:1.5;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif}
  .email-hint{font-size:11px;color:var(--muted);margin-top:-2px;margin-bottom:8px}
  .modal .signals{font-family:ui-monospace,Menlo,monospace;font-size:11px;color:var(--muted);white-space:pre-wrap;background:#f9fafb;padding:8px;border:1px solid #e5e7eb;max-height:200px;overflow:auto}
  .status-btns{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}
  .status-btn{
    border:1.5px solid var(--border);background:#fff;padding:6px 11px;font-size:11px;text-transform:uppercase;letter-spacing:.04em;cursor:pointer;font-family:inherit;font-weight:600;
  }
  .status-btn.active{background:var(--border);color:#fff}
  .status-btn[data-set="emailed"]{background:#fef3c7}
  .status-btn[data-set="emailed"].active{background:var(--amber);color:#fff}
  .status-btn[data-set="replied"]{background:#dcfce7}
  .status-btn[data-set="replied"].active{background:#15803d;color:#fff}
  .status-btn[data-set="linked"]{background:#d1fae5}
  .status-btn[data-set="linked"].active{background:var(--green);color:#fff}
  .status-btn[data-set="dead"]{background:#f3f4f6}
  .status-btn[data-set="dead"].active{background:var(--muted);color:#fff}
  .modal-close{position:absolute;top:14px;right:18px;background:transparent;border:none;font-size:22px;cursor:pointer;color:var(--muted);font-family:inherit}
  .modal-close:hover{color:var(--text)}

  .empty-col{padding:14px;text-align:center;font-size:11px;color:var(--muted);font-style:italic}

  @media (max-width: 1100px){
    .kanban{grid-template-columns:repeat(3, minmax(260px, 1fr))}
  }
  @media (max-width: 720px){
    .kanban{grid-template-columns:1fr;}
    .col{max-height:none}
  }
</style>
</head>
<body>

<header>
  <div>
    <h1>FLAG ARCADE — BACKLINK CRM</h1>
    <div class="subtitle">__N_TOTAL__ prospects · click a card to open · status saves automatically</div>
  </div>
  <div style="font-size:11px;color:var(--muted);text-align:right">
    <div id="sync-pill" class="sync-pill offline"><span class="dot"></span><span id="sync-label">offline</span></div>
    <div style="margin-top:6px">Generated __GENERATED__</div>
  </div>
</header>

<div class="filters">
  <label>Tier
    <select id="f-tier">
      <option value="">All</option>
      <option value="1">Tier 1</option>
      <option value="2">Tier 2</option>
      <option value="3">Tier 3</option>
    </select>
  </label>
  <label>Search <input id="f-search" type="search" placeholder="url, domain, title, email…"></label>
  <label><input id="f-email" type="checkbox"> has email</label>
  <label><input id="f-comp" type="checkbox"> links to competitor</label>
  <label><input id="f-broken" type="checkbox"> broken-link hook</label>
  <label><input id="f-edu" type="checkbox"> .edu / k12</label>
  <span class="spacer"></span>
  <button class="clear" id="f-clear">Clear</button>
  <button class="export" id="f-export">Export visible CSV</button>
</div>

<div class="kanban" id="kanban">
  <div class="col" data-status="new">
    <div class="col-head"><span>New</span><span class="ct" id="ct-new">0</span></div>
    <div class="col-body" id="col-new"></div>
  </div>
  <div class="col" data-status="emailed">
    <div class="col-head"><span>Emailed</span><span class="ct" id="ct-emailed">0</span></div>
    <div class="col-body" id="col-emailed"></div>
  </div>
  <div class="col" data-status="replied">
    <div class="col-head"><span>Replied</span><span class="ct" id="ct-replied">0</span></div>
    <div class="col-body" id="col-replied"></div>
  </div>
  <div class="col" data-status="linked">
    <div class="col-head"><span>Linked ★</span><span class="ct" id="ct-linked">0</span></div>
    <div class="col-body" id="col-linked"></div>
  </div>
  <div class="col" data-status="dead">
    <div class="col-head"><span>Dead</span><span class="ct" id="ct-dead">0</span></div>
    <div class="col-body" id="col-dead"></div>
  </div>
</div>

<div id="modal-backdrop" class="modal-backdrop" role="dialog" aria-modal="true">
  <div class="modal" id="modal" style="position:relative">
    <button class="modal-close" id="modal-close" aria-label="close">×</button>
    <div id="modal-body"></div>
  </div>
</div>

<script>
const DATA = __DATA__;
const STORAGE_KEY = 'flagarcade_crm_v1';
const _basePath = window.location.pathname.replace(/\/[^/]*$/, '') || '';
const API_BASE = _basePath + '/api/state';
const COLS = ['new','emailed','replied','linked','dead']; // 'new' = status=='' (untouched)

// ── email templates ──
const SIGNATURE = 'Seth Coelen\nFlag Arcade · https://flagarcade.com · seth@coelen.co';

const HOOKS = {
  broken_competitor: 'I noticed the link to {{broken_url}} on the page looks dead — happy to suggest a replacement.',
  broken_topical:    'I noticed the link to {{broken_url}} is broken — wanted to flag it and share something that fits.',
  lists_competitors: 'I noticed you already link to a few flag/geography games — wanted to share another option.',
  topical_fit:       "It's a great resource list — wanted to share something that might fit.",
};

const TEMPLATES = {
  librarian: {
    label: 'Librarian / .edu',
    subject: 'A flag-quiz resource for your geography guide',
    body: `Hi there,

I came across your resources page at {{their_url}} and wanted to share something my son and I made that might be a nice fit. {{specific_hook}}

My 8 year old son has an amazing mind for geography, and together we built Flag Arcade (https://flagarcade.com) — a free educational flag-quiz game covering 197 countries and 49 territories across six game modes (a progression-based journey, an arcade mode, head-to-head jeopardy, and more).

No ads, no sign-up, no paywall. Once he started using it I kept adding to it, and it's grown into something we'd love to give away for free to as many people as possible.

Would you be willing to add our site to your guide? We just want to get the word out and share our love for geography and flags with others! And if there's a mode you'd love to see for your students — country capitals, flags of a specific region, anything — we'd be thrilled to build it.

Thanks so much for the wonderful work you do curating these pages,

{{signature}}`,
  },
  teacher_k12: {
    label: 'K-12 teacher',
    subject: 'A free flag game your students might love',
    body: `Hi!

I saw your resources page at {{their_url}} and wanted to share something my son and I made — I have a feeling your students might love it. {{specific_hook}}

My 8 year old son has an amazing mind for geography, and together we built Flag Arcade (https://flagarcade.com) — a free flag-quiz game with 197 countries, 49 territories, and six different game modes (a progression journey, an arcade mode, head-to-head jeopardy, and more). Kids can jump in and start playing instantly.

No ads, no sign-up, no paywall. Once my son started using it I kept adding to it, and it's grown into something we'd love to put in front of as many curious kids as possible.

Would you be willing to add our site to your resources page? We just want to get the word out and share our love for geography and flags with other kids! And if there's a mode you wish existed for your classroom (state flags, capitals, regional drills, anything else?), we'd be thrilled to build it.

Thanks so much for everything you do,

{{signature}}`,
  },
  homeschool: {
    label: 'Homeschool',
    subject: 'A flag game my son and I made — thought your readers might love it',
    body: `Hi!

I came across your resource list at {{their_url}} and wanted to reach out — {{specific_hook}}

Quick story: my 8 year old son has an amazing mind for geography, and together we built Flag Arcade (https://flagarcade.com). He got obsessed. Then I got obsessed making it better! It's grown into a free flag-quiz game covering 197 countries and 49 territories across six different game modes — a progression journey, an arcade mode, head-to-head jeopardy, and more.

No ads, no sign-up, no paywall. I kept adding to it as he kept playing, and it's turned into something we'd love to give away for free to as many homeschool families as possible.

Would you be willing to add our site to your resources page? We just want to get the word out and share our love for geography and flags with other families! And if there's a mode you wish existed (capitals, regional drills, anything your kids ask for), we'd be thrilled to build it.

Thanks so much for everything you do for homeschool families,

{{signature}}`,
  },
  geo_org: {
    label: 'Geography organization',
    subject: 'A free flag-quiz resource for your members',
    body: `Hi there,

I came across your resources page at {{their_url}} and wanted to share something my son and I made that might fit your mission. {{specific_hook}}

My 8 year old son has an amazing mind for geography, and together we built Flag Arcade (https://flagarcade.com) — a free educational flag-quiz game covering 197 countries and 49 territories across six game modes (a progression-based journey, an arcade mode, head-to-head jeopardy, and more).

No ads, no sign-up, no paywall. Once he started using it I kept adding to it, and it's grown into something we'd love to give away for free to as many people as possible.

Would you be willing to add our site to your resources? We just want to get the word out and share our love for geography and flags with others! And if there's a specific mode or coverage area that would be useful for your audience, we'd be thrilled to build it.

Thanks so much,

{{signature}}`,
  },
  general: {
    label: 'General',
    subject: 'A free flag-quiz game you might enjoy',
    body: `Hi!

I saw your page at {{their_url}} and wanted to share something my son and I made. {{specific_hook}}

My 8 year old son has an amazing mind for geography, and together we built Flag Arcade (https://flagarcade.com) — a free flag-quiz game with 197 countries, 49 territories, and six different game modes. No ads, no sign-up, no paywall, just a place to learn flags for the love of it.

Would you be willing to add our website to your resources page? We just want to get the word out about this resource and share our love for geography and flags with others! And if there's a mode you wish existed, we'd be thrilled to build it.

Thanks so much,

{{signature}}`,
  },
};

function detectCategory(r){
  const d = (r.domain || '').toLowerCase();
  const url = (r.url || '').toLowerCase();
  const title = (r.title || '').toLowerCase();
  if (d.endsWith('.org') && /(geograph|alliance|council|association|society)/.test(d + ' ' + title)){
    return 'geo_org';
  }
  if (/\.k12\.[a-z]{2}\.us$/.test(d) || d.endsWith('.k12.us')){
    return 'teacher_k12';
  }
  if (!d.endsWith('.edu') && /(elementary|middle school|high school|k-?12|kindergarten)/.test(title)){
    return 'teacher_k12';
  }
  if (d.endsWith('.edu') || d.endsWith('.ac.uk')){
    return 'librarian';
  }
  if (r.homeschool_like || /homeschool/.test(title) || /homeschool/.test(d)){
    return 'homeschool';
  }
  return 'general';
}

function detectPitchAngle(r){
  const p = r.pitch_hook || '';
  if (p.startsWith('Replace broken link to competitor:')) return 'broken_competitor';
  if (p.startsWith('Replace broken topical link:'))      return 'broken_topical';
  if (p.includes('already links to competitors'))         return 'lists_competitors';
  return 'topical_fit';
}

function extractBrokenUrl(pitch_hook){
  if (!pitch_hook) return '';
  const m = pitch_hook.match(/(https?:\/\/\S+?)(?:\s|\(|$)/);
  return m ? m[1] : '';
}

function buildEmail(r, category, opts){
  opts = opts || {};
  const mentionHook = opts.mentionHook !== false; // default true
  const tpl = TEMPLATES[category] || TEMPLATES.general;
  const angle = detectPitchAngle(r);
  const brokenUrl = extractBrokenUrl(r.pitch_hook);
  let hookText = '';
  if (mentionHook){
    hookText = (HOOKS[angle] || HOOKS.topical_fit).replace('{{broken_url}}', brokenUrl);
  }
  const body = tpl.body
    .replace('{{their_url}}', r.url)
    .replace('{{specific_hook}}', hookText)
    .replace('{{signature}}', SIGNATURE)
    .replace(/ +\n/g, '\n')        // trim trailing spaces on lines
    .replace(/\n{3,}/g, '\n\n')    // collapse runs of blank lines
    .replace(/[ \t]+$/g, '');      // trim trailing space at end
  return { subject: tpl.subject, body };
}

function loadCache(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'); }catch(e){return {}} }
function saveCache(s){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }catch(e){} }
let state = loadCache();

// Pre-populate state from per-prospect defaults (e.g. directory submissions arrive
// with `default_status: 'emailed'`). Only fills in if the user has never touched
// this prospect — existing localStorage state is sacrosanct.
(function seedDefaults(){
  let touched = false;
  for (const r of DATA){
    if (!r.default_status) continue;
    if (state[r.url] === undefined){
      state[r.url] = {
        status: r.default_status,
        notes: r.default_notes || '',
      };
      touched = true;
    }
  }
  if (touched) saveCache(state);
})();
function getRowState(url){ return state[url] || {status:'', notes:''}; }
function setRowState(url, patch){
  const cur = getRowState(url);
  state[url] = {...cur, ...patch};
  saveCache(state);
}
function colOf(status){ return status || 'new'; }

const syncPill = document.getElementById('sync-pill');
const syncLabel = document.getElementById('sync-label');
let onlineMode = false;
function setSync(mode, label){ syncPill.className = 'sync-pill ' + mode; syncLabel.textContent = label; }

async function pullServerState(){
  try{
    const resp = await fetch(API_BASE, {method:'GET'});
    if (!resp.ok) throw new Error('http '+resp.status);
    const server = await resp.json();
    state = {};
    for (const [url,v] of Object.entries(server)){
      state[url] = {status:v.status||'', notes:v.notes||''};
    }
    saveCache(state);
    onlineMode = true;
    setSync('synced','synced');
    return true;
  }catch(e){
    onlineMode = false;
    setSync('offline','offline (file://)');
    return false;
  }
}
const _noteTimers = new Map();
async function pushOne(url, patch){
  setRowState(url, patch);
  if (!onlineMode) return;
  setSync('pending','saving…');
  try{
    const resp = await fetch(API_BASE, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({url, ...patch}),
    });
    if (!resp.ok) throw new Error('http '+resp.status);
    setSync('synced','synced');
  }catch(e){
    setSync('error','save failed (will retry)');
    setTimeout(()=>pushOne(url,patch), 3000);
  }
}
function pushNoteDebounced(url, notes){
  clearTimeout(_noteTimers.get(url));
  _noteTimers.set(url, setTimeout(()=>pushOne(url,{notes}), 600));
}

const ui = {
  tier:   document.getElementById('f-tier'),
  search: document.getElementById('f-search'),
  email:  document.getElementById('f-email'),
  comp:   document.getElementById('f-comp'),
  broken: document.getElementById('f-broken'),
  edu:    document.getElementById('f-edu'),
  clear:  document.getElementById('f-clear'),
  export: document.getElementById('f-export'),
};

function applyFilters(){
  let rows = DATA.slice();
  const t = ui.tier.value;
  if (t) rows = rows.filter(r => String(r.tier)===t);
  const q = ui.search.value.trim().toLowerCase();
  if (q){
    rows = rows.filter(r =>
      (r.url||'').toLowerCase().includes(q) ||
      (r.domain||'').toLowerCase().includes(q) ||
      (r.title||'').toLowerCase().includes(q) ||
      (r.contact_email||'').toLowerCase().includes(q) ||
      (r.pitch_hook||'').toLowerCase().includes(q)
    );
  }
  if (ui.email.checked)  rows = rows.filter(r => r.contact_email);
  if (ui.comp.checked)   rows = rows.filter(r => r.has_competitor_links);
  if (ui.broken.checked) rows = rows.filter(r => r.has_broken_hook);
  if (ui.edu.checked)    rows = rows.filter(r => r.edu_like);
  rows.sort((a,b) => b.score - a.score);
  return rows;
}

function escapeHtml(s){return (s||'').replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]))}

function cardTags(r){
  const tags = [];
  if (r.edu_like && (r.domain||'').endsWith('.edu')) tags.push('<span class="tag edu">.edu</span>');
  else if (r.edu_like && (r.domain||'').endsWith('.ac.uk')) tags.push('<span class="tag acuk">.ac.uk</span>');
  else if (r.edu_like && (r.domain||'').includes('.k12.')) tags.push('<span class="tag k12">k12</span>');
  if (r.homeschool_like) tags.push('<span class="tag home">homeschool</span>');
  if (r.has_competitor_links) tags.push('<span class="tag comp">→ competitor</span>');
  if (r.has_broken_hook) tags.push('<span class="tag broken">broken-link</span>');
  if (r.contact_email) tags.push('<span class="tag email">📧 email</span>');
  return tags.join('');
}

function pitchInline(r){
  if (!r.pitch_hook) return '<div class="card-pitch empty">No specific pitch hook</div>';
  return `<div class="card-pitch">${escapeHtml(r.pitch_hook)}</div>`;
}

function cardHTML(r){
  const scoreClass = r.score >= 70 ? 'hi' : r.score >= 40 ? 'med' : 'lo';
  const status = getRowState(r.url).status || '';
  const dead = status === 'dead' ? ' dead' : '';
  return `
    <div class="card${dead}" data-url="${encodeURIComponent(r.url)}">
      <div class="card-top">
        <span class="tier-pill tier-${r.tier}">T${r.tier}</span>
        <span class="score ${scoreClass}">${r.score}</span>
        <span class="domain" title="${escapeHtml(r.domain)}">${escapeHtml(r.domain)}</span>
      </div>
      <div class="card-title">${escapeHtml(r.title || r.url)}</div>
      ${pitchInline(r)}
      <div class="card-meta">${cardTags(r)}</div>
    </div>
  `;
}

function render(){
  const rows = applyFilters();
  const buckets = {new:[], emailed:[], replied:[], linked:[], dead:[]};
  for (const r of rows){
    const status = getRowState(r.url).status || '';
    buckets[colOf(status)].push(r);
  }
  for (const col of COLS){
    const body = document.getElementById('col-'+col);
    const list = buckets[col];
    document.getElementById('ct-'+col).textContent = list.length;
    if (list.length === 0){
      body.innerHTML = '<div class="empty-col">—</div>';
    } else {
      body.innerHTML = list.map(cardHTML).join('');
    }
  }
}

// ── modal ──
const backdrop = document.getElementById('modal-backdrop');
const modalBody = document.getElementById('modal-body');
let openUrl = null;

function openCard(url){
  const r = DATA.find(x => x.url === url);
  if (!r) return;
  const s = getRowState(url);
  const current = s.status || '';
  const scoreClass = r.score >= 70 ? 'hi' : r.score >= 40 ? 'med' : 'lo';

  // highlight broken url in pitch
  let pitchHtml = '<div class="pitch-text empty">No specific pitch hook — propose addition based on topical fit.</div>';
  if (r.pitch_hook){
    let escaped = escapeHtml(r.pitch_hook);
    const m = r.pitch_hook.match(/(https?:\/\/\S+?)(?:\s|\(|$)/);
    if (m){
      const u = m[1];
      escaped = escaped.replace(escapeHtml(u), `<a class="broken-url" href="${u}" target="_blank" rel="noopener">${escapeHtml(u)}</a>`);
    }
    pitchHtml = `<div class="pitch-text">${escaped}</div>`;
  }

  const tagsHtml = cardTags(r);
  const sig = {
    domain: r.domain,
    topical_score: r.topical_score,
    outbound_count: r.outbound_count,
    broken_count: r.broken_count,
    has_competitor_links: r.has_competitor_links,
    has_broken_hook: r.has_broken_hook,
    edu_like: r.edu_like,
    homeschool_like: r.homeschool_like,
    email_count: r.email_count,
    last_modified: r.last_modified,
    negative_url_pattern: r.negative,
  };

  // ── email composer state ──
  const category = s.category || detectCategory(r);
  // Default the toggle ON for real pitches (broken link, lists competitors) and OFF
  // for pure topical-fit prospects where the hook sentence is redundant with the opener.
  const defaultMentionHook = detectPitchAngle(r) !== 'topical_fit';
  const mentionHook = (s.mention_hook === undefined) ? defaultMentionHook : !!s.mention_hook;
  const email = (s.email_subject || s.email_body)
    ? { subject: s.email_subject || '', body: s.email_body || '' }
    : buildEmail(r, category, {mentionHook});
  const catOptions = Object.keys(TEMPLATES).map(k =>
    `<option value="${k}" ${k===category?'selected':''}>${TEMPLATES[k].label}</option>`
  ).join('');

  modalBody.innerHTML = `
    <h2>
      <span class="tier-pill tier-${r.tier}">T${r.tier}</span>
      <span class="score ${scoreClass}">${r.score}</span>
      <span style="font-weight:normal;color:var(--muted);font-size:11px;font-family:ui-monospace,Menlo,monospace">${escapeHtml(r.domain)}</span>
      ${tagsHtml}
    </h2>
    <div class="url-line"><a href="${r.url}" target="_blank" rel="noopener">${escapeHtml(r.url)}</a></div>
    ${r.title ? `<div style="font-size:14px;font-weight:500;margin-bottom:14px">${escapeHtml(r.title)}</div>` : ''}

    <div class="section-label">Pitch hook</div>
    ${pitchHtml}

    <div class="section-label">Outreach email</div>
    <div class="email-toolbar">
      <label>Category
        <select id="email-category">${catOptions}</select>
      </label>
      <label title="Toggle the opening hook (the 'I noticed your broken link to X' sentence). Turn off if the link still works or the hook feels off.">
        <input type="checkbox" id="email-mention-hook" ${mentionHook ? 'checked' : ''}>
        Mention pitch hook
      </label>
      <span class="spacer"></span>
      <button class="btn-tiny" id="email-reset" title="Discard edits and regenerate from template">↺ Reset</button>
      <button class="btn-tiny primary" id="email-copy">📋 Copy</button>
      ${r.contact_email
        ? '<button class="btn-tiny primary" id="email-mail">✉ Open in Mail</button>'
        : '<button class="btn-tiny" disabled title="No email on file" id="email-mail">✉ No email</button>'}
    </div>
    <label class="email-field">
      <span>Subject</span>
      <input id="email-subject" type="text" value="${escapeHtml(email.subject)}">
    </label>
    <label class="email-field">
      <span>Body${r.contact_email ? '' : ' — no email on file; copy and paste into your client'}</span>
      <textarea id="email-body" rows="14">${escapeHtml(email.body)}</textarea>
    </label>

    <div class="section-label">Outreach status</div>
    <div class="status-btns" id="status-btns">
      <button class="status-btn ${current===''?'active':''}" data-set="">New</button>
      <button class="status-btn ${current==='emailed'?'active':''}" data-set="emailed">Emailed</button>
      <button class="status-btn ${current==='replied'?'active':''}" data-set="replied">Replied</button>
      <button class="status-btn ${current==='linked'?'active':''}" data-set="linked">Linked ★</button>
      <button class="status-btn ${current==='dead'?'active':''}" data-set="dead">Dead</button>
    </div>

    <div class="section-label">Contact</div>
    <div class="contact-row">
      ${r.contact_email
          ? `<button class="email" id="contact-copy" type="button" data-email="${escapeHtml(r.contact_email)}">✉ ${escapeHtml(r.contact_email)}</button>
             <span style="color:var(--muted);font-size:11px">click to copy</span>`
          : '<span style="color:var(--muted)">No email found — visit page to find contact info</span>'}
    </div>

    <div class="section-label">Notes</div>
    <textarea class="notes" id="notes" placeholder="Outreach date, response, follow-up plan…">${escapeHtml(s.notes||'')}</textarea>

    <div class="section-label">Scoring signals</div>
    <div class="signals">${escapeHtml(JSON.stringify(sig, null, 2))}</div>
  `;

  openUrl = url;
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(){
  backdrop.classList.remove('open');
  document.body.style.overflow = '';
  openUrl = null;
}

document.getElementById('modal-close').addEventListener('click', closeModal);
backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && openUrl) closeModal(); });

modalBody.addEventListener('click', e => {
  // status buttons
  const btn = e.target.closest('.status-btn');
  if (btn && openUrl){
    const val = btn.dataset.set;
    modalBody.querySelectorAll('.status-btn').forEach(b => b.classList.toggle('active', b===btn));
    pushOne(openUrl, {status: val});
    render();
    return;
  }
  // reset email to template
  if (e.target.id === 'email-reset' && openUrl){
    regenerateEmail();
    return;
  }
  // copy
  if (e.target.id === 'email-copy' && openUrl){
    const subj = modalBody.querySelector('#email-subject').value;
    const body = modalBody.querySelector('#email-body').value;
    const text = `Subject: ${subj}\n\n${body}`;
    const btnEl = e.target;
    const orig = btnEl.textContent;
    (navigator.clipboard?.writeText(text) || Promise.reject(new Error('no clipboard')))
      .then(() => {
        btnEl.textContent = '✓ Copied';
        btnEl.classList.add('flash');
        setTimeout(() => { btnEl.textContent = orig; btnEl.classList.remove('flash'); }, 1400);
      })
      .catch(() => {
        // fallback: select the body so user can manually copy
        modalBody.querySelector('#email-body').select();
      });
    return;
  }
  // copy contact email to clipboard
  const contactBtn = e.target.closest('#contact-copy');
  if (contactBtn){
    const addr = contactBtn.dataset.email;
    const orig = contactBtn.innerHTML;
    (navigator.clipboard?.writeText(addr) || Promise.reject(new Error('no clipboard')))
      .then(() => {
        contactBtn.innerHTML = '✓ Copied — ' + addr;
        contactBtn.classList.add('flash');
        setTimeout(() => { contactBtn.innerHTML = orig; contactBtn.classList.remove('flash'); }, 1400);
      })
      .catch(() => {
        // fallback: select the address (user can Cmd+C)
        const range = document.createRange();
        range.selectNodeContents(contactBtn);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      });
    return;
  }
  // open in mail
  if (e.target.id === 'email-mail' && openUrl){
    const r = DATA.find(x => x.url === openUrl);
    if (!r.contact_email) return;
    const subj = modalBody.querySelector('#email-subject').value;
    const body = modalBody.querySelector('#email-body').value;
    const href = 'mailto:' + encodeURIComponent(r.contact_email)
      + '?subject=' + encodeURIComponent(subj)
      + '&body=' + encodeURIComponent(body);
    window.location.href = href;
    return;
  }
});
function regenerateEmail(){
  if (!openUrl) return;
  const r = DATA.find(x => x.url === openUrl);
  if (!r) return;
  const cat = modalBody.querySelector('#email-category').value;
  const mention = modalBody.querySelector('#email-mention-hook').checked;
  const fresh = buildEmail(r, cat, {mentionHook: mention});
  modalBody.querySelector('#email-subject').value = fresh.subject;
  modalBody.querySelector('#email-body').value = fresh.body;
  pushOne(openUrl, {email_subject: fresh.subject, email_body: fresh.body, category: cat, mention_hook: mention});
}

modalBody.addEventListener('change', e => {
  // any of: category dropdown, mention-hook checkbox → regenerate
  if (e.target.id === 'email-category' || e.target.id === 'email-mention-hook'){
    regenerateEmail();
  }
});
const _emailTimers = new Map();
modalBody.addEventListener('input', e => {
  if (!openUrl) return;
  if (e.target.id === 'notes'){
    pushNoteDebounced(openUrl, e.target.value);
  } else if (e.target.id === 'email-subject' || e.target.id === 'email-body'){
    // debounce email edits 600ms
    const url = openUrl;
    const subj = modalBody.querySelector('#email-subject').value;
    const body = modalBody.querySelector('#email-body').value;
    clearTimeout(_emailTimers.get(url));
    _emailTimers.set(url, setTimeout(() => {
      pushOne(url, {email_subject: subj, email_body: body});
    }, 600));
  }
});

document.getElementById('kanban').addEventListener('click', e => {
  const card = e.target.closest('.card');
  if (!card) return;
  const url = decodeURIComponent(card.dataset.url);
  openCard(url);
});

[ui.tier, ui.email, ui.comp, ui.broken, ui.edu].forEach(el => el.addEventListener('change', render));
ui.search.addEventListener('input', render);
ui.clear.addEventListener('click', () => {
  ui.tier.value=''; ui.search.value='';
  ui.email.checked=false; ui.comp.checked=false; ui.broken.checked=false; ui.edu.checked=false;
  render();
});
ui.export.addEventListener('click', () => {
  const rows = applyFilters();
  const cols = ['tier','score','url','domain','contact_email','pitch_hook','last_modified','status','notes','topical_score','outbound_count','broken_count','has_competitor_links','title'];
  const lines = [cols.join(',')];
  for (const r of rows){
    const s = getRowState(r.url);
    const cells = cols.map(c => {
      let v;
      if (c === 'status') v = s.status || '';
      else if (c === 'notes') v = s.notes || '';
      else v = r[c] === undefined ? '' : r[c];
      v = String(v).replace(/"/g, '""');
      return /[",\n]/.test(v) ? `"${v}"` : v;
    });
    lines.push(cells.join(','));
  }
  const blob = new Blob([lines.join('\n')], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `flagarcade_prospects_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
});

render();
pullServerState().then(ok => { if (ok) render(); });
setInterval(() => { if (onlineMode) pullServerState().then(ok => { if (ok) render(); }); }, 60000);
</script>
</body>
</html>
"""


def main() -> int:
    from datetime import datetime, timezone
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    prospects = load_prospects()
    html = (
        HTML_TEMPLATE
        .replace("__N_TOTAL__", str(len(prospects)))
        .replace("__GENERATED__", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"))
        .replace("__DATA__", json.dumps(prospects, ensure_ascii=False))
    )
    OUT_PATH.write_text(html, encoding="utf-8")
    print(f"Wrote {OUT_PATH}  ({OUT_PATH.stat().st_size // 1024} KB, {len(prospects)} prospects)")

    # Also publish into the Vite public/ tree so `npm run build` ships it on flagarcade.com.
    pub = PUBLIC_PATH.resolve()
    pub.parent.mkdir(parents=True, exist_ok=True)
    pub.write_text(html, encoding="utf-8")
    print(f"Published to {pub}  (will be at /admin/dashboard after deploy)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
