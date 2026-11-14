// Demo mode for pitches: keeps the demo bed counts "fresh" so no page shows
// them as stale/unknown (the 30-minute rule), without anyone having to press
// "Confirm count".
//
// State lives in Firestore at config/demo { enabled, refreshedAt }. Not readable
// or writable from the browser (no rule matches config/).
//
//   node scripts/demo-mode.js on          enable demo mode and refresh now
//   node scripts/demo-mode.js off         disable it (counts expire normally again)
//   node scripts/demo-mode.js refresh     refresh timestamps if demo mode is on
//                                         (run every 10 minutes by Cloud Scheduler)
//   node scripts/demo-mode.js reset       set plausible demo counts for all shelters
//                                         (a mix of available, limited and full)
//
// Needs admin credentials (GOOGLE_APPLICATION_CREDENTIALS) or runs as the
// Cloud Run job "tonight-demo-refresh" (see docs/demo-mode.md).
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0099418772';
initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const configRef = db.collection('config').doc('demo');

// Deterministic, plausible free-bed counts: about 60% available, 25% limited, 15% full.
function demoFreeBeds(index, totalBeds) {
  const bucket = (index * 7) % 20; // spreads the buckets over the list
  if (bucket < 3) return 0; // full
  if (bucket < 8) return Math.min(totalBeds, 1 + (index % 4)); // limited: 1-4
  const share = [0.12, 0.2, 0.3, 0.45][index % 4];
  return Math.min(totalBeds, Math.max(5 + ((index * 3) % 8), Math.round(totalBeds * share)));
}

async function touchAll(fields = () => ({})) {
  const snap = await db.collection('shelters').orderBy('order').get();
  const batch = db.batch();
  snap.docs.forEach((d, i) => {
    batch.update(d.ref, {
      ...fields(d.data(), i),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: 'demo-mode',
    });
  });
  await batch.commit();
  return snap.size;
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === 'on') {
    await configRef.set({ enabled: true, changedAt: FieldValue.serverTimestamp() }, { merge: true });
    const n = await touchAll();
    console.log(`Demo mode ON, refreshed ${n} shelters.`);
  } else if (cmd === 'off') {
    await configRef.set({ enabled: false, changedAt: FieldValue.serverTimestamp() }, { merge: true });
    console.log('Demo mode OFF. Counts now expire after 30 minutes without an update.');
  } else if (cmd === 'refresh') {
    const config = (await configRef.get()).data() || {};
    if (!config.enabled) {
      console.log('Demo mode is off, nothing to refresh.');
      return;
    }
    const n = await touchAll();
    await configRef.set({ refreshedAt: FieldValue.serverTimestamp() }, { merge: true });
    console.log(`Refreshed ${n} shelters.`);
  } else if (cmd === 'reset') {
    const n = await touchAll((d, i) => ({
      freeBeds: demoFreeBeds(i, d.totalBeds),
      admissionOpen: true,
    }));
    console.log(`Set demo counts for ${n} shelters.`);
  } else {
    console.error('Usage: node scripts/demo-mode.js on|off|refresh|reset');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
