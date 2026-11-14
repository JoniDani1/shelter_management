// Writes the sample shelters from data/seed.json into Firestore (collection `shelters`).
// Overwrites existing documents with the same id. Needs Google credentials:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json npm run seed:firestore
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const seed = require('../data/seed.json');

const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0099418772';
initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();

async function main() {
  const batch = db.batch();
  seed.forEach((s, index) => {
    const { id, ...fields } = s;
    batch.set(db.collection('shelters').doc(id), {
      ...fields,
      order: index,
      seedFreeBeds: s.freeBeds,
      admissionOpen: true,
      address: null, // real addresses come with real shelter data
      location: null, // GeoPoint for the map (stage 2)
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
  console.log(`Seeded ${seed.length} shelters into project ${projectId}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
