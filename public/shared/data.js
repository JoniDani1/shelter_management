// Picks the data source: the local dev server (npm start) if it answers
// /api/config, otherwise Firestore (Firebase Hosting has no /api).
export async function loadData() {
  try {
    const res = await fetch('/api/config', { cache: 'no-store' });
    if (res.ok && res.headers.get('content-type')?.includes('json')) {
      return (await import('./data-local.js')).default;
    }
  } catch (_) {
    // fall through to Firestore
  }
  return (await import('./data-firestore.js')).default;
}
