/* musicA SaveIt – Oberfläche
   Läuft gegen das lokale Backend (/api) oder, wenn keins antwortet, im
   Demo-Modus mit simulierten Aufträgen. Die Oberfläche ist in beiden Fällen
   identisch; nur die Datenquelle wechselt. */
(() => {
'use strict';

/* ======================= Hilfsfunktionen ======================= */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad2 = n => String(n).padStart(2, '0');
const fmtDur = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h ? `${h}:${pad2(m)}:${pad2(x)}` : `${m}:${pad2(x)}`; };
const fmtDurLong = s => { const h = Math.floor(s / 3600), m = Math.round(s % 3600 / 60); if (!h && m < 1) return 'unter 1 min'; return h ? `${h} h ${m} min` : `${m} min`; };
const fmtEta = s => s < 60 ? `~${Math.max(5, Math.round(s / 5) * 5)} s` : `~${Math.ceil(s / 60)} min`;
const de = n => String(n).replace('.', ',');
const fmtMB = b => de((b / 1048576).toFixed(1)) + ' MB';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const uid = (() => { let n = 1; return (p = 'id') => `${p}${n++}`; })();
const hue = str => { let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 360; };
const coverStyle = (album) => `--c: hsl(${hue(album)} 22% 30%)`;
const todayStr = () => { const d = new Date(); return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`; };
const timeStr = (d = new Date()) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

/* ======================= Icons (Lucide, einfarbig) ======================= */
const ICONS = {
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  folderOpen: '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  stop: '<rect width="14" height="14" x="5" y="5" rx="2"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  sliders: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  list: '<path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/>',
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  chevUp: '<path d="m18 15-6-6-6 6"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  cloudOff: '<path d="m2 2 20 20"/><path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193"/><path d="M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07"/>',
  panel: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  clipboard: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  shuffle: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path name="x" d="m18 14 4 4-4 4"/>',
  minus: '<path d="M5 12h14"/>',
  volumeX: '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
  link2: '<path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" x2="16" y1="12" y2="12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
};
const ico = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;

/* ======================= Demo-Daten ======================= */
const SRC = {
  apple:   { label: 'Apple Music',   cls: 'src-apple' },
  spotify: { label: 'Spotify',       cls: 'src-spotify' },
  youtube: { label: 'YouTube Music', cls: 'src-youtube' },
  csv:     { label: 'Liste (CSV)',   cls: '' },
};
const KIND = { playlist: 'Playlist', album: 'Album', track: 'Titel' };

const POOL = [
  ['Blinding Lights', 'The Weeknd', 'After Hours', 2020, 200],
  ['Levitating', 'Dua Lipa', 'Future Nostalgia', 2020, 203],
  ['Dreams', 'Fleetwood Mac', 'Rumours', 1977, 257],
  ['Redbone', 'Childish Gambino', '„Awaken, My Love!“', 2016, 327],
  ['Electric Feel', 'MGMT', 'Oracular Spectacular', 2007, 229],
  ['Midnight City', 'M83', "Hurry Up, We're Dreaming", 2011, 243],
  ['Tainted Love', 'Soft Cell', 'Non-Stop Erotic Cabaret', 1981, 159],
  ['Heat Waves', 'Glass Animals', 'Dreamland', 2020, 238],
  ['Sunflower', 'Post Malone & Swae Lee', 'Spider-Man: Into the Spider-Verse', 2018, 158],
  ['Riptide', 'Vance Joy', 'Dream Your Life Away', 2013, 204],
  ['Juice', 'Lizzo', 'Cuz I Love You', 2019, 195],
  ['Lovefool', 'The Cardigans', 'First Band on the Moon', 1996, 195],
  ['Tage wie diese', 'Die Toten Hosen', 'Ballast der Republik', 2012, 278],
  ['Walking on a Dream', 'Empire of the Sun', 'Walking on a Dream', 2008, 198],
  ['Africa', 'Toto', 'Toto IV', 1982, 295],
  ['Feel Good Inc.', 'Gorillaz', 'Demon Days', 2005, 222],
  ['Mr. Brightside', 'The Killers', 'Hot Fuss', 2004, 222],
  ['Genesis', 'Grimes', 'Visions', 2012, 255],
  ['Ocean Eyes', 'Billie Eilish', "Don't Smile at Me", 2017, 200],
  ['Dog Days Are Over', 'Florence + The Machine', 'Lungs', 2009, 252],
  ['Yellow', 'Coldplay', 'Parachutes', 2000, 266],
  ['Take Five', 'The Dave Brubeck Quartet', 'Time Out', 1959, 324],
  ['Cordula Grün', 'Josh.', 'Von Mädchen und Farben', 2018, 193],
  ['Running Up That Hill', 'Kate Bush', 'Hounds of Love', 1985, 300],
];
const RAM = ['Give Life Back to Music', 'The Game of Love', 'Giorgio by Moroder', 'Within', 'Instant Crush', 'Lose Yourself to Dance', 'Touch', 'Get Lucky', 'Beyond', 'Motherboard', 'Fragments of Time', "Doin' It Right", 'Contact'];
const RAM_DUR = [274, 322, 544, 228, 337, 353, 498, 369, 290, 341, 279, 251, 382];
const WORKOUT = [
  ['Lose Yourself', 'Eminem', '8 Mile', 2002, 326],
  ['Till I Collapse', 'Eminem', 'The Eminem Show', 2002, 297],
  ['Stronger', 'Kanye West', 'Graduation', 2007, 312],
  ['Eye of the Tiger', 'Survivor', 'Eye of the Tiger', 1982, 245],
  ['Remember the Name', 'Fort Minor', 'The Rising Tied', 2005, 230],
  ['Power', 'Kanye West', 'My Beautiful Dark Twisted Fantasy', 2010, 292],
  ["Can't Hold Us", 'Macklemore & Ryan Lewis', 'The Heist', 2012, 258],
  ['Titanium', 'David Guetta feat. Sia', 'Nothing but the Beat', 2011, 245],
];
const PLAYLIST_NAMES = ['Roadtrip', 'Küche', 'Sonntagmorgen', 'Late Night', 'Fokus', 'Garten', 'Alte Lieblinge'];

const mkTrack = (nr, [title, artist, album, year, dur], extra = {}) => ({
  id: uid('t'), nr, title, artist, album, year, dur,
  status: 'waiting', progress: 0, speed: 0, size: Math.round(dur * 32 * 1024),
  quality: null, score: null, engine: 'match', fate: 'ok', note: '', retryIn: 0, retries: 0,
  chosen: null, ...extra,
});

function demoJobs() {
  const jobs = [];
  // Auftrag 1: Sommer 2026, läuft
  const s = POOL.slice(0, 14).map((t, i) => mkTrack(i + 1, t));
  s[2].fate = 'review'; s[2].score = 71;                       // Dreams
  s[3].fate = 'review'; s[3].score = 74;                       // Redbone
  s[5].fate = 'error';                                         // Midnight City
  s[10].fate = 'linked'; s[10].linkedFrom = 'Gute Laune';      // Juice
  s[11].fate = 'opus';                                         // Lovefool
  for (let i = 0; i < 5; i++) { s[i].status = 'done'; s[i].progress = 100; s[i].quality = 'AAC 256'; s[i].score = 96 + (i % 3); }
  s[2].status = 'review'; s[2].quality = null; s[2].progress = 0; s[2].score = 71;
  s[5].status = 'downloading'; s[5].progress = 41; s[5].speed = 2.3;
  s[6].status = 'downloading'; s[6].progress = 12; s[6].speed = 1.8;
  jobs.push({
    id: uid('j'), name: 'Sommer 2026', source: 'apple', kind: 'playlist', status: 'running',
    url: 'https://music.apple.com/de/playlist/sommer-2026/pl.u-8aAVZk3Tq6Lx2',
    folder: 'D:\\Musik\\Sicherung', format: 'original', engine: 'auto', subscribe: false,
    tracks: s, createdAt: 'heute 14:02', m3u: true, lyrics: true,
  });
  // Auftrag 2: Album, wartet
  const a = RAM.map((t, i) => mkTrack(i + 1, [t, 'Daft Punk', 'Random Access Memories', 2013, RAM_DUR[i]]));
  jobs.push({
    id: uid('j'), name: 'Random Access Memories', source: 'apple', kind: 'album', status: 'queued',
    url: 'https://music.apple.com/de/album/random-access-memories/1440935467',
    folder: 'D:\\Musik\\Sicherung', format: 'original', engine: 'auto', subscribe: false,
    tracks: a, createdAt: 'heute 14:05', m3u: true, lyrics: true,
  });
  // Auftrag 3: Workout, Abo, synchron
  const w = WORKOUT.map((t, i) => mkTrack(i + 1, t, { status: 'done', progress: 100, quality: 'AAC 256', score: 95 }));
  w[4].status = 'vanished'; w[4].note = 'seit 03.10.';
  w[6].isNew = true; w[7].isNew = true;
  jobs.push({
    id: uid('j'), name: 'Workout', source: 'spotify', kind: 'playlist', status: 'done',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP',
    folder: 'D:\\Musik\\Sicherung', format: 'original', engine: 'auto', subscribe: true,
    lastSync: 'heute 06:00', newToday: 2,
    tracks: w, createdAt: '12.09.2026', m3u: true, lyrics: true,
  });
  // Auftrag 4: Einzeltitel, fertig
  jobs.push({
    id: uid('j'), name: 'Take Five', source: 'youtube', kind: 'track', status: 'done',
    url: 'https://music.youtube.com/watch?v=vmDDOFXSgAs',
    folder: 'D:\\Musik\\Sicherung\\Jazz', format: 'flac', engine: 'auto', subscribe: false,
    tracks: [mkTrack(1, POOL[21], { status: 'done', progress: 100, quality: 'FLAC · exakt', engine: 'rec', score: 100 })],
    createdAt: 'gestern 22:40', m3u: false, lyrics: true,
  });
  return jobs;
}

const DEMO_HISTORY = [
  { date: '09.10.2026 22:41', name: 'Take Five', source: 'youtube', kind: 'track', n: 1, folder: 'D:\\Musik\\Sicherung\\Jazz' },
  { date: '05.10.2026 19:10', name: 'Gute Laune', source: 'apple', kind: 'playlist', n: 31, folder: 'D:\\Musik\\Sicherung' },
  { date: '03.10.2026 06:00', name: 'Workout · Abo-Prüfung', source: 'spotify', kind: 'playlist', n: 0, folder: 'D:\\Musik\\Sicherung', note: '1 Titel im Dienst verschwunden' },
  { date: '28.09.2026 21:33', name: 'Currents', source: 'apple', kind: 'album', n: 13, folder: 'D:\\Musik\\Sicherung' },
  { date: '12.09.2026 17:58', name: 'Workout', source: 'spotify', kind: 'playlist', n: 6, folder: 'D:\\Musik\\Sicherung' },
];

function candidatesFor(t) {
  const base = [
    { title: `${t.title}`, channel: `${t.artist} - Topic`, dur: t.dur, q: 'AAC 256', score: 0, flags: ['Offizieller Kanal'] },
    { title: `${t.artist} - ${t.title} (Official Video)`, channel: t.artist.split(' ')[0] + 'VEVO', dur: t.dur + 3, q: 'Opus 130', score: 0, flags: ['Video-Ton'] },
    { title: `${t.title} (Live)`, channel: 'LiveSessions', dur: t.dur + 34, q: 'Opus 130', score: 0, flags: ['Live'] },
    { title: `${t.artist} - ${t.title} (Lyrics)`, channel: 'Lyrics Lounge', dur: t.dur + 1, q: 'Opus 130', score: 0, flags: ['Lyric-Video'] },
  ];
  if (t.title === 'Dreams') {
    base[0] = { title: 'Dreams (2004 Remaster)', channel: 'Fleetwood Mac - Topic', dur: 257, q: 'AAC 256', flags: ['Offizieller Kanal', 'Remaster'] };
    base[1] = { title: 'Dreams', channel: 'Fleetwood Mac - Topic', dur: 256, q: 'AAC 256', flags: ['Offizieller Kanal', 'Album 1977'] };
    base[2] = { title: 'Fleetwood Mac - Dreams (Official Music Video)', channel: 'FleetwoodMacVEVO', dur: 256, q: 'Opus 130', flags: ['Video-Ton'] };
    base[3] = { title: 'Dreams (Live at Warner Brothers Studios 1997)', channel: 'FleetwoodMacVEVO', dur: 270, q: 'Opus 130', flags: ['Live'] };
  }
  if (t.title === 'Redbone') {
    base[2] = { title: 'Redbone (slowed + reverb)', channel: 'chill vibes', dur: 370, q: 'Opus 130', flags: ['Bearbeitet'] };
    base[3] = { title: 'Redbone - Live at Coachella 2019', channel: 'CoachellaLive', dur: 350, q: 'Opus 130', flags: ['Live'] };
  }
  const scores = t.title === 'Dreams' ? [71, 70, 64, 31] : t.title === 'Redbone' ? [74, 69, 22, 18] : [94, 80, 35, 60];
  return base.map((c, i) => ({ ...c, id: uid('c'), score: scores[i], diff: c.dur - t.dur }));
}

/* ======================= Zustand ======================= */
const state = {
  view: 'jobs',
  jobs: [],
  selectedJobId: null,
  selectedTrackId: null,
  panel: null,
  menu: null,
  filter: 'all',
  search: '',
  optionsOpen: false,
  sidebarOpen: false,
  sidebarCollapsed: false,
  clip: null,
  toast: null,
  link: { url: '', parsed: null, error: '' },
  preview: null,
  settings: {
    folder: 'D:\\Musik\\Sicherung',
    recent: ['D:\\Musik\\Sicherung', 'D:\\Musik\\Sicherung\\Jazz', 'E:\\Backup\\Musik'],
    format: 'original',
    scheme: '{Playlist}/{Nr} - {Artist} - {Titel}',
    schemeAlbum: '{Artist}/{Album}/{Nr} - {Titel}',
    engine: 'auto', parallel: 2, lyrics: true, m3u: true, subscribe: false, night: false,
    cookies: 'firefox', autoUpdate: true, clipboardWatch: true, notify: true, silence: true,
    replaygain: false, lang: 'de', openBrowser: true,
    device: 'Lautsprecher (Realtek High Definition Audio) · 48 kHz',
    startNow: false,
  },
  backend: { mode: 'demo', ytdlp: '2026.09.26', ytdlpOk: true, version: '0.1.0' },
  history: DEMO_HISTORY,
};

const FORMATS = { original: 'Original behalten', mp3: 'MP3 320', flac: 'FLAC' };
const FORMAT_EXT = { original: 'm4a', mp3: 'mp3', flac: 'flac' };

/* ======================= Link-Erkennung ======================= */
function parseLink(raw) {
  const url = (raw || '').trim();
  if (!url) return null;
  let u; try { u = new URL(url); } catch { return { error: 'Das ist kein Link.' }; }
  const h = u.hostname.replace(/^www\./, ''), p = u.pathname;
  const slug = s => s ? decodeURIComponent(s).replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
  if (h === 'music.apple.com') {
    if (/\/playlist\//.test(p)) return { source: 'apple', kind: 'playlist', name: slug(p.split('/playlist/')[1]?.split('/')[0]) || 'Apple-Music-Playlist' };
    if (/\/album\//.test(p)) { const name = slug(p.split('/album/')[1]?.split('/')[0]); return u.searchParams.get('i') ? { source: 'apple', kind: 'track', name: name || 'Titel' } : { source: 'apple', kind: 'album', name: name || 'Album' }; }
    if (/\/song\//.test(p)) return { source: 'apple', kind: 'track', name: slug(p.split('/song/')[1]?.split('/')[0]) || 'Titel' };
    return { error: 'Apple-Music-Link erkannt, aber weder Playlist, Album noch Titel.' };
  }
  if (h === 'open.spotify.com') {
    const m = p.match(/\/(playlist|album|track)\//);
    if (m) return { source: 'spotify', kind: m[1], name: '' };
    return { error: 'Spotify-Link erkannt, aber weder Playlist, Album noch Titel.' };
  }
  if (h === 'music.youtube.com' || h === 'youtube.com' || h === 'm.youtube.com' || h === 'youtu.be') {
    if (u.searchParams.get('list')) return { source: 'youtube', kind: 'playlist', name: '' };
    if (u.searchParams.get('v') || h === 'youtu.be') return { source: 'youtube', kind: 'track', name: '' };
    return { error: 'YouTube-Link erkannt, aber kein Video oder keine Playlist.' };
  }
  return { error: 'Unterstützt: Apple Music, Spotify, YouTube Music.' };
}

/* ======================= Demo-Backend (Simulation) ======================= */
const api = {
  addJob(url, parsed) {
    const name = parsed.name || (parsed.kind === 'track' ? POOL[(state.jobs.length * 7) % POOL.length][0] : PLAYLIST_NAMES[state.jobs.length % PLAYLIST_NAMES.length]);
    let tracks;
    const off = (state.jobs.length * 5) % POOL.length;
    const take = n => Array.from({ length: n }, (_, i) => POOL[(off + i) % POOL.length]);
    if (parsed.kind === 'track') { const t = POOL.find(x => x[0] === name) || POOL[off]; tracks = [mkTrack(1, t)]; }
    else if (parsed.kind === 'album') { const src = take(10); tracks = src.map((t, i) => mkTrack(i + 1, [t[0], src[0][1], src[0][2], src[0][3], t[4]])); }
    else tracks = take(12).map((t, i) => mkTrack(i + 1, t));
    tracks.forEach((t, i) => { if (parsed.kind !== 'track' && i === 4) { t.fate = 'review'; t.score = 68; } if (i === 7) t.fate = 'error'; });
    const s = state.settings;
    const job = {
      id: uid('j'), name, source: parsed.source, kind: parsed.kind, status: 'ready', url,
      folder: s.folder, format: s.format, engine: s.engine, subscribe: parsed.kind === 'playlist' && s.subscribe,
      tracks, createdAt: `heute ${timeStr()}`, m3u: s.m3u && parsed.kind !== 'track', lyrics: s.lyrics,
    };
    state.jobs.unshift(job);
    return job;
  },
  start(job) {
    if (job.status !== 'ready' && job.status !== 'cancelled' && job.status !== 'done') return;
    job.tracks.forEach(t => { if (t.status === 'skipped' || t.status === 'error') { t.status = 'waiting'; t.progress = 0; } });
    job.status = state.jobs.some(j => j.status === 'running') ? 'queued' : 'running';
  },
  pause(job) { if (job.status === 'running') job.status = 'paused'; else if (job.status === 'paused') job.status = 'running'; },
  cancel(job) {
    job.tracks.forEach(t => { if (['waiting', 'searching', 'downloading', 'tagging', 'queuedRec', 'recording'].includes(t.status)) { t.status = 'skipped'; t.progress = 0; } });
    job.status = 'cancelled';
    nextInQueue();
  },
  remove(job) {
    state.jobs = state.jobs.filter(j => j !== job);
    if (state.selectedJobId === job.id) state.selectedJobId = state.jobs[0]?.id || null;
    nextInQueue();
  },
  retry(t) { t.status = 'waiting'; t.progress = 0; t.retries = 0; t.fate = 'ok'; wake(t); },
  useRecorder(t) { t.engine = 'rec'; t.status = 'queuedRec'; t.progress = 0; t.quality = null; wake(t); },
  skip(t) { t.status = 'skipped'; },
  choose(t, cand) { t.chosen = cand; t.score = cand.score; t.fate = 'ok'; t.engine = 'match'; t.status = 'waiting'; t.progress = 0; t.quality = null; wake(t); },
  removeTrack(job, t) { job.tracks = job.tracks.filter(x => x !== t); },
  toggleSub(job) { job.subscribe = !job.subscribe; if (job.subscribe) { job.lastSync = `heute ${timeStr()}`; job.newToday = job.newToday || 0; } },
  openFolder(path) { toast('Explorer geöffnet', path, 'folderOpen'); },
  checkUpdate() { state.backend.ytdlpOk = true; toast('Downloader ist aktuell', `yt-dlp ${state.backend.ytdlp}`, 'checkCircle'); },
};
function wake(t) { const job = jobOf(t); if (job && (job.status === 'done' || job.status === 'cancelled')) job.status = state.jobs.some(j => j.status === 'running') ? 'queued' : 'running'; }
function jobOf(t) { return state.jobs.find(j => j.tracks.includes(t)); }
function nextInQueue() {
  if (state.jobs.some(j => j.status === 'running')) return;
  const n = state.jobs.find(j => j.status === 'queued');
  if (n) n.status = 'running';
}

const ACTIVE = ['searching', 'downloading', 'tagging', 'recording'];
const TERMINAL = ['done', 'linked', 'vanished', 'skipped', 'review'];
function tick() {
  const job = state.jobs.find(j => j.status === 'running');
  if (!job) return;
  let changed = false;
  const par = state.settings.parallel;
  for (const t of job.tracks) {
    if (t.status === 'searching') { t._n = (t._n || 0) + 1; if (t._n > 4) { t._n = 0; applyFate(t); } changed = true; }
    else if (t.status === 'downloading') {
      t.progress = clamp(t.progress + 1.5 + Math.random() * 4, 0, 100); t.speed = 1.4 + Math.random() * 2.2;
      if (t.progress >= 100) { t.status = 'tagging'; t._n = 0; }
      changed = true;
    }
    else if (t.status === 'tagging') { t._n = (t._n || 0) + 1; if (t._n > 3) { t.status = 'done'; t.quality = t.fate === 'opus' ? 'Opus 130' : (t.chosen?.q || 'AAC 256'); t.score = t.score || 93 + Math.round(Math.random() * 6); } changed = true; }
    else if (t.status === 'recording') { t.progress = clamp(t.progress + (100 / t.dur) * 0.3 * 8, 0, 100); if (t.progress >= 100) { t.status = 'tagging'; t._n = 0; t.quality = 'FLAC · exakt'; } changed = true; }
    else if (t.status === 'error' && t.retryIn > 0) { t.retryIn -= 0.3; if (t.retryIn <= 0) { t.retryIn = 0; t.status = 'waiting'; t.fate = 'ok'; } changed = true; }
  }
  let active = job.tracks.filter(t => ACTIVE.includes(t.status)).length;
  for (const t of job.tracks) {
    if (active >= par) break;
    if (t.status === 'waiting') { t.status = 'searching'; t._n = 0; active++; changed = true; }
  }
  if (!job.tracks.some(t => t.status === 'recording')) {
    const r = job.tracks.find(t => t.status === 'queuedRec');
    if (r && active === 0) { r.status = 'recording'; r.progress = 0; changed = true; }
  }
  const open = job.tracks.some(t => ['waiting', 'queuedRec', ...ACTIVE].includes(t.status) || (t.status === 'error' && t.retryIn > 0));
  if (!open) {
    job.status = 'done'; job.finishedAt = `heute ${timeStr()}`;
    const n = job.tracks.filter(t => t.status === 'done' || t.status === 'linked').length;
    const rev = job.tracks.filter(t => t.status === 'review').length;
    toast(`„${job.name}“ gesichert`, `${n} Titel${job.m3u ? ' · playlist.m3u8 geschrieben' : ''}${rev ? ` · ${rev} warten auf Prüfung` : ''}`, 'checkCircle', { label: 'Ordner öffnen', run: () => api.openFolder(job.folder + '\\' + job.name) });
    state.history.unshift({ date: `${todayStr()} ${timeStr()}`, name: job.name, source: job.source, kind: job.kind, n, folder: job.folder });
    nextInQueue();
    render();
    return;
  }
  if (changed) patch();
}
function applyFate(t) {
  switch (t.fate) {
    case 'review': t.status = 'review'; t.score = t.score || 70; break;
    case 'error': if (t.retries < 1) { t.retries++; t.status = 'error'; t.retryIn = 24; t.note = 'YouTube drosselt (429)'; } else { t.status = 'downloading'; t.progress = 0; } break;
    case 'linked': t.status = 'linked'; t.quality = 'AAC 256'; break;
    default: t.status = 'downloading'; t.progress = 0;
  }
}

/* ======================= Rendering ======================= */
const app = $('#app');
let rowCache = new Map();

function render() {
  app.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
  app.classList.toggle('sidebar-open', state.sidebarOpen);
  renderClip();
  renderTop();
  renderOptions();
  renderSidebar();
  renderMain();
  renderStatus();
  renderPanel();
  renderMenu();
  renderToast();
  $('#backdrop').hidden = !state.sidebarOpen;
}

function renderClip() {
  const el = $('#clipbar');
  if (!state.clip) { el.hidden = true; return; }
  el.hidden = false;
  const c = state.clip;
  el.innerHTML = `${ico('clipboard')}<div class="grow">In der Zwischenablage: <strong>${esc(c.name)}</strong> <span class="muted">· ${SRC[c.source].label} · ${KIND[c.kind]} · ${c.count} Titel</span></div>
    <button class="btn btn-sm btn-primary" data-act="clip-add">Hinzufügen</button>
    <button class="btn btn-sm btn-ghost" data-act="clip-dismiss">Ignorieren</button>`;
}

function renderTop() {
  const s = state.settings;
  const sel = selectedJob();
  const meta = $('#linkmeta');
  const l = state.link;
  if (l.error) { meta.className = 'meta is-err'; meta.textContent = l.error; }
  else if (l.parsed) { meta.className = 'meta is-ok'; meta.textContent = `${SRC[l.parsed.source].label} · ${KIND[l.parsed.kind]}`; }
  else { meta.className = 'meta'; meta.textContent = ''; }
  $('#folderPath').innerHTML = `<bdi>${esc(s.folder)}</bdi>`;
  $('#format').value = s.format;
  const btn = $('#saveBtn');
  const canStart = sel && sel.status === 'ready' && !l.url;
  btn.textContent = l.url && l.parsed ? 'Hinzufügen' : canStart ? 'Sichern' : 'Sichern';
  btn.disabled = !(l.url && l.parsed) && !canStart;
  $('#moreBtn').innerHTML = `Mehr ${ico(state.optionsOpen ? 'chevUp' : 'chevDown', 'sm')}`;
  $('#moreBtn').setAttribute('aria-expanded', String(state.optionsOpen));
}

function renderOptions() {
  const el = $('#optsbar');
  el.hidden = !state.optionsOpen;
  if (!state.optionsOpen) return;
  const s = state.settings;
  const sample = sampleTrack();
  const kindNow = state.link.parsed?.kind || selectedJob()?.kind || 'playlist';
  const scheme = kindNow === 'album' ? s.schemeAlbum : s.scheme;
  const tog = (key, label, hint = '', disabled = false) => `<label class="toggle ${s[key] ? '' : 'is-off'}" ${disabled ? 'style="opacity:.45"' : ''}><button class="switch" role="switch" aria-checked="${s[key]}" data-toggle="${key}" ${disabled ? 'disabled' : ''}></button><span>${label}</span>${hint ? `<span class="faint">${hint}</span>` : ''}</label>`;
  el.innerHTML = `
    <div class="field grow">
      <span class="lbl">Namensschema ${kindNow === 'album' ? '(Album)' : '(Playlist / Titel)'}</span>
      <input class="ctl mono" id="scheme" value="${esc(scheme)}" spellcheck="false">
      <div class="preview">${previewName(scheme, sample, s.format)}</div>
    </div>
    <div class="field">
      <span class="lbl">Engine</span>
      <div class="seg" data-seg="engine">
        <button aria-pressed="${s.engine === 'auto'}" data-val="auto" title="Matcher, bei Unsicherheit Recorder">Automatisch</button>
        <button aria-pressed="${s.engine === 'match'}" data-val="match" title="Schnell: Treffer bei YouTube Music">Matcher</button>
        <button aria-pressed="${s.engine === 'rec'}" data-val="rec" title="Exakt: Mitschnitt in Echtzeit">Recorder</button>
      </div>
      <span class="hint">${s.engine === 'rec' ? 'Echtzeit: 1 Titel = seine Spieldauer' : s.engine === 'match' ? 'Sekunden pro Titel, Tags aus der Quelle' : 'Schnell, exakt nur wo nötig'}</span>
    </div>
    <div class="field">
      <span class="lbl">Parallel</span>
      <div class="stepper"><button data-step="-1" aria-label="weniger">${ico('minus', 'sm')}</button><output>${s.parallel}</output><button data-step="1" aria-label="mehr">${ico('plus', 'sm')}</button></div>
      <span class="hint">${s.parallel >= 4 ? 'Hoch: YouTube drosselt eher' : 'Downloads gleichzeitig'}</span>
    </div>
    <div class="field">
      <span class="lbl">Extras</span>
      <div class="toggles">
        ${tog('lyrics', 'Liedtexte (.lrc)')}
        ${tog('m3u', 'Playlist-Datei (.m3u8)')}
        ${tog('subscribe', 'Abo: Ordner synchron halten', '', kindNow !== 'playlist')}
        ${tog('night', 'Nachtmodus', 'Recorder', s.engine === 'match')}
        ${tog('startNow', 'Sofort starten')}
      </div>
    </div>`;
}

function sampleTrack() {
  const j = selectedJob() || state.jobs[0];
  const t = j?.tracks[0];
  return { playlist: j?.name || 'Sommer 2026', nr: 1, artist: t?.artist || 'The Weeknd', title: t?.title || 'Blinding Lights', album: t?.album || 'After Hours', year: t?.year || 2020 };
}
function previewName(scheme, smp, format) {
  const map = { Playlist: smp.playlist, Nr: pad2(smp.nr), Artist: smp.artist, Titel: smp.title, Album: smp.album, Jahr: smp.year };
  const out = scheme.replace(/\//g, '\\').split(/(\{\w+\})/g).map(p => {
    const m = p.match(/^\{(\w+)\}$/);
    return m && map[m[1]] !== undefined ? `<b>${esc(sanitize(String(map[m[1]])))}</b>` : esc(p);
  }).join('');
  return `${esc(state.settings.folder)}\\${out}.${FORMAT_EXT[format]}`;
}
function sanitize(s) { return s.replace(/[\\/:*?"<>|]/g, '_'); }

function renderSidebar() {
  const list = $('#joblist');
  if (!state.jobs.length) { list.innerHTML = `<div class="side-empty">Noch keine Aufträge.</div>`; }
  else list.innerHTML = state.jobs.map(j => {
    const d = jobDot(j);
    const done = j.tracks.filter(t => t.status === 'done' || t.status === 'linked').length;
    const sub = jobSubline(j, done);
    const pct = j.status === 'running' || j.status === 'paused' ? Math.round(jobProgress(j) * 100) : null;
    return `<button class="job-item ${j.id === state.selectedJobId && state.view === 'jobs' ? 'is-active' : ''}" data-job="${j.id}">
      <span class="dot ${d}"></span><span class="name">${esc(j.name)}</span>
      <span class="sub">${sub}</span>
      ${pct !== null ? `<span class="mini"><i style="width:${pct}%"></i></span>` : ''}
    </button>`;
  }).join('');
  $$('#sidenav button').forEach(b => b.classList.toggle('is-active', b.dataset.view === state.view));
}
function jobDot(j) {
  if (j.status === 'running') return 'run';
  if (j.status === 'paused') return 'warn';
  if (j.status === 'queued') return 'idle';
  if (j.status === 'ready') return 'ready';
  if (j.status === 'cancelled') return 'idle';
  if (j.tracks.some(t => t.status === 'review' || t.status === 'vanished')) return 'warn';
  return 'ok';
}
function jobSubline(j, done) {
  const n = j.tracks.length, src = SRC[j.source].label;
  switch (j.status) {
    case 'running': return `${done} von ${n} · läuft`;
    case 'paused': return `${done} von ${n} · pausiert`;
    case 'queued': return `${src} · ${n} Titel · wartet`;
    case 'ready': return `${src} · ${n} Titel · bereit`;
    case 'cancelled': return `${done} von ${n} · abgebrochen`;
    default: {
      const rev = j.tracks.filter(t => t.status === 'review').length;
      const van = j.tracks.filter(t => t.status === 'vanished').length;
      if (j.subscribe) return `Abo · ${j.newToday ? `${j.newToday} neu heute` : 'synchron'}${van ? ` · ${van} verschwunden` : ''}`;
      if (rev) return `${done} von ${n} · ${rev} prüfen`;
      return `${src} · ${n} Titel · fertig`;
    }
  }
}
function jobProgress(j) {
  if (!j.tracks.length) return 0;
  const sum = j.tracks.reduce((a, t) => a + (['done', 'linked', 'skipped', 'vanished', 'review'].includes(t.status) ? 1 : ['downloading', 'recording', 'tagging'].includes(t.status) ? t.progress / 100 : 0), 0);
  return sum / j.tracks.length;
}
function selectedJob() { return state.jobs.find(j => j.id === state.selectedJobId) || null; }

function renderMain() {
  const m = $('#main');
  if (state.view === 'history') { m.innerHTML = renderHistory(); return; }
  if (state.view === 'settings') { m.innerHTML = renderSettings(); return; }
  const j = selectedJob();
  if (!j) { m.innerHTML = renderEmpty(); return; }
  m.innerHTML = renderJobHead(j) + renderTools(j) + `<div class="tablewrap" id="tablewrap"><table class="tracks"><thead><tr>
      <th class="col-nr">#</th><th class="col-cover"></th><th class="col-title">Titel</th><th class="col-album">Album</th><th class="col-dur">Dauer</th><th class="col-q">Qualität</th><th class="col-status">Status</th><th class="col-act"></th>
    </tr></thead><tbody id="tbody"></tbody></table></div>`;
  rowCache = new Map();
  renderRows(j);
}

function renderJobHead(j) {
  const n = j.tracks.length, done = j.tracks.filter(t => t.status === 'done' || t.status === 'linked').length;
  const total = j.tracks.reduce((a, t) => a + t.dur, 0);
  const rev = j.tracks.filter(t => t.status === 'review').length;
  const van = j.tracks.filter(t => t.status === 'vanished').length;
  const recLeft = j.tracks.filter(t => ['queuedRec', 'recording'].includes(t.status)).reduce((a, t) => a + t.dur * (1 - t.progress / 100), 0);
  const left = j.tracks.filter(t => ['waiting', 'searching', 'downloading', 'tagging'].includes(t.status)).length;
  const covers = [...new Set(j.tracks.map(t => t.album))].slice(0, 3).map(a => `<span class="cover" style="${coverStyle(a)}">${esc(a[0])}</span>`).join('');
  let stateTag = '';
  if (j.status === 'done') stateTag = rev ? `<span class="tag warn">${rev} prüfen</span>` : `<span class="tag done">${ico('check', 'sm')} gesichert</span>`;
  if (j.status === 'ready') stateTag = `<span class="tag">bereit</span>`;
  if (j.status === 'paused') stateTag = `<span class="tag warn">pausiert</span>`;
  if (j.status === 'cancelled') stateTag = `<span class="tag">abgebrochen</span>`;
  if (j.subscribe) stateTag += ` <span class="tag abo">${ico('repeat', 'sm')} Abo</span>`;
  const meta = [`${SRC[j.source].label} · ${KIND[j.kind]}`, `${n} Titel`, fmtDurLong(total)];
  if (j.status === 'running' || j.status === 'queued') meta.push(`noch ${fmtEta(left * 9 + recLeft)}`);
  if (j.status === 'ready') meta.push(`Dauer ${j.engine === 'rec' ? fmtDurLong(total) + ' (Echtzeit)' : fmtEta(n * 9)}`);
  if (j.status === 'done') meta.push(`${done} gesichert${van ? ` · ${van} im Dienst verschwunden` : ''}`);
  if (j.subscribe && j.lastSync) meta.push(`zuletzt geprüft ${j.lastSync}`);
  meta.push(FORMATS[j.format]);
  const act = [];
  if (j.status === 'ready') act.push(`<button class="btn btn-primary" data-act="start">${ico('play', 'sm')} Sichern</button>`);
  if (j.status === 'running') act.push(`<button class="btn" data-act="pause">${ico('pause', 'sm')} Pause</button>`);
  if (j.status === 'paused') act.push(`<button class="btn btn-primary" data-act="pause">${ico('play', 'sm')} Fortsetzen</button>`);
  if (['running', 'paused', 'queued'].includes(j.status)) act.push(`<button class="btn btn-ghost btn-danger" data-act="cancel">Abbrechen</button>`);
  if (j.status === 'cancelled') act.push(`<button class="btn" data-act="start">${ico('refresh', 'sm')} Rest sichern</button>`);
  act.push(`<button class="btn" data-act="open">${ico('folderOpen', 'sm')} Ordner öffnen</button>`);
  if (j.status === 'done' && j.m3u) act.push(`<button class="btn btn-ghost" data-act="m3u" title="playlist.m3u8 im Zielordner">${ico('file', 'sm')} .m3u8</button>`);
  act.push(`<button class="btn btn-icon btn-ghost" data-act="jobmenu" aria-label="Weitere Aktionen">${ico('more')}</button>`);
  return `<div class="job-head">
    <div class="covers">${covers}</div>
    <div class="info">
      <h1>${esc(j.name)} ${stateTag}</h1>
      <div class="meta">${meta.map(x => `<span>${x}</span>`).join('')}</div>
      <div class="pathline">${ico('folder', 'sm')}<span class="path" data-act="open" title="Im Explorer öffnen">${esc(j.folder)}\\${esc(sanitize(j.name))}</span>${j.status === 'done' && j.m3u ? `<span class="faint">· playlist.m3u8</span>` : ''}${j.lyrics ? `<span class="faint">· .lrc</span>` : ''}</div>
    </div>
    <div class="actions">${act.join('')}</div>
  </div>`;
}

function renderTools(j) {
  const c = k => j.tracks.filter(t => k === 'all' ? true : k === 'review' ? t.status === 'review' : k === 'error' ? t.status === 'error' : k === 'done' ? ['done', 'linked'].includes(t.status) : k === 'open' ? !TERMINAL.includes(t.status) : false).length;
  const chip = (k, label, dot) => `<button class="chip" aria-pressed="${state.filter === k}" data-filter="${k}">${dot ? `<span class="dot ${dot}"></span>` : ''}${label} <span class="n">${c(k)}</span></button>`;
  return `<div class="tools">
    ${chip('all', 'Alle')}${chip('open', 'Offen')}${chip('done', 'Fertig', 'ok')}${c('review') ? chip('review', 'Prüfen', 'warn') : ''}${c('error') ? chip('error', 'Fehler', 'err') : ''}
    <span class="spacer"></span>
    <label class="search">${ico('search', 'sm')}<input id="search" placeholder="Titel oder Artist" value="${esc(state.search)}" aria-label="Titel suchen"></label>
  </div>`;
}

function visibleTracks(j) {
  const q = state.search.trim().toLowerCase();
  return j.tracks.filter(t => {
    if (q && !(`${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(q))) return false;
    switch (state.filter) {
      case 'review': return t.status === 'review';
      case 'error': return t.status === 'error';
      case 'done': return ['done', 'linked'].includes(t.status);
      case 'open': return !TERMINAL.includes(t.status);
      default: return true;
    }
  });
}

