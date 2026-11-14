// Writes the shelters from data/seed.json into Firestore (collection `shelters`).
// Overwrites documents with the same id and deletes shelters that are no longer
// in the seed file. Needs Google credentials:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json npm run seed:firestore
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue, GeoPoint } = require('firebase-admin/firestore');
const seed = require('../data/seed.json');

const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0099418772';
initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();

async function main() {
  const batch = db.batch();
  const ids = new Set(seed.map((s) => s.id));
  const existing = await db.collection('shelters').get();
  const removed = existing.docs.filter((d) => !ids.has(d.id));
  removed.forEach((d) => batch.delete(d.ref));
  seed.forEach((s, index) => {
    const { id, location, ...fields } = s;
    batch.set(db.collection('shelters').doc(id), {
      ...fields,
      location: location ? new GeoPoint(location.lat, location.lng) : null, // for the map (stage 2)
      order: index,
      seedFreeBeds: s.freeBeds, // demo value, used by "Reset demo"
      admissionOpen: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
  console.log(`Seeded ${seed.length} shelters into project ${projectId}` +
    (removed.length ? `, removed ${removed.length} old ones (${removed.map((d) => d.id).join(', ')}).` : '.'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
