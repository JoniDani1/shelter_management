// Operator page. Operators sign in with Google, pick the shelter they run once
// (saved per account, changeable later) and then update only that shelter.
// Admins may update every shelter. On the local dev server there is no login.
import { loadData, loadAccess } from '/shared/data.js';

const [data, access] = await Promise.all([loadData(), loadAccess()]);

const $ = (id) => document.getElementById(id);
const { shelterStatus, admitsLabel, hoursLabel } = window.TonightStatus;
const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' });

let staleAfterMs = 30 * 60 * 1000;
let shelters = [];
let user; // undefined until the first auth callback, then a user or null
let me = null; // { role, shelterIds } once known
let picking = false; // "Change shelter" pressed
let search = '';
const cards = new Map(); // id -> { root, refs }
const errors = new Map();
let stopAccess = () => {};

data.getConfig().then((cfg) => {
  staleAfterMs = cfg.staleAfterMinutes * 60 * 1000;
}).catch(() => {});

// Remember the chosen shelter (?shelter=id in the URL, or the dropdown).
const params = new URLSearchParams(location.search);
let selected = params.get('shelter') || '';
try { selected = selected || localStorage.getItem('tonight.shelter') || ''; } catch (_) {}

$('filter').addEventListener('change', () => {
  selected = $('filter').value;
  try { localStorage.setItem('tonight.shelter', selected); } catch (_) {}
  render();
});

$('signin-btn').addEventListener('click', async () => {
  $('signin-error').textContent = '';
  $('signin-btn').disabled = true;
  try {
    await access.signIn();
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
      $('signin-error').textContent = `Sign-in failed: ${err.message}`;
    }
  } finally {
    $('signin-btn').disabled = false;
  }
});

$('signout').addEventListener('click', () => access.signOut());

$('picker-search').addEventListener('input', (e) => {
  search = e.target.value;
  renderPicker();
});

$('change-shelter').addEventListener('click', () => {
  picking = true;
  search = '';
  $('picker-search').value = '';
  render();
  $('picker-search').focus();
});

$('picker-cancel').addEventListener('click', () => {
  picking = false;
  render();
});

async function choose(shelterId) {
  $('picker-error').textContent = '';
  try {
    await access.chooseShelter(user, shelterId);
    picking = false;
    selected = '';
  } catch (err) {
    console.error(err);
    $('picker-error').textContent = `Could not save your shelter: ${err.message}`;
  }
  render();
}

$('reset').addEventListener('click', () => data.resetDemo().catch((err) => {
  console.error(err);
  $('picker-error').textContent = err.message;
}));

access.onUser((u) => {
  user = u;
  me = null;
  picking = false;
  stopAccess();
  if (user) {
    stopAccess = access.watchAccess(user, (a) => {
      me = a;
      render();
    });
  }
  render();
});

