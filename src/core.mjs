//
// ============================================================================
//  SYNTAX SITE  —  Netlify verzija (sav kod sajta je u ovom fajlu)
// ============================================================================
//
//  Sta radi:
//   - Pocetna strana ( / ) prikazuje sve videe sa tvog YouTube kanala
//     (grid sa "Get script" dugmadima, pretraga, ucitavanje na skrol).
//   - Svaki video automatski dobija stranicu  /v/VIDEO_ID  sa plejerom,
//     naslovom, pregledima i opisom iz YouTube-a. Ako stranica jos ne
//     postoji (video je tek objavljen), sajt je napravi ODMAH kad je neko
//     prvi put otvori.
//   - Link u opisu videa oblika  https://TVOJ-DOMEN/v/VIDEO_ID?wo=2LW/nesto
//     se na sajtu pretvara u  https://work.ink/2LW/nesto  ("Click Here"),
//     a "Get script" dugme na stranici videa vodi na isto mesto.
//     Parametar ?wo= iz samog URL-a se koristi i pre nego sto sajt uopste
//     povuce podatke o videu, tako da link radi od prve sekunde.
//   - Na svakih 5 minuta (Cron Trigger) sajt proverava kanal, dodaje nove
//     videe i osvezava preglede.
//
//  Podesavanja: SVE se menja direktno u kodu, u bloku SETTINGS, ADS i THEME
//  odmah ispod. Cloudflare "Variables and Secrets" vise NISU potrebne.
//
//  Hosting:   Netlify (netlify/functions/site.mjs prima sve zahteve)
//  Baza:      Netlify Blobs (automatski, nista ne podesavas)
//  Cron:      netlify/functions/refresh.mjs, svakih 5 minuta
// ============================================================================
//

const VERSION = '1.9.1';

// ===========================================================================
//  >>> TVOJA PODESAVANJA — popuni ovde <<<
// ===========================================================================
const SETTINGS = {
  YOUTUBE_API_KEY: 'AIzaSyDIS90kSgJMljy4TyFBWJRIyq7nw58P9vc',          // YouTube Data API v3 kljuc (Google Cloud Console)      [OBAVEZNO]
  CHANNEL_ID: 'UC9bQJOZtWDuqSIxZOXuZnIQ',             // ID tvog kanala, pocinje sa UC...                      [OBAVEZNO]
  ADMIN_KEY: 'djomlabratko13',           // tajna rec za  /admin/refresh?key=...  (izmisli sam)
  DISCORD_URL: '',              // npr. 'https://discord.gg/xxxx'  (prazno = nema dugmeta)
  CONTACT_EMAIL: '',            // prazno = ne prikazuje se
  INFO_TEXT: '',                // tekst na /info strani (prazno = podrazumevani pozdrav)
  SITE_NAME: '',                // prazno = ime YouTube kanala
  LOGO_URL: '',                 // prazno = slika kanala
  CTA_TEXT: 'Get script',
  HERO_TITLE_1: 'Latest',
  HERO_TITLE_2: 'scripts & exploits',
  HERO_SUBTITLE: 'Fresh working scripts, GUIs and auto-farms — updated daily.',
  WO_BASE: 'https://work.ink/',
  WO_ALLOWED_HOSTS: 'work.ink', // vise domena odvoji zarezom
  ADS_ENABLED: true,            // false = iskljuci sve reklame
  GATE_ENABLED: true,           // false = bez "Complete task" prozora
  GATE_SECONDS: 20,
  GATE_TASKS: 1,
  ADBLOCK_WALL: true,           // false = bez "AdBlock detected" zida
  MAX_VIDEOS: 1200,
};

// ---------------------------------------------------------------------------
//  Reklame (Adsterra) — upisi SVOJE linkove/kljuceve.
//  Prazan string ('') = ta reklama se jednostavno ne prikazuje.
// ---------------------------------------------------------------------------
const ADS = {
  smartlink: 'https://asiafilm.org/4/985c90589943945cb923a283f062f80b',     // Direct Link / Smartlink, npr. 'https://xxxx.org/4/KLJUC'
  popunder: 'https://accountut.com/1/5031393ca98aa6743ec6af07fed7fa9e',      // Popunder skripta, npr. 'https://xxxx.org/1/KLJUC'
  socialBar: 'https://bellnewyork.org/14/b55f846e0f46daeba538b0d6f5dc9d43',     // Social Bar skripta, npr. 'https://xxxx.org/14/KLJUC'
  nativeScript: 'https://bellnewyork.org/21/ee50c302cd309481a3d037b147bb0428',  // Native Banner skripta, npr. 'https://xxxx.org/21/KLJUC'
  nativeId: 'ee50c302cd309481a3d037b147bb0428',      // KLJUC iz Native Banner koda (onaj iz  container-KLJUC)
  bannerHost: 'https://bellnewyork.org/22/',    // domen banera sa putanjom, npr. 'https://xxxx.org/22/'
  banners: {         // samo KLJUC svakog banera (bez domena)
    '728x90': '6558712554f9170994a46a2dc3c6adb0',
    '468x60': '37eb9b267d932974f9acaa5b40adecba',
    '320x50': '21030ee054170b3cedc2abfe4f06864a',
    '300x250': '43e9ac6f04d58b351b8f45098489c3cd',
    '160x600': '29d3bc80fdb6a4539a883c21c26b4f75',
    '160x300': 'd024df37a9709f00a367baa90a767f10',
  },
};

// ---------------------------------------------------------------------------
//  TEMA — promeni samo THEME_NAME (skyyellow, orange, blue, purple, green, red, pink),
//  ili izmeni boje u nekoj od tema po zelji.
//  rgb / rgb2 su iste boje kao accent / accent2, samo zapisane kao "R,G,B".
// ---------------------------------------------------------------------------
const THEME_NAME = 'skyyellow';
const THEMES = {
  skyyellow: { accent: '#5cc8ff', accent2: '#ffd84d', g1: '#5cc8ff', g2: '#a8e4ff', g3: '#ffd84d', onAccent: '#0a1626', rgb: '92,200,255', rgb2: '255,216,77', link: '#7fd6ff', code: '#fff1b3', hover: '#1d4a66' },
  orange: { accent: '#ffb300', accent2: '#ff6a00', g1: '#ffd23f', g2: '#ffa62b', g3: '#ff6a00', onAccent: '#1a1200', rgb: '255,179,0',  rgb2: '255,106,0',  link: '#ffc857', code: '#ffe2a8', hover: '#5c4a1e' },
  blue:   { accent: '#3b9dff', accent2: '#2563eb', g1: '#67e8f9', g2: '#3b9dff', g3: '#2563eb', onAccent: '#ffffff', rgb: '59,157,255', rgb2: '37,99,235',  link: '#7cc4ff', code: '#bfe3ff', hover: '#1e3f66' },
  purple: { accent: '#a855f7', accent2: '#7c3aed', g1: '#e879f9', g2: '#a855f7', g3: '#7c3aed', onAccent: '#ffffff', rgb: '168,85,247', rgb2: '124,58,237', link: '#c99bff', code: '#e2ccff', hover: '#4a2c6e' },
  green:  { accent: '#22c55e', accent2: '#059669', g1: '#a3e635', g2: '#22c55e', g3: '#059669', onAccent: '#04140a', rgb: '34,197,94',  rgb2: '5,150,105',  link: '#6ee79a', code: '#c6f6d5', hover: '#1f5134' },
  red:    { accent: '#ef4444', accent2: '#b91c1c', g1: '#fb923c', g2: '#ef4444', g3: '#b91c1c', onAccent: '#ffffff', rgb: '239,68,68',  rgb2: '185,28,28',  link: '#ff8a8a', code: '#ffd0d0', hover: '#5e2323' },
  pink:   { accent: '#ec4899', accent2: '#db2777', g1: '#f9a8d4', g2: '#ec4899', g3: '#db2777', onAccent: '#ffffff', rgb: '236,72,153', rgb2: '219,39,119', link: '#ff9cd0', code: '#ffd3ea', hover: '#5e2346' },
};
// Zajednicke tamne pozadine (mozes i njih menjati)
const BASE = { bg: '#0d0e12', bg2: '#14161d', surface: '#181b23', surface2: '#1f2330', border: '#262a36', text: '#f2f4f8', textDim: '#9aa3b2', textFaint: '#6b7385' };
const T = Object.assign({}, BASE, THEMES[THEME_NAME] || THEMES.orange);

// "Otisak" ADS podesavanja: kad god promenis nesto gore, baneri (iframe /ad/...) dobijaju novu adresu
// i ucitavaju se iznova — inace bi browser i Cloudflare kes jos do 24h servirali stari kod banera.
const ADS_REV = (function (s) { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); })(JSON.stringify(ADS));

// Koliko dugo se sta cuva pre nego sto se ponovo povuce sa YouTube-a
const CHANNEL_TTL = 60 * 60 * 1000;          // podaci o kanalu: 1h
const STATS_TTL = 30 * 60 * 1000;            // pregledi najnovijih 50 videa: 30 min
const RECENT_STATS_TTL = 6 * 60 * 60 * 1000; // pregledi videa iz poslednjih RECENT_DAYS dana: 6h
const RECENT_DAYS = 90;
const FULL_STATS_TTL = 7 * 24 * 60 * 60 * 1000; // pregledi bas svih videa: jednom nedeljno
const VIDEO_TTL = 7 * 24 * 60 * 60 * 1000;   // opis/naslov pojedinacnog (novog) videa: 7 dana
const CHUNK_SIZE = 100;                      // koliko opisa starijih videa ide u jedan KV zapis
const CHUNK_MIN = 50;                        // pakuj tek kad se nakupi ovoliko nezapakovanih videa
// Kes u memoriji Workera (zivi dok zivi isolate) — stedi KV citanja
const MEM = { channel: null, channelAt: 0, index: null, indexRaw: '', indexAt: 0, videos: new Map(), chunks: new Map(), notFound: new Map(), apiUnits: 0 };
const MEM_NOTFOUND_TTL = 30 * 60 * 1000;    // koliko dugo pamtimo da video ne postoji (da botovi ne trose API)
const MEM_CHANNEL_TTL = 5 * 60 * 1000;
const MEM_INDEX_TTL = 60 * 1000;
const MEM_VIDEO_TTL = 10 * 60 * 1000;
const MEM_CHUNK_TTL = 30 * 60 * 1000;
const BACKFILL_PAGES_PER_RUN = 2;            // koliko stranica plejliste po jednom prolazu (50 videa po stranici)
const PAGE_CACHE_SECONDS = 120;              // edge kes pocetne strane
const VIDEO_CACHE_SECONDS = 600;             // edge kes stranice videa
const STATIC_CACHE_SECONDS = 600;            // edge kes Info/Contact/404
const ID_RE = /^[A-Za-z0-9_-]{11}$/;