function renderRows(j) {
  const tb = $('#tbody');
  const list = visibleTracks(j);
  if (!list.length) { tb.innerHTML = `<tr><td colspan="8" class="muted" style="padding:18px 20px">Kein Titel passt zu Filter oder Suche.</td></tr>`; return; }
  tb.innerHTML = list.map(t => `<tr class="track ${rowClass(t)}" data-track="${t.id}" tabindex="-1">${rowHtml(t)}</tr>`).join('');
  list.forEach(t => rowCache.set(t.id, rowHtml(t)));
}
function rowClass(t) { return `is-${t.status}${t.id === state.selectedTrackId ? ' is-selected' : ''}`; }
function rowHtml(t) {
  return `<td class="col-nr num">${t.nr}</td>
    <td class="col-cover"><span class="cover" style="${coverStyle(t.album)}">${esc(t.album[0])}</span></td>
    <td class="col-title"><div class="t-title">${esc(t.title)}${t.isNew ? ' <span class="tag abo" style="height:16px">neu</span>' : ''}</div><div class="t-artist">${esc(t.artist)}</div></td>
    <td class="col-album">${esc(t.album)} <span class="faint">${t.year}</span></td>
    <td class="col-dur num">${fmtDur(t.dur)}</td>
    <td class="col-q">${qualityHtml(t)}</td>
    <td class="col-status">${statusHtml(t)}</td>
    <td class="col-act"><button class="btn btn-sm btn-icon btn-ghost row-act" data-act="rowmenu" aria-label="Aktionen für ${esc(t.title)}">${ico('more')}</button></td>`;
}
function qualityHtml(t) {
  if (t.quality) return `<span class="${t.quality.includes('exakt') ? '' : ''}">${esc(t.quality)}</span>`;
  if (t.status === 'downloading' || t.status === 'tagging') return `<span class="faint">${esc(t.chosen?.q || (t.fate === 'opus' ? 'Opus 130' : 'AAC 256'))}</span>`;
  if (t.engine === 'rec') return `<span class="faint">FLAC · exakt</span>`;
  return `<span class="faint">–</span>`;
}
function statusHtml(t) {
  const line = (icon, txt, extra = '') => `<div class="status is-${t.status}"><div class="line">${icon}<span class="txt">${txt}</span></div>${extra}</div>`;
  switch (t.status) {
    case 'waiting': return line(ico('clock', 'sm'), 'Wartet');
    case 'searching': return line('', 'Suche bei YouTube Music …', `<div class="pbar indet"><i></i></div>`);
    case 'downloading': return line('', `Lädt · <span class="num">${Math.round(t.progress)} %</span> · <span class="num">${de(t.speed.toFixed(1))} MB/s</span>`, `<div class="pbar"><i style="width:${t.progress}%"></i></div>`);
    case 'tagging': return line('', 'Tags, Cover und Liedtext …', `<div class="pbar"><i style="width:100%"></i></div>`);
    case 'done': return line(ico('check', 'sm'), `Fertig${t.score ? ` <span class="faint">· Treffer ${t.score} %</span>` : ''}`);
    case 'review': return `<div class="status is-review"><div class="line"><button class="btn btn-sm btn-outline-accent" data-act="review">${ico('alert', 'sm')} Prüfen · ${t.score} %</button></div></div>`;
    case 'error': return t.retryIn > 0
      ? line(ico('alert', 'sm'), `${esc(t.note)} · Versuch ${t.retries + 1} von 3 in <span class="num">${Math.ceil(t.retryIn)} s</span>`)
      : `<div class="status is-error"><div class="line">${ico('alert', 'sm')}<span class="txt">Fehlgeschlagen · ${esc(t.note || 'kein Treffer')}</span><button class="btn btn-sm" data-act="retry">Erneut</button></div></div>`;
    case 'linked': return line(ico('link2', 'sm'), `Vorhanden · aus „${esc(t.linkedFrom)}“ verknüpft`);
    case 'vanished': return line(ico('cloudOff', 'sm'), `Im Dienst verschwunden ${esc(t.note)} · deine Datei ist die einzige`);
    case 'queuedRec': return line(ico('mic', 'sm'), 'Recorder · wartet auf freie Wiedergabe');
    case 'recording': return `<div class="status is-rec"><div class="line"><span class="dot rec"></span><span class="txt">Aufnahme · <span class="num">${fmtDur(t.dur * t.progress / 100)} / ${fmtDur(t.dur)}</span> · Echtzeit</span></div><div class="pbar rec"><i style="width:${t.progress}%"></i></div></div>`;
    case 'skipped': return line('', 'Übersprungen');
    default: return line('', t.status);
  }
}
function patch() {
  const j = selectedJob();
  if (state.view === 'jobs' && j) {
    const tb = $('#tbody');
    if (tb) {
      for (const t of j.tracks) {
        const tr = tb.querySelector(`tr[data-track="${t.id}"]`);
        if (!tr) continue;
        const html = rowHtml(t);
        if (rowCache.get(t.id) !== html) { tr.innerHTML = html; rowCache.set(t.id, html); }
        tr.className = `track ${rowClass(t)}`;
      }
      // Filter-Zähler aktualisieren
      const tools = $('.tools'); if (tools) { const tmp = document.createElement('div'); tmp.innerHTML = renderTools(j); const inp = $('#search'); const focused = document.activeElement === inp; const val = inp?.value ?? state.search; tools.replaceWith(tmp.firstElementChild); const ni = $('#search'); if (ni) { ni.value = val; if (focused) { ni.focus(); ni.setSelectionRange(val.length, val.length); } } }
      const head = $('.job-head'); if (head) { const tmp = document.createElement('div'); tmp.innerHTML = renderJobHead(j); head.replaceWith(tmp.firstElementChild); }
    }
  }
  renderSidebar();
  renderStatus();
  if (state.panel) renderPanel();
}

