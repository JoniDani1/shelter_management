// Client data source for Firebase (Firestore), used on Firebase Hosting.
// Same API as data-local.js. Collection `shelters`, one document per shelter.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {
  getFirestore, collection, doc, query, orderBy, onSnapshot,
  runTransaction, updateDoc, writeBatch, getDocs, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const db = getFirestore(initializeApp(firebaseConfig));
const shelters = collection(db, 'shelters');

// Firestore GeoPoint (or a plain {lat, lng} object) -> { lat, lng } or null.
function toLatLng(loc) {
  if (!loc) return null;
  const lat = loc.latitude ?? loc.lat;
  const lng = loc.longitude ?? loc.lng;
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

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
    location: toLatLng(d.location),
    phone: d.phone ?? null,
    nearestStation: d.nearestStation ?? null,
    updatedAt: d.updatedAt ? d.updatedAt.toDate().toISOString() : null,
  };
}

// Returns an optimistic copy for the operator page; the live listener follows right after.
function changed(shelter, fields) {
  return { ...shelter, ...fields, updatedAt: new Date().toISOString() };
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

  async adjustFreeBeds(id, delta) {
    if (!Number.isInteger(delta)) throw new Error('delta must be an integer');
    const ref = doc(shelters, id);
    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error(`Unknown shelter: ${id}`);
      const current = toShelter(snap);
      // Clamp so fast presses at the edges are harmless.
      const freeBeds = Math.min(current.totalBeds, Math.max(0, current.freeBeds + delta));
      tx.update(ref, { freeBeds, updatedAt: serverTimestamp() });
      return changed(current, { freeBeds });
    });
  },

  async confirm(id) {
    await updateDoc(doc(shelters, id), { updatedAt: serverTimestamp() });
    return null;
  },

  async setAdmissionOpen(id, open) {
    if (typeof open !== 'boolean') throw new Error('open must be true or false');
    await updateDoc(doc(shelters, id), { admissionOpen: open, updatedAt: serverTimestamp() });
    return null;
  },

  // Demo only: put every shelter back to its seed count.
  async resetDemo() {
    const snap = await getDocs(shelters);
    const batch = writeBatch(db);
    for (const d of snap.docs) {
      batch.update(d.ref, {
        freeBeds: d.data().seedFreeBeds ?? d.data().freeBeds,
        admissionOpen: true,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  },
};
