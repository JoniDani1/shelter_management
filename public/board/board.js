// Public departure-style board. Subscribes to live data (see /shared/data.js)
// and re-renders on every change. Staleness is re-checked every few seconds
// locally, so rows turn "Unknown" on time even if the connection is down.
import { loadData } from '/shared/data.js';

const data = await loadData();

const rowsEl = document.getElementById('rows');
const connEl = document.getElementById('conn');
const timeEl = document.getElementById('time');
const dateEl = document.getElementById('date');
const { shelterStatus, admitsLabel, hoursLabel } = window.TonightStatus;

const TZ = 'Europe/Berlin';
const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
const dateFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });

let staleAfterMs = 30 * 60 * 1000;
let shelters = null;

// The display shows a fixed number of rows per page and flips through the
// pages like a departure board, so the text stays large with 20+ shelters.
// Phones (narrow screens) get the full list and scroll instead.
const ROWS_PER_PAGE = 7;
const PAGE_MS = 10000;
const narrow = window.matchMedia('(max-width: 700px)');
const pageEl = document.getElementById('page');
let page = 0;
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

function render() {
  if (!shelters) return;
  const now = Date.now();
  rowsEl.replaceChildren();

  if (shelters.length === 0) {
    rowsEl.append(el('li', 'empty', 'No current information available.'));
    return;
  }

  let visible = shelters;
  if (narrow.matches) {
    rowsEl.style.gridTemplateRows = '';
    pageEl.textContent = '';
  } else {
    const pages = Math.ceil(shelters.length / ROWS_PER_PAGE);
    page %= pages;
    visible = shelters.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);
    // Same row height on every page, also on the last, shorter one.
    rowsEl.style.gridTemplateRows = `repeat(${ROWS_PER_PAGE}, minmax(0, 1fr))`;
    pageEl.textContent = pages > 1 ? `Page ${page + 1} of ${pages}` : '';
  }

  for (const s of visible) {
    const status = shelterStatus(s, now, staleAfterMs);
    const li = el('li', `row ${status.key}`);

    const nameCell = el('div');
    const details = el('div', 'district');
    details.append(el('span', `admits admits-${s.admits || 'unknown'}`, admitsLabel(s.admits)));
    details.append(document.createTextNode(` · ${s.district}${hoursLabel(s) ? ` · ${hoursLabel(s)}` : ''}`));
    nameCell.append(el('div', 'name', s.name), details);

    const free = el('div', 'free');
    const count = el('b', null, status.showCount ? String(s.freeBeds) : '—');
    if (lastShown.has(s.id) && lastShown.get(s.id) !== count.textContent) count.classList.add('flip');
    lastShown.set(s.id, count.textContent);
    free.append(count);
    if (status.showCount) free.append(el('small', null, `/ ${s.totalBeds}`));

    const occ = el('div', 'occ');
    const bar = el('div', 'bar');
    const fill = el('i');
    const occupied = s.totalBeds - s.freeBeds;
    fill.style.width = status.showCount ? `${Math.round((occupied / s.totalBeds) * 100)}%` : '0%';
    bar.append(fill);
    occ.append(bar, el('span', null, status.showCount ? `${occupied} of ${s.totalBeds} beds taken` : `${s.totalBeds} beds`));

    const statusCell = el('div');
    statusCell.append(el('span', 'status', status.label));

    const updated = el('div', 'updated', timeFmt.format(new Date(s.updatedAt)));

    li.append(nameCell, free, occ, statusCell, updated);
    rowsEl.append(li);
  }
}

function tickClock() {
  const now = new Date();
  timeEl.textContent = timeFmt.format(now);
  dateEl.textContent = dateFmt.format(now);
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
      : setConn('down', 'Connection lost · showing last known data')
  );
}

tickClock();
setInterval(tickClock, 1000);
setInterval(render, 15000);
setInterval(() => { page += 1; render(); }, PAGE_MS);
narrow.addEventListener('change', render);
connect();