function renderEmpty() {
  return `<div class="empty">
    <h2>Noch nichts zu sichern.</h2>
    <p>Kopiere einen Link aus Apple Music, Spotify oder YouTube Music und drücke <kbd>Strg</kbd> <kbd>V</kbd>. Ein Titel, ein Album oder eine ganze Playlist. Die Titel erscheinen hier, bevor etwas geladen wird.</p>
    <div class="keys"><span><kbd>Strg</kbd><kbd>V</kbd> Link einfügen</span><span><kbd>Enter</kbd> Sichern</span><span><kbd>Strg</kbd><kbd>O</kbd> Ordner wählen</span><span><kbd>↑</kbd><kbd>↓</kbd> Titel wählen</span><span><kbd>Esc</kbd> Panel schließen</span></div>
  </div>`;
}

function renderStatus() {
  const el = $('#statusbar');
  const run = state.jobs.find(j => j.status === 'running' || j.status === 'paused');
  const left = $('#st-left'), bar = $('#st-bar'), right = $('#st-right');
  if (run) {
    const n = run.tracks.length, done = run.tracks.filter(t => ['done', 'linked'].includes(t.status)).length;
    const act = run.tracks.filter(t => ['downloading', 'recording'].includes(t.status));
    const speed = act.reduce((a, t) => a + (t.status === 'downloading' ? t.speed : 0), 0);
    const leftN = run.tracks.filter(t => ['waiting', 'searching', 'downloading', 'tagging'].includes(t.status)).length;
    const rec = act.find(t => t.status === 'recording');
    const queued = state.jobs.filter(j => j.status === 'queued').length;
    left.innerHTML = `<b>${esc(run.name)}</b> · <span class="num">${done} von ${n}</span>${run.status === 'paused' ? ' · pausiert' : ''}${act.length ? ` · ${act.length} parallel` : ''}${speed ? ` · <span class="num">${de(speed.toFixed(1))} MB/s</span>` : ''}${rec ? ` · Aufnahme läuft` : ''}${leftN || rec ? ` · noch ${fmtEta(leftN * 9 + (rec ? rec.dur * (1 - rec.progress / 100) : 0))}` : ''}${queued ? ` · ${queued} Auftrag${queued > 1 ? 'e' : ''} wartet` : ''}`;
    bar.hidden = false; bar.firstElementChild.style.width = `${Math.round(jobProgress(run) * 100)}%`;
  } else {
    const ready = state.jobs.filter(j => j.status === 'ready').length;
    const rev = state.jobs.reduce((a, j) => a + j.tracks.filter(t => t.status === 'review').length, 0);
    left.innerHTML = ready ? `${ready} Auftrag${ready > 1 ? 'e' : ''} bereit · <kbd>Enter</kbd> startet` : rev ? `Nichts läuft · ${rev} Titel warten auf Prüfung` : 'Nichts läuft';
    bar.hidden = true;
  }
  const b = state.backend;
  right.innerHTML = `<span class="ver">yt-dlp ${b.ytdlp} · ${b.ytdlpOk ? 'aktuell' : '<span style="color:var(--warn)">Update verfügbar</span>'}</span>
    <span class="conn" title="${b.mode === 'demo' ? 'Kein Backend erreichbar, Oberfläche läuft mit Beispieldaten' : 'Verbunden mit dem lokalen Dienst'}"><span class="dot ${b.mode === 'demo' ? 'warn' : 'ok'}"></span>${b.mode === 'demo' ? 'Demo-Modus' : 'Verbunden'}</span>`;
  el.hidden = false;
}

