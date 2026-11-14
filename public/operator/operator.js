// Operator page: plus/minus buttons per shelter. Listens to the same live
// stream as the board, so several operators stay in sync.
import { loadData } from '/shared/data.js';

const data = await loadData();

const cardsEl = document.getElementById('cards');
const filterEl = document.getElementById('filter');
const connEl = document.getElementById('conn');
const { shelterStatus, admitsLabel, hoursLabel } = window.TonightStatus;
const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' });

let staleAfterMs = 30 * 60 * 1000;
let shelters = [];
const cards = new Map(); // id -> { root, refs }
const errors = new Map();

data.getConfig().then((cfg) => {
  staleAfterMs = cfg.staleAfterMinutes * 60 * 1000;
}).catch(() => {});

// Remember the chosen shelter (?shelter=id in the URL, or the dropdown).
const params = new URLSearchParams(location.search);
let selected = params.get('shelter') || '';
try { selected = selected || localStorage.getItem('tonight.shelter') || ''; } catch (_) {}

filterEl.addEventListener('change', () => {
  selected = filterEl.value;
  try { localStorage.setItem('tonight.shelter', selected); } catch (_) {}
  render();
});

document.getElementById('reset').addEventListener('click', () => data.resetDemo());

async function act(id, request) {
  try {
    errors.delete(id);
    const updated = await request();
    // Apply right away; the stream will confirm shortly after.
    if (updated) shelters = shelters.map((s) => (s.id === id ? updated : s));
  } catch (err) {
    errors.set(id, err.message);
  }
  render();
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function buildCard(s) {
  const root = el('section', 'card');
  const head = el('div');
  const title = el('h2', null, s.name);
  const district = el('div', 'district', [admitsLabel(s.admits), s.district, hoursLabel(s)].filter(Boolean).join(' · '));
  head.append(title, district);

  const counter = el('div', 'counter');
  const minus = el('button', null, '−');
  minus.type = 'button';
  minus.setAttribute('aria-label', `One bed taken at ${s.name}`);
  minus.addEventListener('click', () => act(s.id, () => data.adjustFreeBeds(s.id, -1)));
  const value = el('div', 'value');
  const count = el('b');
  const totalBeds = el('span');
  value.append(count, totalBeds);
  const plus = el('button', null, '+');
  plus.type = 'button';
  plus.setAttribute('aria-label', `One bed freed at ${s.name}`);
  plus.addEventListener('click', () => act(s.id, () => data.adjustFreeBeds(s.id, 1)));
  counter.append(minus, value, plus);

  const hint = el('div', 'hint');
  hint.append(el('span', null, '− guest checked in'), el('span', null, 'bed freed +'));

  const meta = el('div', 'meta');
  const pill = el('span', 'pill');
  const updated = el('span', 'updated');
  meta.append(pill, updated);

  const actions = el('div', 'actions');
  const confirm = el('button', null, 'Confirm count');
  confirm.type = 'button';
  confirm.title = 'Count is still correct: refresh the "updated" time';
  confirm.addEventListener('click', () => act(s.id, () => data.confirm(s.id)));
  const admission = el('button');
  admission.type = 'button';
  admission.addEventListener('click', () => {
    const current = shelters.find((x) => x.id === s.id);
    act(s.id, () => data.setAdmissionOpen(s.id, !current.admissionOpen));
  });
  actions.append(confirm, admission);

  const error = el('div', 'error');
  error.setAttribute('role', 'alert');

  root.append(head, counter, hint, meta, actions, error);
  return { root, refs: { minus, plus, count, totalBeds, pill, updated, admission, error } };
}

function render() {
  // Keep the dropdown in sync with the shelter list.
  if (filterEl.options.length !== shelters.length + 1) {
    filterEl.replaceChildren(new Option('All shelters', ''));
    for (const s of shelters) filterEl.append(new Option(s.name, s.id));
  }
  if (selected && !shelters.some((s) => s.id === selected)) selected = '';
  filterEl.value = selected;

  const now = Date.now();
  const visible = shelters.filter((s) => !selected || s.id === selected);
  const order = [];
  for (const s of visible) {
    if (!cards.has(s.id)) cards.set(s.id, buildCard(s));
    const { root, refs } = cards.get(s.id);
    const status = shelterStatus(s, now, staleAfterMs);
    refs.count.textContent = s.freeBeds;
    refs.totalBeds.textContent = `free of ${s.totalBeds} beds`;
    refs.minus.disabled = s.freeBeds <= 0;
    refs.plus.disabled = s.freeBeds >= s.totalBeds;
    refs.pill.className = `pill ${status.key}`;
    refs.pill.textContent = `Board shows: ${status.label}`;
    refs.updated.textContent = `Updated ${timeFmt.format(new Date(s.updatedAt))}`;
    refs.admission.textContent = s.admissionOpen ? 'Close admissions' : 'Reopen admissions';
    refs.admission.className = s.admissionOpen ? '' : 'closed';
    refs.error.textContent = errors.get(s.id) || '';
    order.push(root);
  }
  cardsEl.replaceChildren(...order);
}

data.subscribe(
  (list) => { shelters = list; render(); },
  (live) => {
    connEl.className = live ? 'conn' : 'conn down';
    connEl.textContent = live ? 'Live · connected' : 'Connection lost. Reconnecting… Changes may not be saved.';
  }
);
setInterval(render, 15000);
