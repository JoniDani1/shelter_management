// Public map: one marker per shelter, coloured by the same status rules as the
// board (/shared/status.js). Read-only; updates live via the shared data source.
import { loadData } from '/shared/data.js';
import { MAPS_API_KEY } from '/shared/maps-config.js';

const { shelterStatus, admitsLabel, hoursLabel } = window.TonightStatus;
const BERLIN = { lat: 52.515, lng: 13.40 };
const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' });

const mapEl = document.getElementById('map');
const connEl = document.getElementById('conn');
const summaryEl = document.getElementById('summary');
const sheetEl = document.getElementById('sheet');
const detailEl = document.getElementById('detail');

let staleAfterMs = 30 * 60 * 1000;
let shelters = [];
let selectedId = null;
let fitted = false;
const markers = new Map(); // id -> AdvancedMarkerElement

// Official Google Maps bootstrap loader (https://developers.google.com/maps/documentation/javascript/load-maps-js-api).
function loadMaps(key) {
  /* eslint-disable */
  ((g)=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({ key, v: 'weekly', language: 'en', region: 'DE' });
  /* eslint-enable */
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

loadMaps(MAPS_API_KEY);
let map, AdvancedMarkerElement, LatLngBounds;
try {
  const [{ Map }, markerLib, core] = await Promise.all([
    google.maps.importLibrary('maps'),
    google.maps.importLibrary('marker'),
    google.maps.importLibrary('core'),
  ]);
  ({ AdvancedMarkerElement } = markerLib);
  ({ LatLngBounds } = core);
  map = new Map(mapEl, {
    center: BERLIN,
    zoom: 11,
    mapId: 'DEMO_MAP_ID', // required for advanced markers; replace with a styled Map ID later
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    gestureHandling: 'greedy',
  });
  map.addListener('click', () => select(null));
} catch (err) {
  console.error(err);
  mapEl.replaceChildren(el('p', 'error', 'The map could not be loaded. Please try again later.'));
}

const data = await loadData();
data.getConfig().then((cfg) => {
  staleAfterMs = cfg.staleAfterMinutes * 60 * 1000;
  render();
}).catch(() => {});

data.subscribe(
  (list) => { shelters = list; render(); },
  (live) => {
    connEl.textContent = live ? 'Live' : 'Connection lost · showing last known data';
    connEl.classList.toggle('down', !live);
  },
);
// Re-check staleness regularly so markers turn "Unknown" on time.
setInterval(render, 15000);

function render() {
  const now = Date.now();
  let free = 0;
  let open = 0;
  const seen = new Set();

  for (const s of shelters) {
    const status = shelterStatus(s, now, staleAfterMs);
    if (status.showCount && s.freeBeds > 0) { free += s.freeBeds; open += 1; }
    if (!map || !s.location) continue;
    seen.add(s.id);

    let marker = markers.get(s.id);
    if (!marker) {
      marker = new AdvancedMarkerElement({ map, position: s.location, content: el('div', 'pin'), gmpClickable: true });
      marker.addListener('click', () => select(s.id));
      markers.set(s.id, marker);
    }
    marker.position = s.location;
    marker.title = `${s.name}: ${status.label}`;
    marker.zIndex = status.key === 'available' ? 3 : status.key === 'limited' ? 2 : 1;
    const pin = marker.content;
    pin.className = `pin ${status.key}${s.id === selectedId ? ' selected' : ''}`;
    pin.textContent = status.showCount ? String(s.freeBeds) : '?';
  }

  for (const [id, marker] of markers) {
    if (!seen.has(id)) { marker.map = null; markers.delete(id); }
  }

  summaryEl.textContent = shelters.length
    ? `${free} free beds in ${open} of ${shelters.length} shelters · live`
    : 'Night shelters in Berlin · live';

  if (map && !fitted && markers.size > 1) {
    const bounds = new LatLngBounds();
    for (const m of markers.values()) bounds.extend(m.position);
    map.fitBounds(bounds, 40);
    fitted = true;
  }

  if (selectedId) renderDetail();
}

function select(id) {
  selectedId = id;
  sheetEl.hidden = !id;
  render();
}

function fact(list, label, value) {
  if (!value) return;
  const li = el('li');
  li.append(el('span', null, label));
  if (value instanceof Node) li.append(value); else li.append(document.createTextNode(value));
  list.append(li);
}

function renderDetail() {
  const s = shelters.find((x) => x.id === selectedId);
  if (!s) { select(null); return; }
  const status = shelterStatus(s, Date.now(), staleAfterMs);

  const head = el('div', 'detail-head');
  head.append(el('h2', null, s.name), el('p', 'addr', s.address || s.district || ''));

  const beds = el('div', 'beds');
  beds.append(el('b', null, status.showCount ? String(s.freeBeds) : '—'));
  beds.append(el('small', null, status.showCount ? `of ${s.totalBeds} beds free` : `${s.totalBeds} beds`));
  beds.append(el('span', `badge ${status.key}`, status.label));

  const updated = el('p', 'updated', s.updatedAt ? `Updated ${timeFmt.format(new Date(s.updatedAt))}` : 'No update yet');

  const facts = el('ul', 'facts');
  fact(facts, 'Admits', admitsLabel(s.admits));
  fact(facts, 'Open', hoursLabel(s));
  if (s.nearestStation?.name) {
    const m = s.nearestStation.distanceMeters;
    fact(facts, 'Nearest stop', `${s.nearestStation.name}${m ? ` (${Math.round(m / 50) * 50} m)` : ''}`);
  }
  const phone = Array.isArray(s.phone) ? s.phone[0] : s.phone;
  if (phone) {
    const a = el('a', null, phone);
    a.href = `tel:${phone.replace(/[^\d+]/g, '')}`;
    fact(facts, 'Phone', a);
  }

  const route = el('a', 'route', 'Route in Google Maps');
  const dest = s.location ? `${s.location.lat},${s.location.lng}` : `${s.name}, ${s.address || 'Berlin'}`;
  route.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=transit`;
  route.target = '_blank';
  route.rel = 'noopener';

  const note = el('p', 'note', 'Availability can change quickly. Admission depends on the shelter\'s rules.');
  detailEl.replaceChildren(head, beds, updated, facts, route, note);
}

document.getElementById('close').addEventListener('click', () => select(null));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') select(null); });

let meMarker = null;
document.getElementById('locate').addEventListener('click', () => {
  if (!map || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition((pos) => {
    const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    if (!meMarker) {
      const dot = el('div');
      dot.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#1a73e8;border:3px solid #fff;box-shadow:0 0 0 2px rgba(26,115,232,.35)';
      meMarker = new AdvancedMarkerElement({ map, content: dot, title: 'You are here', zIndex: 10 });
    }
    meMarker.position = here;
    map.panTo(here);
    map.setZoom(14);
  }, () => {}, { enableHighAccuracy: true, timeout: 10000 });
});