// ---------------------------------------------------------------------------
//  Konfiguracija
// ---------------------------------------------------------------------------
function cfg(env) {
  const S = SETTINGS;
  const woBase = String(S.WO_BASE || 'https://work.ink/').trim();
  return {
    channelId: String(S.CHANNEL_ID || '').trim(),
    apiKey: String(S.YOUTUBE_API_KEY || '').trim(),
    apiBase: 'https://www.googleapis.com/youtube/v3',
    siteName: String(S.SITE_NAME || '').trim(),
    heroTitle1: S.HERO_TITLE_1 || 'Latest',
    heroTitle2: S.HERO_TITLE_2 || 'scripts & exploits',
    heroSubtitle: S.HERO_SUBTITLE || '',
    woBase: woBase.endsWith('/') ? woBase : woBase + '/',
    woHosts: String(S.WO_ALLOWED_HOSTS || 'work.ink').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean),
    discordUrl: String(S.DISCORD_URL || '').trim(),
    contactEmail: String(S.CONTACT_EMAIL || '').trim(),
    infoText: String(S.INFO_TEXT || '').trim(),
    adminKey: String(S.ADMIN_KEY || '').trim(),
    logoUrl: String(S.LOGO_URL || '').trim(),
    ctaText: S.CTA_TEXT || 'Get script',
    pageSize: 30,
    adsEnabled: S.ADS_ENABLED !== false,
    gateEnabled: S.GATE_ENABLED !== false,
    gateSeconds: Math.max(1, Number(S.GATE_SECONDS) || 20),
    gateTasks: Math.max(1, Number(S.GATE_TASKS) || 1),
    adblockWall: S.ADBLOCK_WALL !== false,
    maxVideos: Math.max(50, Number(S.MAX_VIDEOS) || 1200),
  };
}