/* ---------- Seitenpanel ---------- */
function renderPanel() {
  const el = $('#panel');
  if (!state.panel) { el.hidden = true; el.innerHTML = ''; return; }
  const t = findTrack(state.panel.trackId);
  if (!t) { state.panel = null; el.hidden = true; return; }
  if (!t.candidates) t.candidates = candidatesFor(t);
  const why = t.title === 'Dreams' ? 'Zwei Treffer sind gleich gut: das Original-Album von 1977 und der Remaster von 2004. Dauer und Kanal sind identisch, nur der Albumname weicht ab.'
    : t.title === 'Redbone' ? 'Der beste Treffer stammt vom offiziellen Kanal, aber eine bearbeitete Fassung erreicht einen ähnlichen Titel-Score. Zur Sicherheit kurz anhören.'
    : 'Der beste Treffer weicht in der Dauer ab oder stammt nicht vom offiziellen Kanal.';
  const diffTxt = d => d === 0 ? `<span class="zero">±0 s</span>` : `<span class="${Math.abs(d) > 5 ? 'plus' : ''}">${d > 0 ? '+' : '−'}${Math.abs(d)} s</span>`;
  const scoreColor = s => s >= 85 ? 'var(--ok)' : s >= 60 ? 'var(--warn)' : 'var(--err)';
  const pv = state.preview;
  el.hidden = false;
  el.innerHTML = `
    <div class="panel-head">${ico('alert')}<h2>Treffer prüfen</h2><span class="faint">${t.nr} von ${jobOf(t)?.tracks.length}</span><button class="btn btn-sm btn-icon btn-ghost" data-act="panel-close" aria-label="Schließen">${ico('x')}</button></div>
    <div class="panel-body">
      <div class="orig"><span class="cover" style="${coverStyle(t.album)}">${esc(t.album[0])}</span><div><div class="ttl">${esc(t.title)}</div><div class="sub">${esc(t.artist)} · ${esc(t.album)} · ${t.year}</div><div class="sub num">${fmtDur(t.dur)} · ISRC vorhanden · Quelle: ${SRC[jobOf(t)?.source || 'apple'].label}</div></div></div>
      <div class="why">${ico('info', 'sm')}<span>${why}</span></div>
      <div class="cands">${t.candidates.map((c, i) => `
        <div class="cand ${t.chosen?.id === c.id ? 'is-chosen' : ''}" data-cand="${c.id}">
          <span class="k">${i + 1}</span>
          <div class="ct" title="${esc(c.title)}">${esc(c.title)}</div>
          <div class="cb">
            <button class="btn btn-sm prev ${pv?.id === c.id ? 'is-playing' : ''}" data-act="preview" data-cand="${c.id}" title="10 Sekunden anhören">${ico(pv?.id === c.id ? 'stop' : 'headphones', 'sm')}<span class="bar" style="width:${pv?.id === c.id ? pv.pct : 0}%"></span></button>
            <button class="btn btn-sm ${i === 0 ? 'btn-primary' : ''}" data-act="choose" data-cand="${c.id}">Übernehmen</button>
          </div>
          <div class="cs"><span>${esc(c.channel)}</span><span class="num">${fmtDur(c.dur)} ${diffTxt(c.diff)}</span><span>${esc(c.q)}</span>${c.flags.map(f => `<span class="flag ${/Live|Bearbeitet/.test(f) ? 'bad' : /Offiziell/.test(f) ? 'good' : ''}">${esc(f)}</span>`).join('')}<span class="score"><i><b style="width:${c.score}%;--c:${scoreColor(c.score)}"></b></i><span class="num">${c.score} %</span></span></div>
        </div>`).join('')}
      </div>
      <div class="note">Tasten <kbd>1</kbd> bis <kbd>4</kbd> übernehmen direkt. Tags und Cover kommen in jedem Fall aus der Playlist, nicht von YouTube.${state.backend.mode === 'demo' ? ' Im Demo-Modus ist Vorhören stumm.' : ''}</div>
    </div>
    <div class="panel-foot">
      <button class="btn" data-act="use-rec" title="Exakte Kopie des Streams, dauert ${fmtDur(t.dur)}">${ico('mic', 'sm')} Als Recorder laden <span class="muted num">· ${fmtDur(t.dur)}</span></button>
      <button class="btn btn-ghost" data-act="skip">Überspringen</button>
    </div>`;
}
function findTrack(id) { for (const j of state.jobs) { const t = j.tracks.find(t => t.id === id); if (t) return t; } return null; }

