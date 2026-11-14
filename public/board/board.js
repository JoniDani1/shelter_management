// Public board for U-Bahn station displays. Subscribes to live data (see
// /shared/data.js) and re-renders on every change. Staleness is re-checked
// every few seconds locally, so rows turn "Unknown" on time even if the
// connection is down.
//
// Layout:
//   - Main area: only shelters that have a free bed right now (Available,
//     then Limited, each alphabetical). One big number per shelter.
//   - "No beds now" strip: shelters that are full, closed or have no recent
//     update, as names only. They still matter (so people don't walk there),
//     but they don't need a full row.
//   - With many shelters the main area uses two columns and rotates through
//     pages automatically; a display has no touch or scroll.
import { loadData } from '/shared/data.js';

const data = await loadData();

const rowsEl = document.getElementById('rows');
const noBedsEl = document.getElementById('nobeds');
const noBedsListEl = document.getElementById('nobeds-list');
const pagesEl = document.getElementById('pages');
const connEl = document.getElementById('conn');
const timeEl = document.getElementById('time');
const { shelterStatus } = window.TonightStatus;

const TZ = 'Europe/Berlin';
const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });

const ROWS_PER_COLUMN = 6;
const PAGE_SECONDS = 12;
const STATUS_ORDER = { available: 0, limited: 1 };
const NO_BEDS_LABEL = { full: 'full', closed: 'closed', unknown: 'no update' };
const NO_BEDS_ORDER = { full: 0, closed: 1, unknown: 2 };
const WHO = { women: 'Women only', men: 'Men only', families: 'Families' };

let staleAfterMs = 30 * 60 * 1000;
let shelters = null;
let page = 0;
let pageTimer = null;
const lastShown = new Map(); // id -> last rendered count, to animate changes

data.getConfig().then((cfg) => {
  staleAfterMs = cfg.staleAfterMinutes * 60 * 1000;
  render();
}).catch(() => {});

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

const byName = (a, b) => a.name.localeCompare(b.name, 'de');

// Minutes since midnight in Berlin.
function berlinMinutes(now) {
  const [h, m] = timeFmt.format(now).split(':').map(Number);
  return h * 60 + m;
}
const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
};

// "opens 19:00" if the shelter's doors are not open yet, otherwise nothing:
// at night the doors are open, so the hours are noise on the board.
function opensLabel(s, now) {
  if (s.open24h || !s.opensAt || !s.closesAt) return '';
  const open = toMinutes(s.opensAt);
  const close = toMinutes(s.closesAt);
  if (open === close || (open === 0 && close >= 24 * 60)) return ''; // 24/7
  const t = berlinMinutes(now);
  const isOpen = open < close ? t >= open && t < close : t >= open || t < close;
  return isOpen ? '' : `opens ${s.opensAt}`;
}

// "S+U Rathaus Steglitz" -> { lines: ["S", "U"], name: "Rathaus Steglitz" }
function station(s) {
  // Either a string ("S+U Rathaus Steglitz") or { name, type }.
  const raw = typeof s.nearestStation === 'string' ? s.nearestStation : s.nearestStation?.name;
  if (!raw) return null;
  const m = String(raw).match(/^((?:S\+U|U\+S|U|S)\s+)?(.*)$/);
  return { lines: (m[1] || '').split(/[+\s]+/).filter(Boolean), name: m[2] };
}

function rowFor(s, status, now) {
  const li = el('li', `row ${status.key}`);

  const count = el('div', 'count');
  const n = el('b', null, String(s.freeBeds));
  if (lastShown.has(s.id) && lastShown.get(s.id) !== n.textContent) n.classList.add('flip');
  lastShown.set(s.id, n.textContent);
  count.append(n, el('small', null, s.freeBeds === 1 ? 'bed' : 'beds'));

  const info = el('div', 'info');
  info.append(el('div', 'name', s.name));

  const meta = el('div', 'meta');
  const who = WHO[s.admits];
  if (who) meta.append(el('span', `who who-${s.admits}`, who));
  const st = station(s);
  if (st) {
    const where = el('span', 'where');
    for (const line of st.lines) {
      where.append(el('i', `line line-${line.toLowerCase()}`, line));
    }
    where.append(document.createTextNode(st.name));
    meta.append(where);
  } else if (s.district) {
    meta.append(el('span', 'where', s.district));
  }
  const opens = opensLabel(s, now);
  if (opens) meta.append(el('span', 'opens', opens));
  info.append(meta);

  li.append(count, info);
  return li;
}

function layout(count) {
  const phone = window.matchMedia('(max-width: 700px)').matches;
  if (phone) return { columns: 1, perPage: Infinity };
  const wide = window.innerWidth / window.innerHeight >= 1.3;
  const columns = wide && count > ROWS_PER_COLUMN ? 2 : 1;
  return { columns, perPage: columns * ROWS_PER_COLUMN };
}

function render() {
  if (!shelters) return;
  const now = new Date();
  const withBeds = [];
  const noBeds = [];
  for (const s of shelters) {
    const status = shelterStatus(s, now.getTime(), staleAfterMs);
    if (status.key in STATUS_ORDER) withBeds.push({ s, status });
    else noBeds.push({ s, status });
  }
  withBeds.sort((a, b) => STATUS_ORDER[a.status.key] - STATUS_ORDER[b.status.key] || byName(a.s, b.s));
  noBeds.sort((a, b) => NO_BEDS_ORDER[a.status.key] - NO_BEDS_ORDER[b.status.key] || byName(a.s, b.s));

  // Main area, paged.
  const { columns, perPage } = layout(withBeds.length);
  const pages = Math.max(1, Math.ceil(withBeds.length / perPage));
  if (page >= pages) page = 0;
  rowsEl.style.setProperty('--columns', columns);
  rowsEl.replaceChildren();
  if (withBeds.length === 0) {
    rowsEl.append(el('li', 'empty', shelters.length ? 'No free beds reported right now.' : 'No current information available.'));
  } else {
    for (const { s, status } of withBeds.slice(page * perPage, (page + 1) * perPage)) {
      rowsEl.append(rowFor(s, status, now));
    }
  }

  pagesEl.replaceChildren();
  if (pages > 1) {
    pagesEl.append(el('span', 'pages-label', `${page + 1} / ${pages}`));
    for (let i = 0; i < pages; i++) pagesEl.append(el('i', i === page ? 'on' : null));
  }

  // "No beds now" strip.
  noBedsEl.hidden = noBeds.length === 0;
  noBedsListEl.replaceChildren();
  for (const { s, status } of noBeds) {
    const item = el('span', `nb ${status.key}`);
    item.append(el('span', 'nb-name', s.name), el('em', null, NO_BEDS_LABEL[status.key]));
    noBedsListEl.append(item);
  }

  schedulePaging(pages);
}

function schedulePaging(pages) {
  if (pages > 1 && !pageTimer) {
    pageTimer = setInterval(() => { page += 1; render(); }, PAGE_SECONDS * 1000);
  } else if (pages <= 1 && pageTimer) {
    clearInterval(pageTimer);
    pageTimer = null;
  }
}

function tickClock() {
  timeEl.textContent = timeFmt.format(new Date());
}

function setConn(state, text) {
  connEl.className = `conn ${state}`;
  connEl.textContent = text;
}

function connect() {
  data.subscribe(
    (list) => { shelters = list; render(); },
    (live) => live
      ? setConn('ok', 'Live')
      : setConn('down', 'Connection lost · last known data')
  );
}

tickClock();
setInterval(tickClock, 1000);
setInterval(render, 15000);
window.addEventListener('resize', render);
connect();
