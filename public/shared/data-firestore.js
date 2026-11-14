// Client data source for Firebase (Firestore), used on Firebase Hosting.
// Same API as data-local.js. Collection `shelters`, one document per shelter.
//
// Every change to a shelter also writes a history entry to
// shelters/{id}/history/{entryId} in the same transaction and stores its id in
// `lastHistoryId`; the security rules reject a change without that entry.
import {
  collection, doc, query, orderBy, onSnapshot, runTransaction, getDocs, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { db, auth } from './firebase.js';

const shelters = collection(db, 'shelters');

// Firestore Timestamp -> ISO string, so the pages see the same shape as the local server.
function toShelter(snap) {
  const d = snap.data({ serverTimestamps: 'estimate' });
  return {
    id: snap.id,
    name: d.name,
    district: d.district,
    address: d.address ?? null,
    totalBeds: d.totalBeds,
    freeBeds: d.freeBeds,
    admits: d.admits,
    opensAt: d.opensAt,
    closesAt: d.closesAt,
    open24h: d.open24h === true,
    nearestStation: d.nearestStation ?? null,
    admissionOpen: d.admissionOpen !== false,
    updatedAt: d.updatedAt ? d.updatedAt.toDate().toISOString() : null,
  };
}

// Applies `compute(current)` -> changed fields to one shelter, with history entry.
async function writeChange(id, kind, compute) {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in first');
  const ref = doc(shelters, id);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error(`Unknown shelter: ${id}`);
    const current = toShelter(snap);
    const fields = compute(current);
    const next = { ...current, ...fields };
    const entry = doc(collection(ref, 'history'));
    tx.set(entry, {
      kind, // adjust | confirm | admission | reset
      delta: next.freeBeds - current.freeBeds,
      freeBeds: next.freeBeds,
      totalBeds: current.totalBeds,
      admissionOpen: next.admissionOpen,
      by: user.uid,
      at: serverTimestamp(),
    });
    tx.update(ref, {
      ...fields,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
      lastHistoryId: entry.id,
    });
    // Optimistic copy for the operator page; the live listener follows right after.
    return { ...next, updatedAt: new Date().toISOString() };
  });
}

export default {
  async getConfig() {
    return { staleAfterMinutes: 30, demo: true };
  },

  subscribe(onShelters, onConnection = () => {}) {
    return onSnapshot(
      query(shelters, orderBy('order')),
      { includeMetadataChanges: true },
      (snap) => {
        // fromCache means we are offline and showing the last known data.
        onConnection(!snap.metadata.fromCache);
        onShelters(snap.docs.map(toShelter));
      },
      (err) => {
        console.error(err);
        onConnection(false);
      },
    );
  },

  adjustFreeBeds(id, delta) {
    if (!Number.isInteger(delta)) throw new Error('delta must be an integer');
    // Clamp so fast presses at the edges are harmless.
    return writeChange(id, 'adjust', (s) => ({
      freeBeds: Math.min(s.totalBeds, Math.max(0, s.freeBeds + delta)),
    }));
  },

  confirm(id) {
    return writeChange(id, 'confirm', () => ({}));
  },

  setAdmissionOpen(id, open) {
    if (typeof open !== 'boolean') throw new Error('open must be true or false');
    return writeChange(id, 'admission', () => ({ admissionOpen: open }));
  },

  // Demo only (admins): put every shelter back to its seed count.
  async resetDemo() {
    const snap = await getDocs(shelters);
    await Promise.all(snap.docs.map((d) => writeChange(d.id, 'reset', (s) => ({
      freeBeds: Math.min(s.totalBeds, d.data().seedFreeBeds ?? s.freeBeds),
      admissionOpen: true,
    }))));
  },
};