/* ---------- Menüs ---------- */
function renderMenu() {
  const el = $('#menu');
  if (!state.menu) { el.hidden = true; el.innerHTML = ''; return; }
  const m = state.menu;
  el.hidden = false;
  if (m.type === 'row') {
    const t = findTrack(m.trackId); if (!t) { state.menu = null; el.hidden = true; return; }
    const done = ['done', 'linked'].includes(t.status);
    el.innerHTML = `
      <div class="mh">${esc(t.title)}</div>
      <button data-act="retry" ${t.status === 'downloading' ? 'disabled' : ''}>${ico('refresh')} Erneut laden</button>
      <button data-act="review">${ico('shuffle')} Anderen Treffer wählen</button>
      <button data-act="use-rec" ${t.engine === 'rec' && !done ? 'disabled' : ''}>${ico('mic')} Als Recorder laden <span class="faint num">${fmtDur(t.dur)}</span></button>
      <hr>
      <button data-act="show-file" ${done ? '' : 'disabled'}>${ico('folderOpen')} Datei im Explorer zeigen</button>
      <button data-act="copy-link">${ico('copy')} Link kopieren</button>
      <hr>
      <button data-act="remove-track" class="danger">${ico('trash')} Aus Auftrag entfernen</button>`;
  } else if (m.type === 'job') {
    const j = selectedJob(); if (!j) { state.menu = null; el.hidden = true; return; }
    el.innerHTML = `
      <div class="mh">${esc(j.name)}</div>
      ${j.kind === 'playlist' ? `<button data-act="toggle-sub">${ico('repeat')} ${j.subscribe ? 'Abo beenden' : 'Abo: Ordner synchron halten'}</button>` : ''}
      <button data-act="restart">${ico('refresh')} Alles erneut sichern</button>
      <button data-act="copy-link">${ico('copy')} Link kopieren</button>
      <button data-act="export-csv">${ico('file')} Titelliste als CSV</button>
      <hr>
      <button data-act="remove-job" class="danger">${ico('trash')} Aus Liste entfernen <span class="faint">Dateien bleiben</span></button>`;
  } else if (m.type === 'folder') {
    const s = state.settings;
    el.innerHTML = `
      <div class="mh">Zielordner</div>
      ${s.recent.map(p => `<label class="row"><input type="radio" name="folder" value="${esc(p)}" ${p === s.folder ? 'checked' : ''}><span class="path">${esc(p)}</span></label>`).join('')}
      <hr>
      ${m.custom ? `<div class="inline-input"><input class="ctl mono" id="customFolder" placeholder="D:\\Musik\\…" value="${esc(s.folder)}"><button class="btn btn-sm btn-primary" data-act="folder-set">OK</button></div>` : `<button data-act="folder-custom">${ico('folder')} Anderen Ordner wählen …</button>`}`;
  }
  el.style.left = '0px'; el.style.top = '0px';
  const r = el.getBoundingClientRect();
  let x = m.x, y = m.y;
  if (x + r.width > window.innerWidth - 8) x = Math.max(8, window.innerWidth - r.width - 8);
  if (y + r.height > window.innerHeight - 8) y = Math.max(8, m.y - r.height - 4);
  el.style.left = `${x}px`; el.style.top = `${y}px`;
  if (m.custom) { const i = $('#customFolder'); i?.focus(); i?.select(); }
}
function openMenu(type, anchor, extra = {}) {
  const r = anchor.getBoundingClientRect();
  state.menu = { type, x: r.left, y: r.bottom + 4, ...extra };
  renderMenu();
}

