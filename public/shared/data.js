// Picks the backend: the local dev server (npm start) if it answers
// /api/config, otherwise Firebase (Firebase Hosting has no /api).
let backend;

function detectBackend() {
  backend ??= fetch('/api/config', { cache: 'no-store' })
    .then((res) => (res.ok && res.headers.get('content-type')?.includes('json') ? 'local' : 'firestore'))
    .catch(() => 'firestore');
  return backend;
}

// Shelter data: subscribe, plus/minus, confirm, admissions.
export async function loadData() {
  return (await detectBackend()) === 'local'
    ? (await import('./data-local.js')).default
    : (await import('./data-firestore.js')).default;
}

// Sign-in and access control (who may edit which shelter).
export async function loadAccess() {
  return (await detectBackend()) === 'local'
    ? (await import('./access-local.js')).default
    : (await import('./access-firestore.js')).default;
}