// ---------------------------------------------------------------------------
//  Pomocne funkcije
// ---------------------------------------------------------------------------
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCompact(n) {
  n = Number(n) || 0;
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  if (n < 1000000) return Math.round(n / 1000) + 'K';
  if (n < 10000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  return Math.round(n / 1000000) + 'M';
}

function formatViews(n) {
  return formatCompact(n) + ' Views';
}

function timeAgo(iso, now) {
  const t = Date.parse(iso || '');
  if (!t) return '';
  const s = Math.max(0, Math.floor(((now || Date.now()) - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return m + (m === 1 ? ' minute' : ' minutes');
  const h = Math.floor(m / 60);
  if (h < 24) return h + (h === 1 ? ' hour' : ' hours');
  const d = Math.floor(h / 24);
  if (d < 30) return d + (d === 1 ? ' day' : ' days');
  const mo = Math.floor(d / 30);
  if (mo < 12) return mo + (mo === 1 ? ' month' : ' months');
  const y = Math.floor(d / 365);
  return y + (y === 1 ? ' year' : ' years');
}

function isNew(iso, now) {
  const t = Date.parse(iso || '');
  return !!t && (now || Date.now()) - t < 24 * 60 * 60 * 1000;
}

function thumbUrl(id) {
  return 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
}

// Pretvara "wo" vrednost (npr. "2LW/infected-lands-script" ili pun URL) u
// dozvoljen odredisni URL. Vraca null ako vrednost nije dozvoljena.
function resolveWo(value, c) {
  if (!value) return null;
  let v = String(value).trim();
  try { v = decodeURIComponent(v); } catch (e) { /* ostavi kako jeste */ }
  v = v.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v);
      const host = u.hostname.toLowerCase();
      const ok = c.woHosts.some((h) => host === h || host.endsWith('.' + h));
      return ok ? u.href : null;
    } catch (e) { return null; }
  }
  v = v.replace(/^\/+/, '');
  if (!/^[A-Za-z0-9._~%\-\/]+$/.test(v)) return null;
  return c.woBase + v;
}

// Pretvara tekst opisa u HTML: svi linkovi postaju "Click Here";
// link oblika  .../v/VIDEO_ID?wo=XYZ  postaje link ka work.ink-u.
function convertDescription(text, c) {
  const src = String(text || '');
  const urlRe = /https?:\/\/[^\s<>"' ]+/g;
  let html = '';
  let last = 0;
  let wo = null;
  let m;
  while ((m = urlRe.exec(src)) !== null) {
    html += esc(src.slice(last, m.index));
    let url = m[0];
    let trail = '';
    while (/[.,!?:;)\]]$/.test(url)) { trail = url.slice(-1) + trail; url = url.slice(0, -1); }
    let target = null;
    const woMatch = url.match(/\/v\/[A-Za-z0-9_-]{11}\/?\?(?:[^#]*?&)?wo=([^&#\s]+)/);
    if (woMatch) target = resolveWo(woMatch[1], c);   // nas link sa ?wo=  -> work.ink
    else target = resolveWo(url, c);                   // direktan work.ink link u opisu
    if (target) {
      if (!wo) wo = target;
      html += '<a href="' + esc(target) + '">Click Here</a>';
    } else {
      html += '<a target="_blank" rel="noopener noreferrer" href="' + esc(url) + '">Click Here</a>';
    }
    html += esc(trail);
    last = m.index + m[0].length;
  }
  html += esc(src.slice(last));
  html = html.replace(/\r\n|\r|\n/g, '<br>');
  return { html, wo };
}

function unesc(s) {
  return String(s == null ? '' : s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

// Kratak opis za <meta name="description"> iz vec konvertovanog HTML opisa
function descriptionSummary(html) {
  const t = unesc(String(html || '').replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, ' ').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' '));
  return t.replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim().slice(0, 160);
}

// Naslov videa bez API kljuca (rezerva ako YouTube API ne radi)
async function oembedTitle(id) {
  try {
    const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id));
    if (!r.ok) return '';
    const j = await r.json();
    return (j && j.title) || '';
  } catch (e) { return ''; }
}

// ---------------------------------------------------------------------------
//  KV
// ---------------------------------------------------------------------------
async function kvGetJSON(env, key) {
  try {
    const raw = await env.KV.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function kvPutJSON(env, key, value) {
  return env.KV.put(key, JSON.stringify(value));
}
function emptyIndex() {
  return { at: 0, statsAt: 0, fullStatsAt: 0, videos: [] };
}
// fresh=true: uvek citaj iz KV-a i vrati nov objekat (za cron koji menja indeks)
async function loadIndex(env, fresh) {
  const now = Date.now();
  if (!fresh && MEM.index && now - MEM.indexAt < MEM_INDEX_TTL) return MEM.index;
  let raw = '';
  try { raw = (await env.KV.get('index')) || ''; } catch (e) { raw = ''; }
  let idx = null;
  try { idx = raw ? JSON.parse(raw) : null; } catch (e) { idx = null; }
  if (!idx || !Array.isArray(idx.videos)) { idx = emptyIndex(); raw = JSON.stringify(idx); }
  if (!fresh) { MEM.index = idx; MEM.indexRaw = raw; MEM.indexAt = now; }
  return idx;
}
async function indexRaw(env) {
  await loadIndex(env);
  return MEM.indexRaw || JSON.stringify(MEM.index || emptyIndex());
}
function sortVideos(videos) {
  videos.sort((a, b) => (b.p > a.p ? 1 : b.p < a.p ? -1 : 0));
}
async function saveIndex(env, index) {
  index.at = Date.now();
  sortVideos(index.videos);
  const raw = JSON.stringify(index);
  await env.KV.put('index', raw);
  MEM.index = index; MEM.indexRaw = raw; MEM.indexAt = Date.now();
}
// Zadrzi samo najnovijih c.maxVideos videa; obrisi KV zapise (chunk-ove, v:ID) koje vise niko ne koristi
async function trimIndex(env, c, index) {
  sortVideos(index.videos);
  if (index.videos.length <= c.maxVideos) return 0;
  const dropped = index.videos.splice(c.maxVideos);
  const stillUsed = new Set(index.videos.map((v) => v.c).filter((n) => typeof n === 'number' && n >= 0));
  const dels = [];
  const seenChunks = new Set();
  for (const v of dropped) {
    dels.push(env.KV.delete('v:' + v.id).catch(() => {}));
    MEM.videos.delete(v.id);
    if (typeof v.c === 'number' && v.c >= 0 && !stillUsed.has(v.c) && !seenChunks.has(v.c)) { seenChunks.add(v.c); dels.push(env.KV.delete('chunk:' + v.c).catch(() => {})); MEM.chunks.delete(v.c); }
  }
  await Promise.all(dels);
  return dropped.length;
}

// Jednokratno ciscenje (admin ?cleanup=1): obrisi v:* i chunk:* kljuceve koji nisu u indeksu
async function cleanupKV(env, index) {
  const keep = new Set(index.videos.map((v) => 'v:' + v.id));
  const usedChunks = new Set(index.videos.map((v) => v.c).filter((n) => typeof n === 'number' && n >= 0).map((n) => 'chunk:' + n));
  let deleted = 0;
  for (const prefix of ['v:', 'chunk:']) {
    let cursor;
    for (let guard = 0; guard < 50; guard++) {
      const res = await env.KV.list({ prefix, cursor, limit: 1000 });
      const doomed = (res.keys || []).map((k) => k.name).filter((name) => (prefix === 'v:' ? !keep.has(name) : !usedChunks.has(name)));
      for (let i = 0; i < doomed.length; i += 25) await Promise.all(doomed.slice(i, i + 25).map((name) => env.KV.delete(name).catch(() => {})));
      deleted += doomed.length;
      if (res.list_complete || !res.cursor) break;
      cursor = res.cursor;
    }
  }
  MEM.videos.clear(); MEM.chunks.clear();
  return deleted;
}

async function getChunk(env, n) {
  const now = Date.now();
  const m = MEM.chunks.get(n);
  if (m && now - m.at < MEM_CHUNK_TTL) return m.data;
  const data = (await kvGetJSON(env, 'chunk:' + n)) || {};
  if (MEM.chunks.size > 150) MEM.chunks.clear();
  MEM.chunks.set(n, { data, at: now });
  return data;
}
function remember(id, rec) {
  if (MEM.videos.size > 1500) MEM.videos.clear();
  MEM.videos.set(id, { rec, at: Date.now() });
}

// ---------------------------------------------------------------------------
//  YouTube Data API v3
// ---------------------------------------------------------------------------
async function yt(c, endpoint, params) {
  if (!c.apiKey) throw new Error('YOUTUBE_API_KEY nije podesen');
  const u = new URL(c.apiBase + '/' + endpoint);
  for (const k of Object.keys(params)) {
    const v = params[k];
    if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, v);
  }
  u.searchParams.set('key', c.apiKey);
  MEM.apiUnits++; // svaki list poziv = 1 jedinica kvote
  const r = await fetch(u.toString(), { headers: { accept: 'application/json' } });
  let data = null;
  try { data = await r.json(); } catch (e) { /* ignorisi */ }
  if (!r.ok) {
    const msg = (data && data.error && data.error.message) || ('HTTP ' + r.status);
    throw new Error('YouTube API: ' + msg);
  }
  return data || {};
}

function uploadsFromChannelId(channelId) {
  return channelId && channelId.startsWith('UC') ? 'UU' + channelId.slice(2) : '';
}

async function fetchChannel(c) {
  const data = await yt(c, 'channels', {
    part: 'snippet,statistics,contentDetails',
    id: c.channelId,
    fields: 'items(id,snippet/title,snippet/thumbnails/medium/url,snippet/thumbnails/high/url,statistics/subscriberCount,contentDetails/relatedPlaylists/uploads)',
  });
  const it = data.items && data.items[0];
  if (!it) throw new Error('Kanal nije pronadjen: ' + c.channelId);
  const th = (it.snippet && it.snippet.thumbnails) || {};
  const subsRaw = Number(it.statistics && it.statistics.subscriberCount) || 0;
  return {
    id: it.id,
    title: (it.snippet && it.snippet.title) || '',
    logo: (th.medium && th.medium.url) || (th.high && th.high.url) || '',
    subsRaw,
    subs: formatCompact(subsRaw),
    uploads: (it.contentDetails && it.contentDetails.relatedPlaylists && it.contentDetails.relatedPlaylists.uploads) || uploadsFromChannelId(c.channelId),
    at: Date.now(),
  };
}

async function fetchPlaylistPage(c, playlistId, pageToken, withDescription) {
  const data = await yt(c, 'playlistItems', {
    part: 'snippet,contentDetails',
    playlistId,
    maxResults: 50,
    pageToken: pageToken || '',
    fields: 'nextPageToken,items(snippet/title,snippet/publishedAt' + (withDescription ? ',snippet/description' : '') + ',contentDetails/videoId,contentDetails/videoPublishedAt)',
  });
  const items = [];
  for (const it of data.items || []) {
    const id = it.contentDetails && it.contentDetails.videoId;
    if (!id || !ID_RE.test(id)) continue;
    const p = (it.contentDetails && it.contentDetails.videoPublishedAt) || (it.snippet && it.snippet.publishedAt) || '';
    if (!p) continue; // privatni / nedostupni video
    items.push({ id, t: (it.snippet && it.snippet.title) || '', d: it.snippet ? it.snippet.description : undefined, p });
  }
  return { items, next: data.nextPageToken || '' };
}

async function fetchStats(c, ids) {
  const map = new Map();
  const batches = [];
  for (let i = 0; i < ids.length; i += 50) batches.push(ids.slice(i, i + 50));
  const results = await Promise.all(batches.map((b) => yt(c, 'videos', {
    part: 'statistics',
    id: b.join(','),
    maxResults: 50,
    fields: 'items(id,statistics/viewCount)',
  })));
  for (const data of results) {
    for (const it of data.items || []) map.set(it.id, Number(it.statistics && it.statistics.viewCount) || 0);
  }
  return map;
}

// Naslov + opis za vise videa odjednom (za pakovanje starijih videa u chunk-ove)
async function fetchSnippets(c, ids) {
  const map = new Map();
  const batches = [];
  for (let i = 0; i < ids.length; i += 50) batches.push(ids.slice(i, i + 50));
  const results = await Promise.all(batches.map((b) => yt(c, 'videos', {
    part: 'snippet',
    id: b.join(','),
    maxResults: 50,
    fields: 'items(id,snippet/title,snippet/description)',
  })));
  for (const data of results) {
    for (const it of data.items || []) map.set(it.id, { t: (it.snippet && it.snippet.title) || '', d: (it.snippet && it.snippet.description) || '' });
  }
  return map;
}

async function fetchVideo(c, id) {
  const data = await yt(c, 'videos', {
    part: 'snippet,statistics',
    id,
    fields: 'items(id,snippet/title,snippet/description,snippet/publishedAt,snippet/channelId,statistics/viewCount)',
  });
  const it = data.items && data.items[0];
  if (!it) return null;
  return {
    id: it.id,
    t: (it.snippet && it.snippet.title) || '',
    d: (it.snippet && it.snippet.description) || '',
    p: (it.snippet && it.snippet.publishedAt) || '',
    channelId: (it.snippet && it.snippet.channelId) || '',
    v: Number(it.statistics && it.statistics.viewCount) || 0,
  };
}

// ---------------------------------------------------------------------------
//  Osvezavanje podataka (cron / admin)
// ---------------------------------------------------------------------------
async function getChannel(env, c, opts) {
  const now = Date.now();
  const force = !!(opts && opts.force);
  if (!force && MEM.channel && now - MEM.channelAt < MEM_CHANNEL_TTL) return MEM.channel;
  let channel = await kvGetJSON(env, 'channel');
  if (channel && now - (channel.at || 0) < CHANNEL_TTL && !force) { MEM.channel = channel; MEM.channelAt = now; return channel; }
  try {
    const fresh = await fetchChannel(c);
    await kvPutJSON(env, 'channel', fresh);
    MEM.channel = fresh; MEM.channelAt = now;
    return fresh;
  } catch (e) {
    if (channel) { MEM.channel = channel; MEM.channelAt = now; return channel; }
    throw e;
  }
}

async function refresh(env, c, opts) {
  opts = opts || {};
  const status = { ok: true, version: VERSION, actions: [], errors: [], at: new Date().toISOString() };
  const now = Date.now();
  if (!c.channelId) { status.ok = false; status.errors.push('CHANNEL_ID nije podesen'); return status; }
  if (!c.apiKey) { status.ok = false; status.errors.push('YOUTUBE_API_KEY nije podesen'); return status; }

  let channel;
  try {
    channel = await getChannel(env, c, opts);
    status.channel = channel.title + ' (' + channel.subs + ')';
  } catch (e) {
    status.ok = false; status.errors.push(String(e.message || e)); return status;
  }
  const uploads = channel.uploads || uploadsFromChannelId(c.channelId);
  const index = await loadIndex(env, true);
  const known = new Set(index.videos.map((v) => v.id));

  // --- Backfill: prvi put prolazimo kroz celu listu videa (50 po stranici) ---
  let bf = (await kvGetJSON(env, 'backfill')) || { done: false, token: '', pages: 0 };
  if (opts.reset) { bf = { done: false, token: '', pages: 0 }; }
  if (!bf.done) {
    const added = [];
    let token = bf.token || '';
    try {
      for (let i = 0; i < BACKFILL_PAGES_PER_RUN; i++) {
        const page = await fetchPlaylistPage(c, uploads, token, false);
        for (const it of page.items) {
          if (known.has(it.id)) continue;
          known.add(it.id);
          index.videos.push({ id: it.id, t: it.t, v: 0, p: it.p });
          added.push(it.id);
        }
        bf.pages++;
        token = page.next;
        if (!token || index.videos.length >= c.maxVideos) { bf.done = true; break; }
      }
      bf.token = token;
      if (added.length) {
        const stats = await fetchStats(c, added);
        for (const v of index.videos) if (stats.has(v.id)) v.v = stats.get(v.id);
      }
      if (bf.done) { index.statsAt = now; index.fullStatsAt = now; index.recentStatsAt = now; await trimIndex(env, c, index); }
      bf.at = now;
      await saveIndex(env, index);
      await kvPutJSON(env, 'backfill', bf);
      status.actions.push('backfill: +' + added.length + ' videos (pages: ' + bf.pages + (bf.done ? ', DONE' : ', more to go') + ')');
    } catch (e) {
      status.ok = false; status.errors.push(String(e.message || e));
    }
    status.backfill = { done: bf.done, pages: bf.pages };
    status.total = index.videos.length;
    return status;
  }

  // --- Redovno: proveri najnovijih 50 videa, dodaj nove, osvezi preglede ---
  const unitsBefore = MEM.apiUnits;
  try {
    const page = await fetchPlaylistPage(c, uploads, '', true);
    const fresh = page.items.filter((it) => !known.has(it.id));
    let changed = false;

    for (const it of page.items) {
      const ex = index.videos.find((v) => v.id === it.id);
      if (ex && it.t && ex.t !== it.t) { ex.t = it.t; changed = true; }
    }

    const needFull = now - (index.fullStatsAt || 0) > FULL_STATS_TTL;
    const needRecent = now - (index.recentStatsAt || 0) > RECENT_STATS_TTL;
    const needTop = fresh.length > 0 || now - (index.statsAt || 0) > STATS_TTL;
    let stats = new Map();
    let statsMode = 'skipped';
    if (needFull || needRecent || needTop) {
      let ids;
      if (needFull) { ids = index.videos.map((v) => v.id); statsMode = 'all'; }
      else if (needRecent) { const cut = new Date(now - RECENT_DAYS * 86400000).toISOString(); ids = index.videos.filter((v) => v.p >= cut).map((v) => v.id); statsMode = 'last ' + RECENT_DAYS + ' days (' + ids.length + ')'; }
      else { ids = page.items.map((it) => it.id); statsMode = 'top 50'; }
      ids = ids.concat(fresh.map((f) => f.id));
      stats = await fetchStats(c, Array.from(new Set(ids)));
      for (const v of index.videos) if (stats.has(v.id)) v.v = stats.get(v.id);
      index.statsAt = now;
      if (needFull) { index.fullStatsAt = now; index.recentStatsAt = now; }
      else if (needRecent) index.recentStatsAt = now;
      changed = true;
    }

    for (const it of fresh) {
      const conv = convertDescription(it.d || '', c);
      const views = stats.has(it.id) ? stats.get(it.id) : 0;
      const rec = { id: it.id, t: it.t, d: conv.html, w: conv.wo, v: views, p: it.p, at: now };
      index.videos.push({ id: it.id, t: it.t, v: views, p: it.p });
      try { await kvPutJSON(env, 'v:' + it.id, rec); remember(it.id, rec); } catch (e) { status.errors.push('KV put v:' + it.id + ': ' + (e.message || e)); }
      changed = true;
    }

    // Zadrzi samo najnovijih MAX_VIDEOS
    const trimmed = await trimIndex(env, c, index);
    if (trimmed) { changed = true; status.actions.push('trimmed ' + trimmed + ' older videos (limit ' + c.maxVideos + ')'); }
    // Odmah sacuvaj (da osvezeni pregledi/novi videi ostanu upisani i ako pakovanje ispod pukne)
    if (changed) { await saveIndex(env, index); changed = false; }
    status.actions.push('checked newest ' + page.items.length + ' videos, new: ' + fresh.length + ', stats: ' + statsMode);
    status.new = fresh.map((f) => f.id);
  } catch (e) {
    status.ok = false; status.errors.push(String(e.message || e));
  }

  // --- Pakovanje: opisi starijih videa idu u chunk-ove od po 100 (1 KV upis umesto 100) ---
  try {
    const unchunked = index.videos.filter((v) => typeof v.c !== 'number');
    status.packingLeft = 0;
    if (unchunked.length >= CHUNK_MIN || (unchunked.length > 0 && opts.force)) {
      const cs = (await kvGetJSON(env, 'chunks')) || { next: 0 };
      const batch = unchunked.slice(-CHUNK_SIZE); // lista je sortirana najnoviji-prvi, pa su na kraju najstariji
      const details = await fetchSnippets(c, batch.map((v) => v.id));
      const chunk = {};
      const gone = new Set();
      for (const v of batch) {
        const d = details.get(v.id);
        if (!d) { gone.add(v.id); continue; } // obrisan/privatan video: izbaci iz liste
        const conv = convertDescription(d.d, c);
        chunk[v.id] = { d: conv.html, w: conv.wo };
        v.c = cs.next;
        if (d.t) v.t = d.t;
      }
      if (gone.size) index.videos = index.videos.filter((v) => !gone.has(v.id));
      await kvPutJSON(env, 'chunk:' + cs.next, chunk);
      MEM.chunks.set(cs.next, { data: chunk, at: now });
      cs.next++;
      await kvPutJSON(env, 'chunks', cs);
      await saveIndex(env, index);
      status.actions.push('packed ' + Object.keys(chunk).length + ' older videos into chunk ' + (cs.next - 1) + (gone.size ? ', removed ' + gone.size + ' unavailable' : '') + ' (' + Math.max(0, unchunked.length - batch.length) + ' left)');
      status.packingLeft = Math.max(0, unchunked.length - batch.length);
    }
  } catch (e) {
    status.ok = false; status.errors.push('packing: ' + String(e.message || e));
  }

  // --- Evidencija potrosnje API kvote (po danu, samo cron/admin prolazi) ---
  status.units = MEM.apiUnits - unitsBefore;
  try {
    const day = new Date().toISOString().slice(0, 10);
    let usage = (await kvGetJSON(env, 'usage')) || {};
    if (usage.day !== day) usage = { day, runs: 0, units: 0, history: (usage.day ? [{ day: usage.day, runs: usage.runs, units: usage.units }].concat(usage.history || []).slice(0, 7) : []) };
    usage.runs++; usage.units += status.units;
    usage.lastRun = { at: status.at, ok: status.ok, units: status.units, actions: status.actions, errors: status.errors };
    await kvPutJSON(env, 'usage', usage);
    status.usage = { day: usage.day, runs: usage.runs, units: usage.units };
  } catch (e) { /* evidencija nije kriticna */ }

  status.backfill = { done: true, pages: bf.pages };
  status.total = index.videos.length;
  return status;
}

// ---------------------------------------------------------------------------
//  Podaci o jednom videu (stranica /v/ID)
// ---------------------------------------------------------------------------
async function addToIndexIfMissing(env, c, rec) {
  const index = await loadIndex(env, true);
  if (index.videos.some((v) => v.id === rec.id)) return;
  index.videos.push({ id: rec.id, t: rec.t, v: rec.v, p: rec.p });
  await trimIndex(env, c, index);
  await saveIndex(env, index);
}
// Da li video po datumu ulazi u prozor od MAX_VIDEOS najnovijih?
function insideWindow(c, index, publishedAt) {
  if (index.videos.length < c.maxVideos) return true;
  const oldest = index.videos[index.videos.length - 1];
  return !oldest || publishedAt >= oldest.p;
}

async function fetchAndStoreVideo(env, c, id, ctx) {
  const v = await fetchVideo(c, id);
  if (!v) return null;
  if (c.channelId && v.channelId && v.channelId !== c.channelId) return null; // samo videi sa tvog kanala
  if (!insideWindow(c, await loadIndex(env), v.p)) return null;             // stariji od MAX_VIDEOS najnovijih: ne belezi
  const conv = convertDescription(v.d, c);
  const rec = { id, t: v.t, d: conv.html, w: conv.wo, v: v.v, p: v.p, at: Date.now() };
  remember(id, rec);
  const work = Promise.all([
    kvPutJSON(env, 'v:' + id, rec).catch(() => {}),
    addToIndexIfMissing(env, c, rec).catch(() => {}),
  ]);
  if (ctx) ctx.waitUntil(work); else await work;
  return rec;
}

async function getVideo(env, c, id, ctx, allowLookup) {
  const now = Date.now();
  // 1) memorija
  const m = MEM.videos.get(id);
  if (m && now - m.at < MEM_VIDEO_TTL) return { rec: m.rec, error: null };
  // 2) stariji video iz chunk-a (bez API poziva, bez KV upisa, posle zagrevanja i bez KV citanja)
  const index = await loadIndex(env);
  const entry = index.videos.find((v) => v.id === id);
  let rec = null;
  if (entry && typeof entry.c === 'number') {
    const chunk = await getChunk(env, entry.c);
    const d = chunk[id];
    if (d) {
      rec = { id, t: entry.t, d: d.d || '', w: d.w || null, v: entry.v, p: entry.p, at: now };
      remember(id, rec);
      return { rec, error: null };
    }
  }
  // 3) pojedinacni zapis (novi videi)
  rec = await kvGetJSON(env, 'v:' + id);
  if (rec) {
    if (now - (rec.at || 0) > VIDEO_TTL) ctx.waitUntil(fetchAndStoreVideo(env, c, id, null).catch(() => {}));
    if (entry && typeof entry.v === 'number') rec.v = entry.v; // pregledi iz indeksa su svezi
    remember(id, rec);
    return { rec, error: null };
  }
  // 4) nepoznat (tek objavljen) video: povuci sa YouTube-a i sacuvaj.
  //    Samo ako je poseta dosla sa linka iz opisa (?wo=) ili sa YouTube-a — botovi koji lupaju nasumicne ID-jeve ne trose API.
  const nf = MEM.notFound.get(id);
  if (nf && now - nf < MEM_NOTFOUND_TTL) return { rec: null, error: 'not found' };
  if (!allowLookup) return { rec: null, error: 'not found' };
  try {
    const fresh = await fetchAndStoreVideo(env, c, id, ctx);
    if (!fresh) { if (MEM.notFound.size > 5000) MEM.notFound.clear(); MEM.notFound.set(id, now); }
    return { rec: fresh, error: fresh ? null : 'not found' };
  } catch (e) {
    return { rec: null, error: String(e.message || e) };
  }
}

// ---------------------------------------------------------------------------
//  CSS
// ---------------------------------------------------------------------------
const CSS = `
:root{--accent:${T.accent};--accent-2:${T.accent2};--grad:linear-gradient(135deg,${T.g1} 0%,${T.g2} 55%,${T.g3} 100%);--on-accent:${T.onAccent};--bg:${T.bg};--bg-2:${T.bg2};--surface:${T.surface};--surface-2:${T.surface2};--border:${T.border};--border-hot:rgba(${T.rgb},.55);--text:${T.text};--text-dim:${T.textDim};--text-faint:${T.textFaint};--link:${T.link};--radius:16px;--radius-sm:10px;--maxw:1180px}
*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
html{height:100%}
body{margin:0;padding:0;min-height:100vh;overflow-x:hidden;color:var(--text);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
  background:radial-gradient(1000px 520px at 84% -10%,rgba(${T.rgb},.32),transparent 70%),radial-gradient(760px 440px at 6% -4%,rgba(${T.rgb2},.24),transparent 70%),radial-gradient(700px 420px at 55% 112%,rgba(${T.rgb},.14),transparent 70%),var(--bg);background-attachment:fixed}
a{color:inherit;text-decoration:none}
.container{min-height:100vh;width:100%;display:flex;flex-direction:column}
.page{margin:0 auto;max-width:var(--maxw);padding:0 22px 60px;width:100%;flex:1;animation:pageIn .38s cubic-bezier(.2,.7,.2,1) backwards;transition:opacity .18s ease,transform .18s ease}
body.page-leave .page{opacity:0;transform:translateY(-8px)}
@keyframes pageIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.site-header{background:var(--bg-2);border-bottom:1px solid var(--border);position:sticky;top:0;width:100%;z-index:1000}
.nav-inner{display:flex;align-items:center;gap:18px;height:68px;margin:0 auto;max-width:var(--maxw);padding:0 22px}
.brand{display:flex;align-items:center;gap:12px;min-width:0;color:var(--text)}
.brand-logo{flex:none;width:44px;height:44px;border-radius:13px;background:var(--surface) center/cover no-repeat;box-shadow:0 0 0 1px rgba(255,255,255,.06),0 8px 22px -10px var(--accent)}
.brand-meta{min-width:0}
.brand-title{font-size:17px;font-weight:700;letter-spacing:-.2px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.brand-subs{display:flex;align-items:center;gap:6px;color:var(--text-dim);font-size:12.5px}
.live-dot{flex:none;width:7px;height:7px;border-radius:50%;background:#ff4d4f;box-shadow:0 0 0 3px rgba(255,77,79,.18)}
.desktop-search{flex:1 1;margin-left:auto;max-width:420px}
.mobile-search{display:none;margin:0 auto;max-width:var(--maxw);padding:10px 16px 14px}
.top-menu{display:flex;align-items:center;gap:4px}
.top-menu a{border-radius:9px;color:var(--text-dim);font-size:14px;font-weight:500;padding:8px 12px;white-space:nowrap;transition:color .16s ease,background .16s ease}
.top-menu a:hover{background:var(--surface);color:var(--text)}
.top-menu .subscribe,.top-menu .subscribe:hover{margin-left:4px;background:var(--grad);color:var(--on-accent);font-weight:700}
.top-menu .subscribe:hover{box-shadow:0 8px 20px -10px var(--accent);filter:brightness(1.06)}
.search-form{position:relative;width:100%}
.search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:16px;height:16px;stroke:var(--text-faint);pointer-events:none}
.search-input{width:100%;height:40px;padding:0 16px 0 40px;border-radius:999px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:14px;outline:none;transition:border-color .2s ease,box-shadow .2s ease}
.search-input::placeholder{color:var(--text-faint)}
.search-input:hover{border-color:${T.hover}}
.search-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(${T.rgb},.25)}
.menu-icon{display:none;flex:none;width:22px;height:22px;cursor:pointer;margin-right:2px;fill:var(--text-dim)}
.menu-icon:hover{fill:var(--accent)}
.sidebar{position:fixed;top:0;bottom:0;left:0;width:250px;padding:74px 14px 24px;background:var(--bg-2);border-right:1px solid var(--border);transform:translateX(-105%);transition:transform .35s ease;z-index:2000}
.sidebar.open{transform:translateX(0);box-shadow:0 0 60px rgba(0,0,0,.6)}
.sidebar a{display:block;margin:2px 0;padding:12px 14px;border-radius:10px;color:var(--text);font-size:15px;font-weight:500;transition:background .16s ease,color .16s ease}
.sidebar a:hover{background:var(--surface);color:var(--link)}
@media (max-width:760px){.nav-inner{gap:10px;height:60px}.desktop-search,.top-menu{display:none}.mobile-search,.menu-icon{display:block}}
@media (min-width:761px){.sidebar{display:none}}
.hero{padding:30px 2px 4px}
.hero h1{margin:0;font-size:26px;font-weight:800;letter-spacing:-.5px;color:var(--text)}
.hero h1 .grad{background:linear-gradient(90deg,${T.g1},${T.g2} 60%,${T.g3});-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}
.hero p{margin:8px 0 0;color:var(--text-dim);font-size:14.5px}
.video-grid{display:grid;gap:20px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));margin-top:24px}
.video-grid .vcard{animation:pageIn .45s cubic-bezier(.2,.7,.2,1) backwards;animation-delay:calc(var(--i,0)*35ms)}
.video-grid.js .vcard{animation:none}
.loader-lazy-load{grid-column:1/-1;height:80px;width:100%;display:flex;align-items:center;justify-content:center;color:var(--text-faint);font-size:13px}
.empty{grid-column:1/-1;padding:40px 0;text-align:center;color:var(--text-dim)}
.vcard{display:flex;flex-direction:column;overflow:hidden;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease}
.vcard:hover{transform:translateY(-5px);border-color:var(--border-hot);box-shadow:0 18px 40px -22px var(--accent)}
.vcard .thumb{position:relative;display:block;aspect-ratio:16/9;overflow:hidden;background:var(--bg-2)}
.vcard .thumb-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .35s ease}
.vcard:hover .thumb-img{transform:scale(1.05)}
.vcard .thumb-glow{position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(0,0,0,.55))}
.badge-new{position:absolute;top:8px;left:8px;z-index:3;padding:4px 8px;border-radius:7px;background:var(--grad);color:var(--on-accent);font-size:10.5px;font-weight:800;letter-spacing:.4px;text-transform:uppercase}
.vcard .play{position:absolute;top:50%;left:50%;z-index:2;display:grid;place-items:center;width:54px;height:54px;border-radius:50%;border:1.5px solid rgba(255,255,255,.85);background:rgba(13,14,18,.55);backdrop-filter:blur(2px);transform:translate(-50%,-50%);transition:.22s ease}
.vcard .play svg{width:20px;height:20px;margin-left:3px;fill:#fff;transition:fill .22s ease}
.vcard:hover .play{background:var(--accent-2);border-color:var(--accent);transform:translate(-50%,-50%) scale(1.08)}
.vcard:hover .play svg{fill:var(--on-accent)}
.vbody{display:flex;flex:1 1;flex-direction:column;padding:13px 14px 15px}
.vtitle{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:38px;color:var(--text);font-size:14.5px;font-weight:600;letter-spacing:-.1px;line-height:1.32}
.vmeta{display:flex;align-items:center;gap:8px;margin-top:9px;color:var(--text-faint);font-size:12.5px}
.vmeta .dot{width:3px;height:3px;border-radius:50%;background:var(--text-faint)}
.cta{display:flex;align-items:center;justify-content:center;gap:8px;height:42px;margin-top:13px;border-radius:11px;background:var(--grad);color:var(--on-accent);font-size:14px;font-weight:700;letter-spacing:.2px;transition:filter .18s ease,box-shadow .18s ease,transform .18s ease}
.cta svg{width:16px;height:16px;fill:var(--on-accent)}
.cta:hover{filter:brightness(1.06);box-shadow:0 10px 24px -10px var(--accent);transform:translateY(-1px)}
@media (max-width:600px){.video-grid{gap:14px;grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}.hero h1{font-size:22px}}
.single-video{padding-top:26px}
.back-link{display:inline-flex;align-items:center;gap:6px;margin-bottom:18px;color:var(--text-dim);font-size:13.5px;font-weight:500;transition:color .18s ease}
.back-link svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.back-link:hover{color:var(--text)}
.single-grid{display:flex;flex-direction:column;gap:20px;margin:0 auto;max-width:900px}
.player{aspect-ratio:16/9;background:#000;overflow:hidden;border:1px solid var(--border);border-radius:var(--radius);animation:pageIn .5s cubic-bezier(.2,.7,.2,1) backwards}
.player iframe{display:block;width:100%;height:100%;border:0}
.single-side{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px 20px 24px;animation:pageIn .5s cubic-bezier(.2,.7,.2,1) .08s backwards}
.single-title{margin:0;color:var(--text);font-size:19px;font-weight:700;letter-spacing:-.2px;line-height:1.3}
.single-meta{margin:12px 0 4px;color:var(--text-faint);font-size:13px;font-weight:600;letter-spacing:.5px;text-transform:uppercase}
.get-script{height:58px;font-size:17px;margin:30px auto 6px;max-width:440px;width:100%;border-radius:13px;box-shadow:0 12px 34px -14px var(--accent-2)}
.get-script svg{width:20px;height:20px}
.get-script:hover{transform:translateY(-2px) scale(1.01)}
.video-description{margin-top:16px;padding-top:16px;border-top:1px solid var(--border);color:var(--text-dim);font-size:13.5px;line-height:1.75;overflow-wrap:anywhere}
.video-description a{color:var(--link);font-weight:600}
.video-description a:hover{text-decoration:underline}
.notice{margin-top:16px;padding:12px 14px;border-radius:10px;background:var(--surface-2);border:1px solid var(--border);color:var(--text-dim);font-size:13px;line-height:1.5}
@media (max-width:600px){.single-side{padding:16px}}
.info-wrapper{min-height:calc(100vh - 300px);padding-top:30px;width:100%}
.greetings-wrapper{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:40px}
.greetings-logo{width:90px;height:90px;flex:none;border-radius:14px;background:var(--surface) center/cover no-repeat;box-shadow:0 0 0 1px var(--border),0 12px 30px -14px var(--accent)}
.greetings-text{color:var(--text);font-size:18px;font-weight:500;line-height:1.5}
.contacts-block{display:flex;flex-direction:column;align-items:center;min-height:calc(100vh - 200px);padding-top:40px;width:100%}
.contact-us-form{margin-bottom:18px;color:var(--text);font-size:20px;font-weight:700}
.contact-wrapper{width:100%;max-width:560px;padding:24px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-dim);font-size:14.5px;line-height:1.7}
.contact-wrapper .cta{max-width:320px;margin:14px auto 0}
.contact-wrapper a.plain{color:var(--link);font-weight:600}
.site-footer{margin-top:auto;padding:24px 22px;border-top:1px solid var(--border);color:var(--text-faint);font-size:12.5px;text-align:center}
.site-footer a{color:var(--text-dim)}
.notfound{padding:80px 0;text-align:center}
.notfound h1{font-size:44px;margin:0 0 8px}
.notfound p{color:var(--text-dim);margin:0 0 20px}
.notfound .cta{display:inline-flex;padding:0 22px}
.admin{max-width:720px;margin:40px auto;padding:24px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);font-size:14px;line-height:1.7}
.admin code,.admin pre{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;color:${T.code}}
.admin pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--bg-2);padding:12px;border-radius:10px}
.ok{color:#5fd38d}.bad{color:#ff6b6b}
/* --- reklame --- */
.ad{display:flex;justify-content:center;align-items:center;margin:0 auto;overflow:hidden;max-width:100%}
.ad:empty{display:none}
.ad iframe{display:block;border:0;max-width:100%}
.ad-top{margin:20px auto 0;width:100%}
.single-grid .ad-top{margin:0}
.ad-native{margin:22px auto 0;max-width:900px;width:100%;display:block}
.ad-side{position:fixed;top:88px;width:160px;height:600px;display:none;z-index:5}
@media (min-width:1540px){.ad-side{display:flex}.ad-left{left:calc(50% - 590px - 176px)}.ad-right{right:calc(50% - 590px - 176px)}}
/* --- Get script prozor (task gate) --- */
.gate{position:fixed;inset:0;z-index:5000;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(5,6,10,.74);backdrop-filter:blur(4px)}
.gate.open{display:flex}
body.gate-open{overflow:hidden}
.gate-box{position:relative;width:100%;max-width:400px;max-height:calc(100vh - 28px);overflow:auto;padding:22px 20px 20px;background:var(--surface);border:1px solid var(--border);border-radius:18px;box-shadow:0 30px 80px -30px rgba(${T.rgb2},.45);animation:pageIn .3s cubic-bezier(.2,.7,.2,1) backwards;display:flex;flex-direction:column;gap:14px;text-align:center}
.gate-close{position:absolute;top:8px;right:10px;width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:var(--text-faint);font-size:22px;line-height:1;cursor:pointer}
.gate-close:hover{background:var(--surface-2);color:var(--text)}
.gate-title{font-size:21px;font-weight:900;letter-spacing:2px;background:linear-gradient(90deg,${T.g1},${T.g2} 60%,${T.g3});-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}
.ad-gate{min-height:250px;width:100%}
.gate-text{color:var(--text-dim);font-size:14px}
.gate .cta{margin:0;position:relative;height:46px;width:100%;max-width:none}
.gate-task .spinner{display:none;position:absolute;right:14px;top:50%;width:18px;height:18px;margin-top:-9px;border:2.5px solid rgba(128,128,128,.35);border-top-color:${T.onAccent};border-radius:50%;animation:spin .8s linear infinite}
.gate-task .spinner.on{display:block}
.gate-task.done{filter:saturate(.6)}
@keyframes spin{to{transform:rotate(360deg)}}
.gate-progress{font-size:12.5px;color:var(--text-faint);letter-spacing:.6px;text-transform:uppercase;font-weight:700}
.gate-progress b{color:var(--text)}
.gate-unlock{background:#262b36;color:#7d8798;box-shadow:none;cursor:not-allowed;transition:background .45s ease,color .45s ease,transform .18s ease,box-shadow .3s ease}
.gate-unlock svg{fill:#7d8798}
.gate-unlock:hover{filter:none;box-shadow:none;transform:none}
.gate-unlock.ready{background:var(--grad);color:var(--on-accent);cursor:pointer;box-shadow:0 10px 30px -14px var(--accent-2)}
.gate-unlock.ready svg{fill:var(--on-accent)}
.gate-unlock.ready:hover{transform:translateY(-2px);filter:brightness(1.06)}
.gate-unlock.shake{animation:shake .4s}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
/* --- AdBlock zid --- */
.abwall{position:fixed;inset:0;z-index:6000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(5,6,10,.9);backdrop-filter:blur(8px)}
.abwall.open{display:flex}
body.abwall-open{overflow:hidden}
.abwall-box{width:100%;max-width:440px;padding:26px 24px 22px;background:var(--surface);border:1px solid var(--border-hot);border-radius:18px;box-shadow:0 30px 90px -30px rgba(${T.rgb2},.6);text-align:center;display:flex;flex-direction:column;gap:12px;animation:pageIn .35s cubic-bezier(.2,.7,.2,1) backwards}
.abwall-icon{width:64px;height:64px;margin:0 auto;border-radius:18px;display:grid;place-items:center;background:var(--grad);box-shadow:0 12px 30px -12px var(--accent-2)}
.abwall-icon svg{width:34px;height:34px;fill:var(--on-accent)}
.abwall-text{color:var(--text-dim);font-size:14.5px;line-height:1.6}
.abwall-text b{color:var(--text)}
.abwall-steps{margin:0;padding:0;list-style:none;text-align:left;display:flex;flex-direction:column;gap:6px;background:var(--bg-2);border:1px solid var(--border);border-radius:12px;padding:12px 14px;font-size:13.5px;color:var(--text-dim)}
.abwall-steps li{display:flex;gap:10px;align-items:flex-start}
.abwall-steps .n{flex:none;width:20px;height:20px;border-radius:50%;background:var(--grad);color:var(--on-accent);font-size:11px;font-weight:800;display:grid;place-items:center;margin-top:1px}
.abwall .cta{margin:4px 0 0;height:48px;max-width:none;width:100%}
.abwall-note{font-size:12px;color:var(--text-faint)}
@media (prefers-reduced-motion:reduce){.page,.video-grid .vcard,.player,.single-side,.gate-box,.abwall-box{animation:none}.page,.vcard,.cta,.thumb-img,.play{transition:none}}
`;

// ---------------------------------------------------------------------------
//  Klijentski JS (pretraga, ucitavanje na skrol, mobilni meni)
// ---------------------------------------------------------------------------
const JS = `
(function(){
  var S = window.__SITE || {}; var PAGE = S.pageSize || 30; var CTA = S.cta || 'Get script';
  var grid = document.getElementById('grid'); var loader = document.getElementById('loader');
  var inputs = [].slice.call(document.querySelectorAll('.search-input'));
  var q = (S.q || ''), offset = PAGE, total = null, busy = false, searchTimer = null, reqId = 0;
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function compact(n){ n = Number(n)||0; if(n<1000) return String(n); if(n<10000) return (n/1000).toFixed(1).replace(/\\.0$/,'')+'K'; if(n<1000000) return Math.round(n/1000)+'K'; if(n<10000000) return (n/1000000).toFixed(1).replace(/\\.0$/,'')+'M'; return Math.round(n/1000000)+'M'; }
  function ago(iso){ var t = Date.parse(iso||''); if(!t) return ''; var s = Math.max(0, Math.floor((Date.now()-t)/1000)); if(s<60) return 'just now'; var m=Math.floor(s/60); if(m<60) return m+(m===1?' minute':' minutes'); var h=Math.floor(m/60); if(h<24) return h+(h===1?' hour':' hours'); var d=Math.floor(h/24); if(d<30) return d+(d===1?' day':' days'); var mo=Math.floor(d/30); if(mo<12) return mo+(mo===1?' month':' months'); var y=Math.floor(d/365); return y+(y===1?' year':' years'); }
  function isNew(iso){ var t = Date.parse(iso||''); return !!t && (Date.now()-t) < 86400000; }
  function card(v){
    var u = '/v/' + v.id; var a = ago(v.p);
    return '<article class="vcard"><a class="thumb" href="'+u+'"><img class="thumb-img" loading="lazy" alt="" src="https://i.ytimg.com/vi/'+v.id+'/hqdefault.jpg"><div class="thumb-glow"></div>'+(isNew(v.p)?'<span class="badge-new">New</span>':'')+'<span class="play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg></span></a><div class="vbody"><a class="vtitle" href="'+u+'">'+esc(v.t)+'</a><div class="vmeta"><span>'+compact(v.v)+' Views</span>'+(a?'<span class="dot"></span><span>'+a+'</span>':'')+'</div><a class="cta" href="'+u+'"><svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"></path></svg>'+esc(CTA)+'</a></div></article>';
  }
  // Lista se dovlaci sa servera u stranicama od PAGE (pretraga i skrol) — bez preuzimanja cele liste
  function fetchPage(off, qq, cb){
    var my = ++reqId; busy = true;
    fetch('/api/videos?offset=' + off + '&limit=' + PAGE + '&q=' + encodeURIComponent(qq)).then(function(r){ return r.json(); }).then(function(d){ busy = false; if(my !== reqId) return; cb(d); }).catch(function(){ busy = false; });
  }
  function setLoader(){ if(loader) loader.style.display = (total === null || offset < total) ? 'flex' : 'none'; }
  function more(){
    if(!grid || busy) return; if(total !== null && offset >= total){ setLoader(); return; }
    fetchPage(offset, q, function(d){
      total = d.total; var vids = d.videos || [];
      if(offset === 0){ grid.classList.add('js'); grid.innerHTML = vids.length ? vids.map(card).join('') : '<div class="empty">No videos found.</div>'; }
      else if(vids.length){ grid.classList.add('js'); grid.insertAdjacentHTML('beforeend', vids.map(card).join('')); }
      offset += vids.length; setLoader();
    });
  }
  function search(val){
    q = val; offset = 0; total = null;
    fetchPage(0, q, function(d){
      total = d.total; var vids = d.videos || [];
      grid.classList.add('js'); grid.innerHTML = vids.length ? vids.map(card).join('') : '<div class="empty">No videos found.</div>';
      offset = vids.length; setLoader();
    });
  }
  inputs.forEach(function(inp){
    if(grid){
      inp.addEventListener('input', function(){ var v = inp.value.trim(); inputs.forEach(function(o){ if(o!==inp) o.value = inp.value; }); clearTimeout(searchTimer); searchTimer = setTimeout(function(){ if(v !== q) search(v); }, 250); });
      if(inp.form) inp.form.addEventListener('submit', function(e){ e.preventDefault(); clearTimeout(searchTimer); var v = inp.value.trim(); if(v !== q) search(v); });
    }
  });
  if(grid && loader && 'IntersectionObserver' in window){
    new IntersectionObserver(function(entries){ if(entries.some(function(e){ return e.isIntersecting; })) more(); }, { rootMargin: '500px' }).observe(loader);
  }  // Blagi prelaz izmedju stranica: sadrzaj se izbledi pre odlaska na sledecu stranicu
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('click', function(e){
    if(reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null; if(!a) return;
    if(a.target && a.target !== '_self') return;
    var href = a.getAttribute('href') || ''; if(!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0) return;
    var u; try { u = new URL(a.href, location.href); } catch(err){ return; }
    if(u.origin !== location.origin) return;
    if(u.pathname === location.pathname && u.search === location.search) return;
    e.preventDefault();
    document.body.classList.add('page-leave');
    setTimeout(function(){ location.href = u.href; }, 170);
  });
  window.addEventListener('pageshow', function(){ document.body.classList.remove('page-leave'); });
  // ---------------- Reklame ----------------
  var A = S.ads || {}; var adsOn = !!A.enabled;
  function openAd(){ if(!adsOn || !A.smartlink) return; try { window.open(A.smartlink, '_blank', 'noopener'); } catch(err) {} }
  function pickSize(kind, el){
    var w = (el && el.parentNode && el.parentNode.clientWidth) || window.innerWidth;
    if(kind === 'top'){ if(w >= 740) return '728x90'; if(w >= 480) return '468x60'; return '320x50'; }
    if(kind === 'side') return '160x600';
    if(kind === 'gate') return w >= 300 ? '300x250' : '160x300';
    return '300x250';
  }
  function mountAd(el){
    if(!adsOn || !el || el.getAttribute('data-mounted')) return;
    var kind = el.getAttribute('data-ad'); var size = pickSize(kind, el);
    if(!A.banners || !A.banners[size]) return;
    var wh = size.split('x'); el.setAttribute('data-mounted', '1');
    el.innerHTML = '<iframe src="/ad/' + size + '?v=' + (A.rev || '0') + '.' + String(A.banners[size]).slice(0, 8) + '" width="' + wh[0] + '" height="' + wh[1] + '" scrolling="no" title="Advertisement"' + (kind === 'gate' ? '' : ' loading="lazy"') + '></iframe>';
  }
  if(adsOn){
    [].forEach.call(document.querySelectorAll('.ad-top'), mountAd);
    if(window.innerWidth >= 1540) [].forEach.call(document.querySelectorAll('.ad-side'), mountAd);
    // "Get script" na karticama pocetne: otvori reklamu pa nastavi na stranicu videa
    document.addEventListener('click', function(e){
      var b = e.target && e.target.closest ? e.target.closest('.vcard .cta') : null;
      if(b && e.button === 0 && !e.metaKey && !e.ctrlKey) openAd();
    }, true);
  }
  // ---------------- Get script prozor (zadatak + otkljucavanje) ----------------
  var gate = document.getElementById('gate'); var gs = document.querySelector('.get-script[data-gate]');
  if(gate && gs){
    var target = gs.getAttribute('href'); var need = Number(S.gateTasks) || 1; var secs = Number(S.gateSeconds) || 20;
    var running = false, done = 0;
    var taskBtn = document.getElementById('gateTask'), taskLabel = document.getElementById('gateTaskLabel'), spin = document.getElementById('gateSpin');
    var prog = document.getElementById('gateProg'), unlock = document.getElementById('gateUnlock'), closeBtn = document.getElementById('gateClose');
    function openGate(){ gate.classList.add('open'); document.body.classList.add('gate-open'); mountAd(gate.querySelector('[data-ad]')); }
    function closeGate(){ gate.classList.remove('open'); document.body.classList.remove('gate-open'); }
    gs.addEventListener('click', function(e){ e.preventDefault(); openAd(); openGate(); });
    taskBtn.addEventListener('click', function(){
      openAd();
      if(running || done >= need) return;
      running = true; spin.classList.add('on'); taskLabel.textContent = 'Completing task…';
      setTimeout(function(){
        running = false; done++; spin.classList.remove('on'); prog.textContent = done + '/' + need;
        if(done >= need){ taskBtn.classList.add('done'); taskLabel.textContent = 'Task completed'; unlock.classList.add('ready'); unlock.setAttribute('aria-disabled', 'false'); }
        else { taskLabel.textContent = 'Complete task ' + (done + 1) + '/' + need; }
      }, secs * 1000);
    });
    unlock.addEventListener('click', function(){
      if(done < need){ unlock.classList.remove('shake'); void unlock.offsetWidth; unlock.classList.add('shake'); return; }
      openAd();
      setTimeout(function(){ location.href = target; }, 120);
    });
    closeBtn.addEventListener('click', closeGate);
    gate.addEventListener('click', function(e){ if(e.target === gate) closeGate(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeGate(); });
  }
  // ---------------- AdBlock detekcija + zid ----------------
  var wall = document.getElementById('abwall');
  if(wall && S.abwall){
    var wallShown = false;
    function showWall(){ if(wallShown) return; wallShown = true; wall.classList.add('open'); document.body.classList.add('abwall-open'); }
    var rb = document.getElementById('abwallReload'); if(rb) rb.addEventListener('click', function(){ location.reload(); });
    // 1) mamac: element sa klasama koje blokatori sakrivaju (kozmeticki filteri)
    function baitHidden(){
      try {
        var b = document.createElement('div');
        b.className = 'adsbox ad-banner ad_banner adsbygoogle pub_300x250 pub_300x250m pub_728x90 text-ad text-ads textAd text_ad text_ads sponsored-ad ad-zone ad-space ad-placement banner-ad adBanner';
        b.id = 'ad_banner'; b.innerHTML = '&nbsp;';
        b.style.cssText = 'position:absolute !important;top:-1px !important;left:-1px !important;width:1px !important;height:1px !important;pointer-events:none !important;';
        document.body.appendChild(b);
        return new Promise(function(res){ setTimeout(function(){
          var cs = window.getComputedStyle(b);
          var hidden = !b.offsetParent && cs.position !== 'fixed' || b.offsetHeight === 0 || cs.display === 'none' || cs.visibility === 'hidden' || b.clientHeight === 0;
          try { document.body.removeChild(b); } catch(err) {}
          res(!!hidden);
        }, 500); });
      } catch(err) { return Promise.resolve(false); }
    }
    // 2) mrezni test: da li blokator blokira poznate reklamne domene (oba moraju da padnu)
    function probe(url){
      return new Promise(function(res){
        var t = setTimeout(function(){ res(false); }, 4000);
        try {
          fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store', credentials: 'omit' }).then(function(){ clearTimeout(t); res(false); }, function(){ clearTimeout(t); res(true); });
        } catch(err) { clearTimeout(t); res(true); }
      });
    }
    function netBlocked(){
      var urls = ['https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', 'https://static.doubleclick.net/instream/ad_status.js'];
      return Promise.all(urls.map(probe)).then(function(r){ return r[0] && r[1]; });
    }
    function detect(){ Promise.all([baitHidden(), netBlocked()]).then(function(r){ if(r[0] || r[1]) showWall(); }).catch(function(){}); }
    if(document.readyState === 'complete') setTimeout(detect, 700); else window.addEventListener('load', function(){ setTimeout(detect, 700); });
  }
  var mi = document.querySelector('.menu-icon'), sb = document.querySelector('.sidebar');
  if(mi && sb){ mi.addEventListener('click', function(e){ e.stopPropagation(); sb.classList.toggle('open'); }); document.addEventListener('click', function(e){ if(!sb.contains(e.target)) sb.classList.remove('open'); }); }
})();
`;


// ---------------------------------------------------------------------------
//  HTML
// ---------------------------------------------------------------------------
const ICON_PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>';
const ICON_DL = '<svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"></path></svg>';
const ICON_SEARCH = '<svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3-3"></path></svg>';
const ICON_MENU = '<svg class="menu-icon" viewBox="0 0 24 24" aria-label="Menu"><path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"></path></svg>';

function adSlot(kind) {
  return '<div class="ad ad-' + kind + '" data-ad="' + kind + '"></div>';
}
function nativeAd(c) {
  if (!c.adsEnabled || !ADS.nativeScript) return '';
  return '<div class="ad ad-native"><script async="async" data-cfasync="false" src="' + ADS.nativeScript + '"></script><div id="container-' + ADS.nativeId + '"></div></div>';
}
function adScripts(c) {
  if (!c.adsEnabled) return '';
  return (ADS.popunder ? '<script data-cfasync="false" src="' + ADS.popunder + '"></script>' : '') + (ADS.socialBar ? '<script data-cfasync="false" src="' + ADS.socialBar + '"></script>' : '');
}
function abwallMarkup(c) {
  return '<div class="abwall" id="abwall" role="dialog" aria-modal="true" aria-labelledby="abwallTitle"><div class="abwall-box">' +
    '<div class="abwall-icon"><svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5.25 3.4 10.15 8 11.35C16.6 21.15 20 16.25 20 11V5l-8-3zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z"></path></svg></div>' +
    '<div class="gate-title" id="abwallTitle">AD BLOCKER DETECTED</div>' +
    '<div class="abwall-text">Ads keep our scripts <b>free</b>. Please turn off your ad blocker (AdBlock, uBlock, Brave Shields…) for <b>' + esc(c.host || 'this site') + '</b> and reload the page.</div>' +
    '<ol class="abwall-steps"><li><span class="n">1</span>Click the ad-blocker icon next to the address bar.</li><li><span class="n">2</span>Turn it off for this website (or add it to the allowlist).</li><li><span class="n">3</span>Press the button below to reload.</li></ol>' +
    '<button class="cta" id="abwallReload" type="button">I turned it off — Reload page</button>' +
    '<div class="abwall-note">Still seeing this? Try another browser or a private/incognito window without extensions.</div>' +
    '</div></div>';
}

function gateMarkup(c) {
  return '<div class="gate" id="gate" role="dialog" aria-modal="true" aria-labelledby="gateTitle"><div class="gate-box">' +
    '<button class="gate-close" id="gateClose" type="button" aria-label="Close">&times;</button>' +
    '<div class="gate-title" id="gateTitle">GET SCRIPT</div>' +
    (c.adsEnabled ? adSlot('gate') : '') +
    '<div class="gate-text">Complete action and unlock script</div>' +
    '<button class="cta gate-task" id="gateTask" type="button"><span id="gateTaskLabel">Complete task</span><span class="spinner" id="gateSpin"></span></button>' +
    '<div class="gate-progress">Unlock progress: <b id="gateProg">0/' + c.gateTasks + '</b></div>' +
    '<button class="cta gate-unlock" id="gateUnlock" type="button" aria-disabled="true">' + ICON_DL + 'Unlock script</button>' +
    '</div></div>';
}

function searchForm(q) {
  return '<form class="search-form" action="/" method="get" role="search">' + ICON_SEARCH +
    '<input class="search-input" type="search" name="q" placeholder="Search scripts…" autocomplete="off" value="' + esc(q || '') + '"></form>';
}

function layout(c, site, opts) {
  const name = site.name;
  const logo = site.logo;
  const q = opts.q || '';
  const title = opts.title ? opts.title + ' - ' + name : name;
  const desc = opts.description || (name + ' - scripts, GUIs and auto-farms for Roblox games. New scripts every day.');
  const image = opts.image || logo;
  const subLink = site.channelId ? 'https://www.youtube.com/channel/' + esc(site.channelId) + '?sub_confirmation=1' : 'https://www.youtube.com/';
  const menuLinks = '<a href="/">Scripts</a><a href="/info">Info</a><a href="/contact">Contact</a>';
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(title) + '</title>' +
    '<meta name="description" content="' + esc(desc) + '">' +
    (opts.canonical ? '<link rel="canonical" href="' + esc(opts.canonical) + '">' : '') +
    (logo ? '<link rel="icon" href="' + esc(logo) + '">' : '') +
    '<meta property="og:site_name" content="' + esc(name) + '"><meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '">' +
    (image ? '<meta property="og:image" content="' + esc(image) + '"><meta name="twitter:card" content="summary_large_image">' : '') +
    '<meta property="og:type" content="' + (opts.type || 'website') + '">' +
    (opts.noindex ? '<meta name="robots" content="noindex">' : '') +
    '<style>' + CSS + '</style>' +
    '</head><body><div class="container">' +
    '<header class="site-header"><nav class="navigation"><div class="nav-inner">' + ICON_MENU +
    '<div class="sidebar">' + menuLinks + '<a href="' + subLink + '" target="_blank" rel="noreferrer">Subscribe</a></div>' +
    '<a class="brand" href="/"><div class="brand-logo"' + (logo ? ' style="background-image:url(&quot;' + esc(logo) + '&quot;)"' : '') + '></div>' +
    '<div class="brand-meta"><div class="brand-title">' + esc(name) + '</div>' +
    (site.subs ? '<div class="brand-subs"><span class="live-dot"></span>' + esc(site.subs) + '</div>' : '') +
    '</div></a>' +
    '<div class="desktop-search">' + searchForm(q) + '</div>' +
    '<div class="top-menu">' + menuLinks + '<a class="subscribe" href="' + subLink + '" target="_blank" rel="noreferrer">Subscribe</a></div>' +
    '</div></nav><div class="mobile-search">' + searchForm(q) + '</div></header>' +
    '<main class="page">' + opts.body + '</main>' +
    '<footer class="site-footer">&copy; ' + new Date().getFullYear() + ' ' + esc(name) + ' &middot; <a href="/info">Info</a> &middot; <a href="/contact">Contact</a></footer>' +
    '</div>' +
    (c.adsEnabled ? '<div class="ad ad-side ad-left" data-ad="side"></div><div class="ad ad-side ad-right" data-ad="side"></div>' : '') +
    (c.adblockWall ? abwallMarkup(c) : '') +
    (opts.extra || '') +
    '<script>window.__SITE=' + JSON.stringify(siteConfig(c, q)).replace(/</g, '\\u003c') + ';' + JS + '</script>' +
    adScripts(c) +
    '</body></html>';
}

function siteConfig(c, q) {
  return {
    pageSize: c.pageSize, cta: c.ctaText, q,
    gateSeconds: c.gateSeconds, gateTasks: c.gateTasks, abwall: c.adblockWall,
    ads: c.adsEnabled ? { enabled: true, smartlink: ADS.smartlink, banners: ADS.banners, bannerHost: ADS.bannerHost, rev: ADS_REV } : { enabled: false, banners: ADS.banners, bannerHost: ADS.bannerHost },
  };
}

function renderCard(v, c, now, i) {
  const u = '/v/' + v.id;
  const a = timeAgo(v.p, now);
  const st = typeof i === 'number' ? ' style="--i:' + Math.min(i, 11) + '"' : '';
  return '<article class="vcard"' + st + '><a class="thumb" href="' + u + '"><img class="thumb-img" loading="lazy" alt="" src="' + thumbUrl(v.id) + '"><div class="thumb-glow"></div>' +
    (isNew(v.p, now) ? '<span class="badge-new">New</span>' : '') +
    '<span class="play">' + ICON_PLAY + '</span></a>' +
    '<div class="vbody"><a class="vtitle" href="' + u + '">' + esc(v.t) + '</a>' +
    '<div class="vmeta"><span>' + esc(formatViews(v.v)) + '</span>' + (a ? '<span class="dot"></span><span>' + esc(a) + '</span>' : '') + '</div>' +
    '<a class="cta" href="' + u + '">' + ICON_DL + esc(c.ctaText) + '</a></div></article>';
}

function siteInfo(c, channel) {
  return {
    name: c.siteName || (channel && channel.title) || 'Scripts',
    logo: c.logoUrl || (channel && channel.logo) || '',
    subs: (channel && channel.subs) || '',
    channelId: c.channelId || (channel && channel.id) || '',
  };
}

function filterVideos(videos, q) {
  const words = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return videos;
  return videos.filter((v) => { const t = (v.t || '').toLowerCase(); return words.every((w) => t.indexOf(w) > -1); });
}

// ---------------------------------------------------------------------------
//  Stranice
// ---------------------------------------------------------------------------
async function pageHome(env, c, url, ctx) {
  const [channel, index] = await Promise.all([getChannel(env, c).catch(() => null), loadIndex(env)]);
  const site = siteInfo(c, channel);
  const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const now = Date.now();
  const list = filterVideos(index.videos, q);
  const cards = list.slice(0, c.pageSize).map((v, i) => renderCard(v, c, now, i)).join('');
  let body = '<section class="hero"><h1>' + esc(c.heroTitle1) + ' <span class="grad">' + esc(c.heroTitle2) + '</span></h1><p>' + esc(c.heroSubtitle) + '</p></section>';
  if (c.adsEnabled) body += adSlot('top');
  body += '<section class="video-grid" id="grid">' + (cards || '<div class="empty">' + (index.videos.length ? 'No videos found.' : 'No videos yet — the list fills up automatically in a few minutes.') + '</div>') + '</section>';
  body += '<div class="loader-lazy-load" id="loader"' + (list.length > c.pageSize ? '' : ' style="display:none"') + '>Loading more…</div>';
  body += nativeAd(c);
  return html(layout(c, site, { body, q, canonical: url.origin + '/' }), 200);
}

async function pageVideo(env, c, url, id, ctx, request) {
  const woParam = url.searchParams.get('wo');
  const woFromUrl = resolveWo(woParam, c);
  const ref = (request && request.headers.get('referer')) || '';
  const allowLookup = !!woParam || /youtube\.com|youtu\.be|google\./i.test(ref);
  const [channel, result] = await Promise.all([getChannel(env, c).catch(() => null), getVideo(env, c, id, ctx, allowLookup)]);
  const site = siteInfo(c, channel);
  const rec = result.rec;
  const now = Date.now();
  const target = woFromUrl || (rec && rec.w) || null;
  const embed = 'https://www.youtube.com/embed/' + id;
  let title = rec ? rec.t : '';
  if (!rec && result.error !== 'not found') title = (await oembedTitle(id)) || 'Video';
  const back = '<a class="back-link" href="/"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"></path></svg>Back to videos</a>';
  const button = target ? '<a class="cta get-script" href="' + esc(target) + '" rel="noopener"' + (c.gateEnabled ? ' data-gate="1"' : '') + '>' + ICON_DL + esc(c.ctaText) + '</a>' : '';
  let side;
  if (rec) {
    const a = timeAgo(rec.p, now);
    side = '<h1 class="single-title">' + esc(rec.t) + '</h1>' +
      '<div class="single-meta">' + esc(formatViews(rec.v)) + (a ? ' &middot; ' + esc(a) : '') + '</div>' +
      button;
  } else if (result.error === 'not found') {
    return page404(c, site);
  } else {
    // API trenutno nije dostupan (los kljuc, kvota...). Link ka work.ink-u i plejer ipak rade.
    side = '<h1 class="single-title">' + esc(title) + '</h1>' + button +
      '<div class="notice">Video details are loading — refresh this page in a minute.</div>';
  }
  const body = '<div class="single-video">' + back + '<div class="single-grid">' +
    (c.adsEnabled ? adSlot('top') : '') +
    '<div class="player"><iframe src="' + esc(embed) + '" title="' + esc(title) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>' +
    '<aside class="single-side">' + side + '</aside>' + nativeAd(c) + '</div></div>';
  const extra = target && c.gateEnabled ? gateMarkup(c) : '';
  const res = html(layout(c, site, {
    body,
    title,
    description: rec ? (descriptionSummary(rec.d) || rec.t) : undefined,
    image: thumbUrl(id),
    canonical: url.origin + '/v/' + id,
    type: 'video.other',
    extra,
  }), 200, VIDEO_CACHE_SECONDS);
  if (!rec) res.headers.set('Cache-Control', 'no-store');
  return res;
}

async function pageInfo(env, c) {
  const channel = await getChannel(env, c).catch(() => null);
  const site = siteInfo(c, channel);
  const text = c.infoText ? esc(c.infoText).replace(/\n/g, '<br>') : 'Hey!<br> Welcome to the new ' + esc(site.name) + ' site.';
  const body = '<div class="info-wrapper"><div class="greetings-wrapper"><div class="greetings-logo"' + (site.logo ? ' style="background-image:url(&quot;' + esc(site.logo) + '&quot;)"' : '') + '></div><div class="greetings-text">' + text + '</div></div></div>';
  return html(layout(c, site, { body, title: 'Info' }), 200, STATIC_CACHE_SECONDS);
}

async function pageContact(env, c) {
  const channel = await getChannel(env, c).catch(() => null);
  const site = siteInfo(c, channel);
  let inner = '';
  if (c.discordUrl) inner += '<p>Have a problem with a script or a question? Join our Discord server and ask there.</p><a class="cta" href="' + esc(c.discordUrl) + '" target="_blank" rel="noopener noreferrer">Join Discord</a>';
  if (c.contactEmail) inner += '<p style="margin-top:18px">Email: <a class="plain" href="mailto:' + esc(c.contactEmail) + '">' + esc(c.contactEmail) + '</a></p>';
  if (!inner) inner = '<p>Contact us through the comments on our latest YouTube video.</p>';
  const body = '<div class="contacts-block"><p class="contact-us-form">Contact us:</p><div class="contact-wrapper">' + inner + '</div></div>';
  return html(layout(c, site, { body, title: 'Contact' }), 200, STATIC_CACHE_SECONDS);
}

function page404(c, site) {
  const body = '<div class="notfound"><h1>404</h1><p>This page or video does not exist.</p><a class="cta" href="/">' + ICON_PLAY + 'Back to videos</a></div>';
  const res = html(layout(c, site, { body, title: 'Not found', noindex: true }), 404);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

async function sitemap(env, url) {
  const index = await loadIndex(env);
  let xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  xml += '<url><loc>' + esc(url.origin) + '/</loc><changefreq>hourly</changefreq></url>';
  for (const v of index.videos) xml += '<url><loc>' + esc(url.origin) + '/v/' + v.id + '</loc><lastmod>' + esc(String(v.p).slice(0, 10)) + '</lastmod></url>';
  xml += '</urlset>';
  return new Response(xml, { status: 200, headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}

async function adminPage(env, c, url) {
  if (!c.adminKey) return text('ADMIN_KEY nije podesen u Settings -> Variables and Secrets.', 403);
  if (url.searchParams.get('key') !== c.adminKey) return text('Forbidden', 403);
  const path = url.pathname;
  if (path === '/admin/status') {
    const [channel, index, bf, cs, usage] = await Promise.all([kvGetJSON(env, 'channel'), loadIndex(env, true), kvGetJSON(env, 'backfill'), kvGetJSON(env, 'chunks'), kvGetJSON(env, 'usage')]);
    const unchunked = index.videos.filter((v) => typeof v.c !== 'number').length;
    return json({ version: VERSION, channel, videos: index.videos.length, packedChunks: cs ? cs.next : 0, notPackedYet: unchunked, indexUpdatedAt: index.at ? new Date(index.at).toISOString() : null, statsAt: index.statsAt ? new Date(index.statsAt).toISOString() : null, fullStatsAt: index.fullStatsAt ? new Date(index.fullStatsAt).toISOString() : null, recentStatsAt: index.recentStatsAt ? new Date(index.recentStatsAt).toISOString() : null, backfill: bf, apiUsage: usage || null });
  }
  const status = await refresh(env, c, { force: url.searchParams.get('force') === '1', reset: url.searchParams.get('reset') === '1' });
  if (url.searchParams.get('cleanup') === '1') {
    try { const n = await cleanupKV(env, await loadIndex(env, true)); status.actions.push('cleanup: deleted ' + n + ' unused KV records'); }
    catch (e) { status.errors.push('cleanup: ' + (e.message || e)); }
  }
  const again = status.ok && ((status.backfill && !status.backfill.done) || (status.packingLeft > 0));
  const nextUrl = '/admin/refresh?key=' + encodeURIComponent(c.adminKey);
  const body = '<div class="admin"><h2 style="margin-top:0">Refresh ' + (status.ok ? '<span class="ok">OK</span>' : '<span class="bad">ERROR</span>') + '</h2>' +
    '<div>Channel: <b>' + esc(status.channel || '-') + '</b></div>' +
    '<div>Videos in index: <b>' + esc(status.total || 0) + '</b> (limit ' + esc(c.maxVideos) + ')</div>' +
    '<div>Backfill: <b>' + (status.backfill ? (status.backfill.done ? 'done' : 'in progress (pages: ' + status.backfill.pages + ')') : '-') + '</b></div>' +
    (status.packingLeft > 0 ? '<div>Packing older videos: <b>' + status.packingLeft + ' left</b></div>' : '') +
    '<div>API units this run: <b>' + esc(status.units == null ? '-' : status.units) + '</b>' + (status.usage ? ' &middot; today (cron+admin): <b>' + esc(status.usage.units) + '</b> in ' + esc(status.usage.runs) + ' runs' : '') + '</div>' +
    (status.actions.length ? '<pre>' + esc(status.actions.join('\n')) + '</pre>' : '') +
    (status.errors.length ? '<pre class="bad">' + esc(status.errors.join('\n')) + '</pre>' : '') +
    (again ? '<p>Loading the next pages automatically in 2 seconds… (keep this tab open)</p>' : '<p>Done. <a href="' + esc(nextUrl) + '">Run again</a> &middot; <a href="/">Open site</a></p>') +
    '</div>';
  const res = html('<!doctype html><html><head><meta charset="utf-8"><title>Admin</title>' + (again ? '<meta http-equiv="refresh" content="2">' : '') + '<style>' + CSS + '</style></head><body><div class="container"><main class="page">' + body + '</main></div></body></html>', 200);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

// Stranica sa jednim Adsterra banerom — ucitava se u <iframe> na sajtu (velicina se bira po sirini ekrana)
function adFrame(c, size) {
  const key = ADS.banners[size];
  if (!c.adsEnabled || !key) return text('Not found', 404);
  const wh = size.split('x');
  const page = '<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body>' +
    '<script>atOptions={"key":"' + key + '","format":"iframe","height":' + Number(wh[1]) + ',"width":' + Number(wh[0]) + ',"params":{}};</script>' +
    '<script src="' + ADS.bannerHost + key + '"></script></body></html>';
  return new Response(page, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=86400', 'referrer-policy': 'strict-origin-when-cross-origin' } });
}

// ---------------------------------------------------------------------------
//  Odgovori
// ---------------------------------------------------------------------------
function html(body, status, ttl) {
  return new Response(body, { status: status || 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=' + (ttl || PAGE_CACHE_SECONDS), 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin' } });
}
function text(body, status) {
  return new Response(body, { status: status || 200, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
}
function json(obj, status) {
  return new Response(JSON.stringify(obj, null, 2), { status: status || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}
function redirect(to, status) {
  return new Response(null, { status: status || 302, headers: { location: to, 'cache-control': 'public, max-age=3600' } });
}

async function handle(request, env, ctx) {
  const c = cfg(env);
  const url = new URL(request.url);
  c.host = url.hostname;
  let path = url.pathname.replace(/\/+$/, '') || '/';

  // www.domen.com -> domen.com (oba hostname-a dodaj kao Custom Domain na Worker)
  if (/^www\./i.test(url.hostname)) {
    url.hostname = url.hostname.replace(/^www\./i, '');
    return redirect(url.toString(), 301);
  }

  if (path === '/assets/app.css') return new Response(CSS, { headers: { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'public, max-age=31536000, immutable' } });
  if (path === '/assets/app.js') return new Response(JS, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=31536000, immutable' } });
  if (path === '/robots.txt') return text('User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ' + url.origin + '/sitemap.xml\n', 200);
  if (path === '/sitemap.xml') return sitemap(env, url);
  if (path === '/favicon.ico' || path === '/favicon.png') {
    const channel = await getChannel(env, c).catch(() => null);
    const logo = c.logoUrl || (channel && channel.logo);
    return logo ? redirect(logo, 302) : new Response(null, { status: 204 });
  }
  if (path === '/api/videos') {
    const index = await loadIndex(env);
    const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
    const offset = Math.max(0, Math.min(100000, parseInt(url.searchParams.get('offset') || '0', 10) || 0));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || String(c.pageSize), 10) || c.pageSize));
    const list = filterVideos(index.videos, q);
    const videos = list.slice(offset, offset + limit).map((v) => ({ id: v.id, t: v.t, v: v.v, p: v.p }));
    return new Response(JSON.stringify({ total: list.length, offset, limit, q, videos }), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60, s-maxage=120', 'access-control-allow-origin': '*' } });
  }
  if (path === '/api/list.json') {
    const raw = await indexRaw(env);
    return new Response(raw, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60, s-maxage=300', 'access-control-allow-origin': '*' } });
  }
  if (path === '/admin/refresh' || path === '/admin/status') return adminPage(env, c, url);
  const am = path.match(/^\/ad\/(\d+x\d+)$/);
  if (am) return adFrame(c, am[1]);
  if (path === '/') return pageHome(env, c, url, ctx);
  if (path === '/info') return pageInfo(env, c);
  if (path === '/contact') return pageContact(env, c);
  const vm = path.match(/^\/v\/([^/]+)$/);
  if (vm) {
    const id = vm[1];
    if (!ID_RE.test(id)) {
      const channel = await getChannel(env, c).catch(() => null);
      return page404(c, siteInfo(c, channel));
    }
    return pageVideo(env, c, url, id, ctx, request);
  }
  if (path === '/watch') {
    const id = url.searchParams.get('v');
    if (id && ID_RE.test(id)) { url.pathname = '/v/' + id; url.searchParams.delete('v'); return redirect(url.pathname + url.search, 301); }
  }
  const channel = await getChannel(env, c).catch(() => null);
  return page404(c, siteInfo(c, channel));
}

// ---------------------------------------------------------------------------
//  Ulazne tacke za Netlify funkcije
// ---------------------------------------------------------------------------
export async function handleRequest(request, env, ctx) {
  let res;
  try {
    res = await handle(request, env, ctx);
  } catch (e) {
    return text('Server error: ' + (e && e.message ? e.message : e), 500);
  }
  // Netlify CDN kes: s-maxage iz nasih Cache-Control zaglavlja prebaci u Netlify-CDN-Cache-Control
  try {
    const cc = res.headers.get('cache-control') || '';
    const m = cc.match(/s-maxage=(\d+)/);
    const path = new URL(request.url).pathname;
    if (res.status === 200 && m && !/no-store/.test(cc) && !path.startsWith('/admin')) {
      res.headers.set('Netlify-CDN-Cache-Control', 'public, s-maxage=' + m[1] + ', stale-while-revalidate=120');
      res.headers.set('Netlify-Vary', 'query');
    }
  } catch (e) { /* ignorisi */ }
  return res;
}

export async function runRefresh(env) {
  return refresh(env, cfg(env), {});
}
