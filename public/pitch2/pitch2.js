// Tonight pitch deck (new design): navigation, live app frames, live bed count.
import { loadData } from '/shared/data.js';

// Where the new React app lives. Until it is merged to main it only exists on
// the preview channel of its pull request. The deck uses the live /app/ as soon
// as it exists on this site, so nothing needs to change after the merge.
// Override for a talk with ?app=<url>, e.g. ?app=https://tonight-berlin.web.app/app/
const PREVIEW_APP_URL = 'https://tonight-berlin--pr10-claude-project-threa-o8yencxi.web.app/app/';
const LIVE_APP_PATH = '/app/';

const STAGE_W = 1600;
const STAGE_H = 900;
const stage = document.getElementById('stage');
const slides = [...document.querySelectorAll('.slide')];
const counter = document.getElementById('counter');
const progress = document.querySelector('#progress span');
let appUrl = PREVIEW_APP_URL;

// ---------- scale the 1600x900 stage to the window ----------
function fitStage() {
  stage.style.transform = `scale(${Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H)})`;
}
window.addEventListener('resize', fitStage);
fitStage();

// ---------- navigation ----------
let current = 0;
function show(index) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  slides.forEach((s, i) => s.classList.toggle('active', i === current));
  counter.textContent = `${current + 1} / ${slides.length}`;
  progress.style.width = `${((current + 1) / slides.length) * 100}%`;
  document.title = `Tonight · ${slides[current].dataset.title}`;
  history.replaceState(null, '', `${location.search}#${current + 1}`);
}
const next = () => show(current + 1);
const prev = () => show(current - 1);

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
}

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const key = e.key.toLowerCase();
  if (['arrowright', 'arrowdown', 'pagedown', ' ', 'enter'].includes(key)) next();
  else if (['arrowleft', 'arrowup', 'pageup', 'backspace'].includes(key)) prev();
  else if (key === 'home') show(0);
  else if (key === 'end') show(slides.length - 1);
  else if (/^[1-9]$/.test(key)) show(Number(key) - 1);
  else if (key === 'f') toggleFullscreen();
  else if (key === 'a') window.open(appUrl, '_blank', 'noopener');
  else if (key === 'b') window.open('/board/', '_blank', 'noopener');
  else return;
  e.preventDefault();
});
document.getElementById('next').addEventListener('click', next);
document.getElementById('prev').addEventListener('click', prev);
document.getElementById('fullscreen').addEventListener('click', toggleFullscreen);

let touchX = null;
document.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  touchX = null;
  if (Math.abs(dx) > 60) (dx < 0 ? next : prev)();
});

show(Number(location.hash.slice(1)) - 1 || 0);

// ---------- which app URL to use ----------
async function resolveAppUrl() {
  const override = new URLSearchParams(location.search).get('app');
  if (override) return { url: override, label: 'App: custom URL' };
  try {
    const res = await fetch(LIVE_APP_PATH, { method: 'HEAD', cache: 'no-store' });
    if (res.ok && res.headers.get('content-type')?.includes('html')) {
      return { url: new URL(LIVE_APP_PATH, location.href).href, label: 'App: live' };
    }
  } catch (_) { /* fall through to the preview */ }
  return { url: PREVIEW_APP_URL, label: 'App: preview of PR 10' };
}

// ---------- live demo frames ----------
// Each frame renders the app at a virtual width (data-w) and is scaled to fit.
const frames = [...document.querySelectorAll('.frame')].map((fig) => {
  const iframe = document.createElement('iframe');
  iframe.title = fig.querySelector('figcaption').textContent.trim();
  iframe.allow = 'geolocation';
  fig.querySelector('.screen').append(iframe);
  return { fig, iframe, w: Number(fig.dataset.w) };
});

function fitFrames() {
  for (const { fig, iframe, w } of frames) {
    const screen = fig.querySelector('.screen');
    const scale = screen.clientWidth / w;
    iframe.style.width = `${w}px`;
    iframe.style.height = `${screen.clientHeight / scale}px`;
    iframe.style.transform = `scale(${scale})`;
  }
}
function loadFrames() {
  for (const f of frames) f.iframe.src = appUrl;
  fitFrames();
}
window.addEventListener('resize', fitFrames);
document.getElementById('reload-frames').addEventListener('click', loadFrames);

resolveAppUrl().then(({ url, label }) => {
  appUrl = url;
  const source = document.getElementById('app-source');
  source.textContent = label;
  source.title = url;
  for (const a of document.querySelectorAll('[data-app-link]')) a.href = url;
  // The preview host is too long for a slide, so only show the URL when it is live.
  if (!url.includes('--pr')) {
    document.getElementById('close-url').textContent = url.replace(/^https:\/\//, '').replace(/\/$/, '');
  }
  if (window.QRCode) {
    // eslint-disable-next-line no-new
    new window.QRCode(document.getElementById('qr'), {
      text: url, width: 380, height: 380, colorDark: '#30392f', colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.M,
    });
  }
  loadFrames();
});

// ---------- live bed count on the title slide ----------
const { shelterStatus } = window.TonightStatus;
loadData().then(async (data) => {
  const cfg = await data.getConfig();
  const staleMs = (cfg.staleAfterMinutes || 30) * 60 * 1000;
  let shelters = [];
  const render = () => {
    const known = shelters.filter((s) => shelterStatus(s, Date.now(), staleMs).showCount);
    document.getElementById('live-free').textContent = known.length
      ? known.reduce((sum, s) => sum + s.freeBeds, 0) : '–';
    document.getElementById('live-count').textContent = shelters.length || 26;
  };
  data.subscribe((list) => { shelters = list; render(); });
  setInterval(render, 30 * 1000);
}).catch((err) => console.error(err));
