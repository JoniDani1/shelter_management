import { loadData } from '/shared/data.js';

// Entry points shown on the start page. To add a page (e.g. /app/), add an entry here.
const ENTRIES = [
  { href: '/map/', icon: '📍', title: 'Map', text: 'Find a shelter with free beds near you' },
  { href: '/board/', icon: '🚇', title: 'Station board', text: 'Live display for U-Bahn stations' },
  { href: '/operator/', icon: '🔑', title: 'Operator login', text: 'Shelter staff: update your free beds' },
];

const nav = document.getElementById('entries');
for (const e of ENTRIES) {
  const a = document.createElement('a');
  a.className = 'entry';
  a.href = e.href;
  a.innerHTML = '<span class="icon" aria-hidden="true"></span><span class="txt"><strong></strong><small></small></span><span class="arrow" aria-hidden="true">›</span>';
  a.querySelector('.icon').textContent = e.icon;
  a.querySelector('strong').textContent = e.title;
  a.querySelector('small').textContent = e.text;
  nav.append(a);
}

// Small live figure: total free beds across shelters with a fresh, open status.
const liveEl = document.getElementById('live');
const liveText = document.getElementById('live-text');
let shelters = [];
let staleAfterMs = 30 * 60 * 1000;

function render() {
  if (!shelters.length) return;
  const now = Date.now();
  let free = 0;
  let withBeds = 0;
  for (const s of shelters) {
    const st = window.TonightStatus.shelterStatus(s, now, staleAfterMs);
    if (st.showCount && s.freeBeds > 0) { free += s.freeBeds; withBeds += 1; }
  }
  liveText.textContent = `${free} free beds right now in ${withBeds} of ${shelters.length} shelters`;
  liveEl.classList.add('on');
}

try {
  const data = await loadData();
  data.getConfig().then((cfg) => { staleAfterMs = cfg.staleAfterMinutes * 60 * 1000; render(); }).catch(() => {});
  data.subscribe((list) => { shelters = list; render(); }, (live) => liveEl.classList.toggle('down', !live));
  setInterval(render, 30000);
} catch (err) {
  console.error(err);
  liveEl.hidden = true;
}