/* ---------- Toast ---------- */
let toastTimer = null;
function toast(title, sub = '', icon = 'checkCircle', action = null) {
  state.toast = { title, sub, icon, action };
  renderToast();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { state.toast = null; renderToast(); }, 6500);
}
function renderToast() {
  const el = $('#toast');
  if (!state.toast) { el.hidden = true; return; }
  const t = state.toast;
  el.hidden = false;
  el.innerHTML = `${ico(t.icon)}<div class="t"><div>${esc(t.title)}</div>${t.sub ? `<small class="mono">${esc(t.sub)}</small>` : ''}</div>${t.action ? `<button class="btn btn-sm" data-act="toast-action">${esc(t.action.label)}</button>` : ''}<button class="btn btn-sm btn-icon btn-ghost" data-act="toast-close" aria-label="Schließen">${ico('x', 'sm')}</button>`;
}

/* ---------- Verlauf ---------- */
function renderHistory() {
  const rows = state.history.map(h => `<tr>
    <td class="num muted" style="white-space:nowrap">${esc(h.date)}</td>
    <td><div style="font-weight:500">${esc(h.name)}</div>${h.note ? `<div class="faint" style="font-size:12px">${esc(h.note)}</div>` : ''}</td>
    <td><span class="tag ${SRC[h.source].cls}">${SRC[h.source].label}</span> <span class="muted">${KIND[h.kind]}</span></td>
    <td class="num">${h.n ? `${h.n} Titel` : '<span class="faint">–</span>'}</td>
    <td class="path" title="${esc(h.folder)}">${esc(h.folder)}</td>
    <td class="acts"><button class="btn btn-sm btn-ghost" data-act="hist-open" data-path="${esc(h.folder)}">${ico('folderOpen', 'sm')} Ordner</button> <button class="btn btn-sm btn-ghost" data-act="hist-again" data-name="${esc(h.name)}" data-source="${h.source}" data-kind="${h.kind}">${ico('refresh', 'sm')} Erneut</button></td>
  </tr>`).join('');
  return `<div class="page"><h1>Verlauf</h1><p class="lead">Alles, was gesichert wurde, mit Ort und Zeit. „Erneut“ legt den Auftrag mit denselben Einstellungen neu an, bereits vorhandene Titel werden verknüpft statt neu geladen.</p>
    <div style="overflow-x:auto"><table class="hist"><thead><tr><th>Wann</th><th>Auftrag</th><th>Quelle</th><th>Umfang</th><th>Ordner</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

/* ---------- Einstellungen ---------- */
function renderSettings() {
  const s = state.settings, b = state.backend;
  const sw = (key, label = '') => `<label class="toggle ${s[key] ? '' : 'is-off'}"><button class="switch" role="switch" aria-checked="${s[key]}" data-toggle="${key}"></button>${label ? `<span>${label}</span>` : ''}</label>`;
  const row = (label, small, ctl) => `<div class="srow"><div class="sl">${label}${small ? `<small>${small}</small>` : ''}</div><div class="sc">${ctl}</div></div>`;
  const sel = (id, key, opts) => `<select class="ctl" id="${id}" data-setting="${key}">${Object.entries(opts).map(([v, l]) => `<option value="${v}" ${s[key] === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  return `<div class="page settings">
    <h1>Einstellungen</h1><p class="lead">Standardwerte für neue Aufträge. Jeder Auftrag kann davon abweichen, über „Mehr“ in der Eingabeleiste.</p>

    <div class="sgroup"><h2>Speicherort</h2>
      ${row('Standardordner', 'Wird gemerkt, zuletzt benutzte Ordner stehen im Auswahlmenü', `<input class="ctl mono" id="s-folder" data-setting="folder" value="${esc(s.folder)}"><button class="btn" data-act="folder-dialog">${ico('folder', 'sm')} Wählen …</button>`)}
      ${row('Schema Playlist / Titel', 'Platzhalter: {Playlist} {Nr} {Artist} {Titel} {Album} {Jahr}', `<input class="ctl mono" id="s-scheme" data-setting="scheme" value="${esc(s.scheme)}"><span class="note preview">${previewName(s.scheme, sampleTrack(), s.format)}</span>`)}
      ${row('Schema Album', '', `<input class="ctl mono" id="s-schemeAlbum" data-setting="schemeAlbum" value="${esc(s.schemeAlbum)}"><span class="note preview">${previewName(s.schemeAlbum, sampleTrack(), s.format)}</span>`)}
    </div>

    <div class="sgroup"><h2>Audio</h2>
      ${row('Format', '„Original behalten“ speichert, was die Quelle liefert, ohne Umkodierung', sel('s-format', 'format', FORMATS))}
      ${row('Lautstärke angleichen', 'ReplayGain-Tags statt Umkodierung, Datei bleibt original', sw('replaygain'))}
      ${row('Liedtexte', 'Synchronisierte .lrc neben der Datei und eingebettet (LRCLIB)', sw('lyrics'))}
      ${row('Playlist-Datei', '.m3u8 mit relativen Pfaden im Zielordner', sw('m3u'))}
    </div>

    <div class="sgroup"><h2>Engines</h2>
      <p class="desc">Der Matcher sucht jeden Titel bei YouTube Music und lädt ihn in Sekunden. Der Recorder schneidet die Wiedergabe im Browser mit, exakt, aber in Echtzeit.</p>
      ${row('Standard-Engine', '', `<div class="seg" data-seg="engine"><button aria-pressed="${s.engine === 'auto'}" data-val="auto">Automatisch</button><button aria-pressed="${s.engine === 'match'}" data-val="match">Matcher</button><button aria-pressed="${s.engine === 'rec'}" data-val="rec">Recorder</button></div>`)}
      ${row('Parallele Downloads', 'Mehr als 3 führt bei YouTube oft zu Drosselung', `<div class="stepper"><button data-step="-1" aria-label="weniger">${ico('minus', 'sm')}</button><output>${s.parallel}</output><button data-step="1" aria-label="mehr">${ico('plus', 'sm')}</button></div>`)}
      ${row('Aufnahmegerät', 'Für exakte Aufnahmen 44,1 kHz / 16 Bit in Windows einstellen', `<select class="ctl" id="s-device"><option>${esc(s.device)}</option><option>CABLE Output (VB-Audio Virtual Cable) · 44,1 kHz</option></select><span class="note">Aktuell 48 kHz: Windows rechnet 44,1-kHz-Material um. <a href="#" data-act="fix-rate" style="color:var(--accent)">Auf 44,1 kHz umstellen</a></span>`)}
      ${row('Stille-Modus', 'Andere Programme während der Aufnahme stummschalten, danach wiederherstellen', sw('silence'))}
      ${row('Nachtmodus', 'Rechner wach halten, Monitor aus, Benachrichtigung am Ende', sw('night'))}
    </div>

    <div class="sgroup"><h2>Zugang</h2>
      ${row('YouTube-Cookies', 'Für 256 kbps mit YouTube Premium und gegen „Bist du ein Bot?“', `${sel('s-cookies', 'cookies', { none: 'Keine', firefox: 'Aus Firefox lesen', file: 'cookies.txt-Datei' })}${s.cookies === 'file' ? `<input class="ctl mono" id="s-cookiefile" placeholder="C:\\…\\cookies.txt">` : ''}
        <div class="callout">${ico('info')}<div><b>Chrome und Edge gehen nicht.</b> Beide verschlüsseln Cookies seit 2024 so, dass der Downloader nicht darankommt. Firefox funktioniert direkt. Für Chrome: Erweiterung „Get cookies.txt LOCALLY“, Datei exportieren und hier angeben.</div></div>`)}
      ${row('Spotify', 'Öffentliche Playlists gehen ohne Anmeldung. Private Playlists: in Spotify auf „Öffentlich“ stellen oder einmalig anmelden', `<button class="btn">${ico('external', 'sm')} Bei Spotify anmelden</button><span class="faint">nicht angemeldet</span>`)}
    </div>

    <div class="sgroup"><h2>Updates</h2>
      ${row('Downloader (yt-dlp)', 'YouTube ändert sich oft, der Downloader muss mitziehen', `<span class="mono">${b.ytdlp}</span><span class="tag done">${ico('check', 'sm')} aktuell</span><button class="btn btn-sm" data-act="check-update">${ico('refresh', 'sm')} Jetzt prüfen</button>`)}
      ${row('Automatisch aktualisieren', 'Beim Start prüfen, höchstens einmal pro Woche', sw('autoUpdate'))}
    </div>

    <div class="sgroup"><h2>Allgemein</h2>
      ${row('Zwischenablage beobachten', 'Kopierte Musik-Links werden oben angeboten, nie automatisch geladen', sw('clipboardWatch'))}
      ${row('Benachrichtigungen', 'Windows-Meldung, wenn ein Auftrag fertig ist', sw('notify'))}
      ${row('Browser beim Start öffnen', '', sw('openBrowser'))}
      ${row('Sprache', '', sel('s-lang', 'lang', { de: 'Deutsch', en: 'English' }))}
    </div>

    <div class="sgroup"><h2>Über</h2>
      ${row('musicA SaveIt', `Version ${b.version} · portabel, Konfiguration liegt neben der EXE`, `<span class="mono muted">http://127.0.0.1:8731</span><button class="btn btn-sm btn-ghost" data-act="copy-url">${ico('copy', 'sm')} URL kopieren</button>`)}
      ${row('Werkzeuge', 'Mitgeliefert, keine Installation nötig', `<span class="mono muted">ffmpeg 7.1 · yt-dlp ${b.ytdlp} · ytmusicapi 1.10 · mutagen 1.47</span>`)}
    </div>
  </div>`;
}

/* ======================= Aktionen ======================= */
function addFromLink(url, parsed, opts = {}) {
  const job = api.addJob(url, parsed);
  state.selectedJobId = job.id; state.selectedTrackId = null; state.view = 'jobs'; state.filter = 'all'; state.search = '';
  state.link = { url: '', parsed: null, error: '' }; $('#link').value = '';
  if (opts.start || state.settings.startNow) api.start(job);
  render();
  if (!opts.start && !state.settings.startNow) $('#saveBtn').focus();
}
function handleLinkInput(val) {
  state.link.url = val;
  const p = parseLink(val);
  state.link.parsed = p && !p.error ? p : null;
  state.link.error = p?.error || '';
  renderTop();
}
function submitLink() {
  if (state.link.url && state.link.parsed) { addFromLink(state.link.url, state.link.parsed); return; }
  const j = selectedJob();
  if (j && j.status === 'ready') { api.start(j); render(); }
}
function selectJob(id) { state.selectedJobId = id; state.selectedTrackId = null; state.view = 'jobs'; state.filter = 'all'; state.search = ''; state.panel = null; state.sidebarOpen = false; render(); }
function openReview(t) { state.panel = { type: 'review', trackId: t.id }; state.selectedTrackId = t.id; render(); }
function closePanel() { state.panel = null; stopPreview(); render(); }
let previewTimer = null;
function startPreview(id) {
  stopPreview();
  state.preview = { id, pct: 0 };
  previewTimer = setInterval(() => { state.preview.pct += 2; if (state.preview.pct >= 100) stopPreview(); renderPanel(); }, 200);
  renderPanel();
}
function stopPreview() { clearInterval(previewTimer); previewTimer = null; state.preview = null; }
function copyText(txt, label) {
  const ok = () => toast('Kopiert', label || txt, 'copy');
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(txt).then(ok, () => toast('Konnte nicht kopieren', txt, 'alert'));
  else toast('Kopieren nicht möglich', txt, 'alert');
}

/* ======================= Ereignisse ======================= */
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-act], [data-job], [data-view], [data-filter], [data-toggle], [data-seg] button, [data-step], [data-cand]');
  const inMenu = e.target.closest('#menu');
  if (!inMenu && state.menu && !e.target.closest('[data-act="rowmenu"],[data-act="jobmenu"],[data-act="folder"]')) { state.menu = null; renderMenu(); }
  if (!btn) return;

  if (btn.dataset.job) { selectJob(btn.dataset.job); return; }
  if (btn.dataset.view) { state.view = btn.dataset.view; state.panel = null; state.sidebarOpen = false; render(); return; }
  if (btn.dataset.filter) { state.filter = btn.dataset.filter; const j = selectedJob(); if (j) { renderMain(); } return; }
  if (btn.dataset.toggle) {
    const k = btn.dataset.toggle; state.settings[k] = !state.settings[k];
    const j = selectedJob();
    if (k === 'subscribe' && j && j.kind === 'playlist' && j.status === 'ready') j.subscribe = state.settings[k];
    render(); return;
  }
  if (btn.dataset.step) { state.settings.parallel = clamp(state.settings.parallel + Number(btn.dataset.step), 1, 4); render(); return; }
  if (btn.parentElement?.dataset.seg) { state.settings[btn.parentElement.dataset.seg] = btn.dataset.val; const j = selectedJob(); if (j && j.status === 'ready') j.engine = btn.dataset.val; render(); return; }

  const act = btn.dataset.act;
  const j = selectedJob();
  const tr = e.target.closest('tr[data-track]');
  const tFromRow = tr ? findTrack(tr.dataset.track) : null;
  const tFromMenu = state.menu?.trackId ? findTrack(state.menu.trackId) : null;
  const tFromPanel = state.panel ? findTrack(state.panel.trackId) : null;
  const t = tFromRow || tFromMenu || tFromPanel;

  switch (act) {
    case 'toggle-sidebar': if (window.innerWidth <= 900) state.sidebarOpen = !state.sidebarOpen; else state.sidebarCollapsed = !state.sidebarCollapsed; render(); break;
    case 'close-sidebar': state.sidebarOpen = false; render(); break;
    case 'more': state.optionsOpen = !state.optionsOpen; render(); break;
    case 'submit': submitLink(); break;
    case 'folder': openMenu('folder', btn); break;
    case 'folder-custom': state.menu.custom = true; renderMenu(); break;
    case 'folder-set': { const v = $('#customFolder')?.value.trim(); if (v) { state.settings.folder = v; if (!state.settings.recent.includes(v)) state.settings.recent.unshift(v); if (j && j.status === 'ready') j.folder = v; } state.menu = null; render(); break; }
    case 'folder-dialog': toast('Ordnerdialog', 'Im Demo-Modus gibt es keinen Windows-Dialog. Pfad direkt eintragen.', 'folder'); break;
    case 'clip-add': { const c = state.clip; state.clip = null; addFromLink(c.url, { source: c.source, kind: c.kind, name: c.name }); break; }
    case 'clip-dismiss': state.clip = null; render(); break;
    case 'start': if (j) { api.start(j); render(); } break;
    case 'pause': if (j) { api.pause(j); render(); } break;
    case 'cancel': if (j) { api.cancel(j); render(); } break;
    case 'open': if (j) api.openFolder(j.folder + '\\' + sanitize(j.name)); break;
    case 'm3u': if (j) api.openFolder(j.folder + '\\' + sanitize(j.name) + '\\playlist.m3u8'); break;
    case 'jobmenu': openMenu('job', btn); break;
    case 'rowmenu': if (tFromRow) { state.selectedTrackId = tFromRow.id; openMenu('row', btn, { trackId: tFromRow.id }); patch(); } break;
    case 'review': if (t) { state.menu = null; openReview(t); } break;
    case 'retry': if (t) { state.menu = null; api.retry(t); render(); } break;
    case 'use-rec': if (t) { state.menu = null; api.useRecorder(t); if (state.panel) closePanel(); else render(); toast('Recorder eingeplant', `${t.title} · ${fmtDur(t.dur)} Echtzeit, läuft nach den Downloads`, 'mic'); } break;
    case 'skip': if (t) { api.skip(t); closePanel(); } break;
    case 'choose': { const c = t?.candidates?.find(c => c.id === btn.dataset.cand); if (t && c) { api.choose(t, c); stopPreview(); closePanel(); } break; }
    case 'preview': { const id = btn.dataset.cand; if (state.preview?.id === id) { stopPreview(); renderPanel(); } else startPreview(id); break; }
    case 'panel-close': closePanel(); break;
    case 'show-file': if (t) { api.openFolder(`${jobOf(t)?.folder}\\${sanitize(jobOf(t)?.name)}\\${pad2(t.nr)} - ${sanitize(t.artist)} - ${sanitize(t.title)}.m4a`); } state.menu = null; renderMenu(); break;
    case 'copy-link': { const jj = t ? jobOf(t) : j; if (jj) copyText(jj.url, 'Link'); state.menu = null; renderMenu(); break; }
    case 'copy-url': copyText('http://127.0.0.1:8731', 'Adresse der Oberfläche'); break;
    case 'remove-track': if (t) { api.removeTrack(jobOf(t), t); state.menu = null; render(); } break;
    case 'toggle-sub': if (j) { api.toggleSub(j); state.menu = null; render(); toast(j.subscribe ? 'Abo aktiv' : 'Abo beendet', j.subscribe ? `„${j.name}“ wird täglich geprüft, neue Titel kommen automatisch dazu` : '', 'repeat'); } break;
    case 'restart': if (j) { j.tracks.forEach(x => { x.status = 'waiting'; x.progress = 0; x.quality = null; }); j.status = 'ready'; api.start(j); state.menu = null; render(); } break;
    case 'export-csv': state.menu = null; renderMenu(); toast('CSV geschrieben', `${j?.folder}\\${sanitize(j?.name || '')}\\titel.csv`, 'file'); break;
    case 'remove-job': if (j) { api.remove(j); state.menu = null; render(); } break;
    case 'hist-open': api.openFolder(btn.dataset.path); break;
    case 'hist-again': addFromLink('', { source: btn.dataset.source, kind: btn.dataset.kind, name: btn.dataset.name }); break;
    case 'check-update': api.checkUpdate(); break;
    case 'fix-rate': e.preventDefault(); state.settings.device = 'Lautsprecher (Realtek High Definition Audio) · 44,1 kHz'; render(); toast('Ausgabegerät umgestellt', '44,1 kHz / 16 Bit', 'checkCircle'); break;
    case 'toast-action': state.toast?.action?.run(); state.toast = null; renderToast(); break;
    case 'toast-close': state.toast = null; renderToast(); break;
  }
});

// Zeile auswählen (Klick auf Zeile, nicht auf Buttons)
document.addEventListener('click', e => {
  const tr = e.target.closest('tr[data-track]');
  if (!tr || e.target.closest('button')) return;
  state.selectedTrackId = tr.dataset.track; patch();
});
document.addEventListener('dblclick', e => {
  const tr = e.target.closest('tr[data-track]'); if (!tr) return;
  const t = findTrack(tr.dataset.track); if (!t) return;
  if (t.status === 'review') openReview(t);
  else if (['done', 'linked'].includes(t.status)) api.openFolder(`${jobOf(t)?.folder}\\${sanitize(jobOf(t)?.name)}`);
});

document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'link') { handleLinkInput(el.value); return; }
  if (el.id === 'search') { state.search = el.value; const j = selectedJob(); if (j) { rowCache = new Map(); renderRows(j); } return; }
  if (el.id === 'scheme') { const kindNow = state.link.parsed?.kind || selectedJob()?.kind || 'playlist'; state.settings[kindNow === 'album' ? 'schemeAlbum' : 'scheme'] = el.value; $('#optsbar .preview').innerHTML = previewName(el.value, sampleTrack(), state.settings.format); return; }
  if (el.dataset.setting) { state.settings[el.dataset.setting] = el.value; if (el.tagName === 'SELECT') render(); else { const p = el.parentElement.querySelector('.preview'); if (p) p.innerHTML = previewName(el.value, sampleTrack(), state.settings.format); } return; }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'format') { state.settings.format = el.value; const j = selectedJob(); if (j && j.status === 'ready') j.format = el.value; render(); }
  if (el.name === 'folder') { state.settings.folder = el.value; const j = selectedJob(); if (j && j.status === 'ready') j.folder = el.value; state.menu = null; render(); }
});

document.addEventListener('keydown', e => {
  const inField = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName);
  if (e.key === 'Escape') { if (state.menu) { state.menu = null; renderMenu(); } else if (state.panel) closePanel(); else if (state.sidebarOpen) { state.sidebarOpen = false; render(); } else if (document.activeElement?.id === 'link') document.activeElement.blur(); return; }
  if (e.key === 'Enter' && document.activeElement?.id === 'link') { e.preventDefault(); submitLink(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') { e.preventDefault(); openMenu('folder', $('#folderBtn')); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') { e.preventDefault(); $('#link').focus(); return; }
  if (state.panel && !inField && /^[1-4]$/.test(e.key)) { const t = findTrack(state.panel.trackId); const c = t?.candidates?.[Number(e.key) - 1]; if (t && c) { api.choose(t, c); stopPreview(); closePanel(); } return; }
  if (inField) return;
  const j = selectedJob();
  if (!j || state.view !== 'jobs') return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const list = visibleTracks(j); if (!list.length) return;
    let i = list.findIndex(t => t.id === state.selectedTrackId);
    i = e.key === 'ArrowDown' ? Math.min(list.length - 1, i + 1) : Math.max(0, i - 1);
    state.selectedTrackId = list[i].id; patch();
    $(`tr[data-track="${list[i].id}"]`)?.scrollIntoView({ block: 'nearest' });
    if (state.panel && list[i].status === 'review') { state.panel.trackId = list[i].id; stopPreview(); renderPanel(); }
  }
  if (e.key === 'Enter') { const t = findTrack(state.selectedTrackId); if (t?.status === 'review') openReview(t); else if (j.status === 'ready') { api.start(j); render(); } }
  if (e.key === ' ' && ['running', 'paused'].includes(j.status)) { e.preventDefault(); api.pause(j); render(); }
});

// Strg+V überall: Link aus der Zwischenablage übernehmen
document.addEventListener('paste', e => {
  if (document.activeElement?.id === 'link') return;
  if (/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)) return;
  const txt = (e.clipboardData?.getData('text') || '').trim();
  const p = parseLink(txt);
  if (p && !p.error) { e.preventDefault(); addFromLink(txt, p); }
  else if (txt) { $('#link').value = txt; handleLinkInput(txt); $('#link').focus(); }
});
// Drag & Drop eines Links
['dragenter', 'dragover'].forEach(ev => document.addEventListener(ev, e => { e.preventDefault(); $('#linkbox').classList.add('is-drop'); }));
['dragleave', 'drop'].forEach(ev => document.addEventListener(ev, e => { if (ev === 'drop') e.preventDefault(); if (ev === 'dragleave' && e.relatedTarget) return; $('#linkbox').classList.remove('is-drop'); }));
document.addEventListener('drop', e => {
  const txt = (e.dataTransfer?.getData('text/uri-list') || e.dataTransfer?.getData('text') || '').split('\n')[0].trim();
  const p = parseLink(txt);
  if (p && !p.error) addFromLink(txt, p); else if (txt) { $('#link').value = txt; handleLinkInput(txt); }
});
window.addEventListener('resize', () => { if (window.innerWidth > 900 && state.sidebarOpen) { state.sidebarOpen = false; render(); } });

/* ======================= Start ======================= */
async function probeBackend() {
  if (location.protocol === 'file:') return;
  try {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 1200);
    const r = await fetch('api/health', { signal: ctrl.signal, cache: 'no-store' }); clearTimeout(to);
    if (r.ok) { const d = await r.json(); if (d && d.ok) { state.backend.mode = 'live'; state.backend.ytdlp = d.ytdlp || state.backend.ytdlp; state.backend.version = d.version || state.backend.version; } }
  } catch { /* kein Backend: Demo */ }
}
function boot() {
  state.jobs = demoJobs();
  state.selectedJobId = state.jobs[0].id;
  render();
  setInterval(tick, 300);
  // Zwischenablage-Wächter (Demo): nach kurzer Zeit ein erkannter Link
  setTimeout(() => { if (state.settings.clipboardWatch && !state.clip) { state.clip = { name: 'Roadtrip', count: 23, source: 'apple', kind: 'playlist', url: 'https://music.apple.com/de/playlist/roadtrip/pl.u-2aoqXmNT6E9b' }; renderClip(); } }, 9000);
  probeBackend().then(renderStatus);
}
boot();
})();