async function act(id, request) {
  try {
    errors.delete(id);
    const updated = await request();
    // Apply right away; the live listener confirms shortly after.
    if (updated) shelters = shelters.map((s) => (s.id === id ? updated : s));
  } catch (err) {
    errors.set(id, err.code === 'permission-denied' ? 'You are not allowed to change this shelter.' : err.message);
  }
  render();
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function button(text, cls, onClick) {
  const b = el('button', cls, text);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

const shelterName = (id) => shelters.find((s) => s.id === id)?.name || id;

function buildCard(s) {
  const root = el('section', 'card');
  const head = el('div');
  const title = el('h2', null, s.name);
  const district = el('div', 'district', [admitsLabel(s.admits), s.district, hoursLabel(s)].filter(Boolean).join(' · '));
  head.append(title, district);

  const counter = el('div', 'counter');
  const minus = button('−', null, () => act(s.id, () => data.adjustFreeBeds(s.id, -1)));
  minus.setAttribute('aria-label', `One bed taken at ${s.name}`);
  const value = el('div', 'value');
  const count = el('b');
  const totalBeds = el('span');
  value.append(count, totalBeds);
  const plus = button('+', null, () => act(s.id, () => data.adjustFreeBeds(s.id, 1)));
  plus.setAttribute('aria-label', `One bed freed at ${s.name}`);
  counter.append(minus, value, plus);

  const hint = el('div', 'hint');
  hint.append(el('span', null, '− guest checked in'), el('span', null, 'bed freed +'));

  const meta = el('div', 'meta');
  const pill = el('span', 'pill');
  const updated = el('span', 'updated');
  meta.append(pill, updated);

  const actions = el('div', 'actions');
  const confirm = button('Confirm count', null, () => act(s.id, () => data.confirm(s.id)));
  confirm.title = 'Count is still correct: refresh the "updated" time';
  const admission = button('', null, () => {
    const current = shelters.find((x) => x.id === s.id);
    act(s.id, () => data.setAdmissionOpen(s.id, !current.admissionOpen));
  });
  actions.append(confirm, admission);

  const error = el('div', 'error');
  error.setAttribute('role', 'alert');

  root.append(head, counter, hint, meta, actions, error);
  return { root, refs: { minus, plus, count, totalBeds, pill, updated, admission, error } };
}

function renderCards(mine) {
  const filter = $('filter');
  $('filter-wrap').hidden = mine.length < 2;
  const ids = mine.map((s) => s.id).join();
  if (filter.dataset.ids !== ids) {
    filter.dataset.ids = ids;
    filter.replaceChildren(new Option('All shelters', ''));
    for (const s of mine) filter.append(new Option(s.name, s.id));
  }
  if (selected && !mine.some((s) => s.id === selected)) selected = '';
  filter.value = selected;

  const now = Date.now();
  const order = [];
  for (const s of mine.filter((x) => !selected || x.id === selected)) {
    if (!cards.has(s.id)) cards.set(s.id, buildCard(s));
    const { root, refs } = cards.get(s.id);
    const status = shelterStatus(s, now, staleAfterMs);
    refs.count.textContent = s.freeBeds;
    refs.totalBeds.textContent = `free of ${s.totalBeds} beds`;
    refs.minus.disabled = s.freeBeds <= 0;
    refs.plus.disabled = s.freeBeds >= s.totalBeds;
    refs.pill.className = `pill ${status.key}`;
    refs.pill.textContent = `Board shows: ${status.label}`;
    refs.updated.textContent = s.updatedAt ? `Updated ${timeFmt.format(new Date(s.updatedAt))}` : 'Not updated yet';
    refs.admission.textContent = s.admissionOpen ? 'Close admissions' : 'Reopen admissions';
    refs.admission.className = s.admissionOpen ? '' : 'closed';
    refs.error.textContent = errors.get(s.id) || '';
    order.push(root);
  }
  $('cards').replaceChildren(...order);
}

function renderPicker() {
  const q = search.trim().toLowerCase();
  const matches = shelters.filter((s) => !q || [s.name, s.district, s.nearestStation, s.address]
    .some((v) => v && v.toLowerCase().includes(q)));
  const byDistrict = new Map();
  for (const s of [...matches].sort((a, b) => a.name.localeCompare(b.name))) {
    if (!byDistrict.has(s.district)) byDistrict.set(s.district, []);
    byDistrict.get(s.district).push(s);
  }
  const groups = [...byDistrict.keys()].sort((a, b) => a.localeCompare(b)).map((district) => {
    const wrap = el('div');
    wrap.append(el('h3', null, district));
    const grid = el('div', 'group');
    for (const s of byDistrict.get(district)) {
      const b = button('', me?.shelterIds.includes(s.id) ? 'current' : '', () => choose(s.id));
      b.append(el('b', null, s.name));
      b.append(el('small', null, [admitsLabel(s.admits), s.nearestStation, `${s.totalBeds} beds`].filter(Boolean).join(' · ')));
      grid.append(b);
    }
    wrap.append(grid);
    return wrap;
  });
  $('picker-list').replaceChildren(...(groups.length ? groups : [el('p', 'empty', 'No shelter matches your search.')]));
}

function render() {
  const ready = user !== undefined && (!user || me);
  $('loading').hidden = ready;
  $('signin').hidden = !ready || !!user;
  $('user').hidden = !user || !access.needsLogin;
  if (user) {
    $('user-name').textContent = user.name;
    $('user-role').textContent = me?.role === 'admin' ? 'Admin' : me?.shelterIds.length ? 'Operator' : '';
    $('user-role').hidden = !$('user-role').textContent;
  }

  const isAdmin = me?.role === 'admin';
  const mine = !me ? [] : isAdmin ? shelters : shelters.filter((s) => me.shelterIds.includes(s.id));
  const showPicker = !!user && !!me && !isAdmin && (picking || mine.length === 0) && shelters.length > 0;
  $('picker').hidden = !showPicker;
  $('picker-cancel').hidden = mine.length === 0;
  $('workspace').hidden = !user || !me || showPicker || mine.length === 0;
  $('change-shelter').hidden = isAdmin;
  $('reset').hidden = !isAdmin;

  if (showPicker) renderPicker();
  if (!$('workspace').hidden) renderCards(mine);
}

data.subscribe(
  (list) => { shelters = list; render(); },
  (live) => {
    $('conn').className = live ? 'conn' : 'conn down';
    $('conn').textContent = live ? 'Live · connected' : 'Connection lost. Reconnecting… Changes may not be saved.';
  },
);
setInterval(render, 15000);
