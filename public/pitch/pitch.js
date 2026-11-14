// Tonight pitch deck: slide navigation, live demo frames and a live bed count.
import { loadData } from '/shared/data.js';

const STAGE_W = 1600;
const STAGE_H = 900;
const stage = document.getElementById('stage');
const slides = [...document.querySelectorAll('.slide')];
const counter = document.getElementById('counter');
const progress = document.querySelector('#progress span');
const PAGES = { o: '/operator/', b: '/board/', m: '/map/' };

// ---------- scale the 1600x900 stage to the window ----------
function fitStage() {
  const scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
  stage.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', fitStage);
fitStage();

// ---------- navigation ----------
let current = 0;

function show(index) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  slides.forEach((s, i) => {
    s.classList.toggle('active', i === current);
    s.classList.toggle('before', i < current);
  });
  counter.textContent = `${current + 1} / ${slides.length}`;
  progress.style.width = `${((current + 1) / slides.length) * 100}%`;
  document.title = `Tonight · ${slides[current].dataset.title}`;
  history.replaceState(null, '', `#${current + 1}`);
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
  else if (PAGES[key]) window.open(PAGES[key], '_blank', 'noopener');
  else return;
  e.preventDefault();
});

document.getElementById('next').addEventListener('click', next);
document.getElementById('prev').addEventListener('click', prev);
document.getElementById('fullscreen').addEventListener('click', toggleFullscreen);

// Swipe on touch screens.
let touchX = null;
document.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  touchX = null;
  if (Math.abs(dx) > 60) (dx < 0 ? next : prev)();
});

show(Number(location.hash.slice(1)) - 1 || 0);

// ---------- live demo frames ----------
// Each frame renders its page at a "virtual" width (data-w) and is scaled down
// to fit, so the board looks like a TV and the operator page like a phone.
const frames = [...document.querySelectorAll('.frame')].map((fig) => {
  const iframe = document.createElement('iframe');
  iframe.title = fig.querySelector('figcaption').textContent.trim();
  iframe.loading = 'eager';
  fig.querySelector('.screen').append(iframe);
  return { fig, iframe, w: Number(fig.dataset.w), src: fig.dataset.src };
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
  for (const f of frames) f.iframe.src = f.src;
  fitFrames();
}
window.addEventListener('resize', fitFrames);
document.getElementById('reload-frames').addEventListener('click', loadFrames);
// Load the live pages right away, so they are ready when the demo slide comes.
loadFrames();

// ---------- QR code on the last slide ----------
if (window.QRCode) {
  // eslint-disable-next-line no-new
  new window.QRCode(document.getElementById('qr'), {
    text: 'https://tonight-berlin.web.app/map/',
    width: 400,
    height: 400,
    correctLevel: window.QRCode.CorrectLevel.M,
  });
}

// ---------- live bed count on the title slide ----------
const liveTotal = document.getElementById('live-total');
const liveDot = document.querySelector('.live-line .dot');
const { shelterStatus } = window.TonightStatus;

loadData().then(async (data) => {
  const cfg = await data.getConfig();
  const staleMs = (cfg.staleAfterMinutes || 30) * 60 * 1000;
  let shelters = [];
  const render = () => {
    const now = Date.now();
    const known = shelters.filter((s) => shelterStatus(s, now, staleMs).showCount);
    const free = known.reduce((sum, s) => sum + s.freeBeds, 0);
    const withBeds = known.filter((s) => s.freeBeds > 0).length;
    liveDot.classList.toggle('off', known.length === 0);
    liveTotal.textContent = known.length
      ? `Right now: ${free} free beds in ${withBeds} of ${shelters.length} shelters (demo numbers)`
      : `${shelters.length} real Berlin night shelters, live`;
  };
  data.subscribe((list) => { shelters = list; render(); });
  setInterval(render, 30 * 1000);
}).catch((err) => {
  console.error(err);
  liveTotal.textContent = '26 real Berlin night shelters';
});
