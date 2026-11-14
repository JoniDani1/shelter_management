// Live shelter data from Firestore (collection `shelters`), the same database
// the /board/, /map/ and /operator/ pages use.
//
// Every change also writes a history entry to shelters/{id}/history/{entryId}
// in the same transaction and stores its id in `lastHistoryId`; firestore.rules
// reject a change without it (same as public/shared/data-firestore.js).
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  type DocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { availabilityStatus } from "./status";
import type { CapacityValues, Shelter } from "../types/models";

export function validateCapacity(v: CapacityValues): string | null {
  if (!Number.isInteger(v.totalCapacity) || !Number.isInteger(v.occupiedBeds))
    return "Enter whole numbers for every bed count.";
  if (v.totalCapacity < 0 || v.occupiedBeds < 0)
    return "Bed counts cannot be negative.";
  if (v.occupiedBeds > v.totalCapacity)
    return "Occupied beds cannot exceed total capacity.";
  return null;
}

const shelters = collection(db, "shelters");
const DIRECTORY =
  "https://kaeltehilfe-berlin.de/images/Ubersicht%20NUs%202026_November_____.pdf";

const ELIGIBILITY: Record<string, Shelter["eligibility"]> = {
  women: "Women",
  men: "Men",
};

function accessibilityLabel(accessible: unknown) {
  if (accessible === true) return "Confirmed wheelchair accessible";
  if (accessible === false) return "Not wheelchair accessible";
  return "Confirm access with shelter";
}

// Raw Firestore fields (see scripts/seed-firestore.js) -> UI model.
export function toShelter(snap: DocumentSnapshot, now = Date.now()): Shelter {
  const d = snap.data({ serverTimestamps: "estimate" }) ?? {};
  const totalBeds = Number.isInteger(d.totalBeds) ? d.totalBeds : 0;
  const freeBeds = Number.isInteger(d.freeBeds)
    ? Math.min(totalBeds, Math.max(0, d.freeBeds))
    : 0;
  const updatedAt = d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : null;
  const admissionOpen = d.admissionOpen !== false;
  return {
    id: snap.id,
    name: d.name ?? snap.id,
    address: d.address ?? "",
    district: d.district ?? "Berlin",
    coordinates: {
      latitude: d.location?.latitude ?? d.location?.lat ?? 52.52,
      longitude: d.location?.longitude ?? d.location?.lng ?? 13.405,
    },
    phone: d.phone ?? "",
    openingHours: d.open24h
      ? "Open 24 hours"
      : d.opensAt && d.closesAt
        ? `${d.opensAt}–${d.closesAt}`
        : "Ask the shelter",
    nearestStation: d.nearestStation ?? null,
    totalCapacity: totalBeds,
    occupiedBeds: totalBeds - freeBeds,
    availableBeds: freeBeds,
    eligibility: ELIGIBILITY[d.admits] ?? "All adults",
    accessibility: accessibilityLabel(d.accessible),
    admissionOpen,
    availabilityStatus: availabilityStatus({ freeBeds, admissionOpen, updatedAt }, now),
    lastUpdated: updatedAt,
    sourceUrl: d.source ?? DIRECTORY,
    isMockAvailability: true,
  };
}

// Recompute the time-based status (e.g. "unknown" after 30 minutes).
export function refreshStatus(s: Shelter, now = Date.now()): Shelter {
  const status = availabilityStatus(
    { freeBeds: s.availableBeds, admissionOpen: s.admissionOpen, updatedAt: s.lastUpdated },
    now,
  );
  return status === s.availabilityStatus ? s : { ...s, availabilityStatus: status };
}

export function subscribeShelters(
  onShelters: (list: Shelter[]) => void,
  onError: (err: Error) => void,
) {
  return onSnapshot(
    query(shelters, orderBy("order")),
    (snap) => onShelters(snap.docs.map((d) => toShelter(d))),
    onError,
  );
}

// Publishes a new free-bed count. Total capacity is fixed in the database
// (only freeBeds may change), so occupied = total - free.
export async function setFreeBeds(id: string, freeBeds: number) {
  const user = auth.currentUser;
  if (!user) throw Error("Please sign in first.");
  if (!Number.isInteger(freeBeds) || freeBeds < 0)
    throw Error("Enter a whole number of free beds.");
  const ref = doc(shelters, id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw Error("Shelter not found.");
    const current = snap.data();
    if (freeBeds > current.totalBeds)
      throw Error(`This shelter has ${current.totalBeds} beds in total.`);
    const admissionOpen = current.admissionOpen !== false;
    const entry = doc(collection(ref, "history"));
    tx.set(entry, {
      kind: "adjust",
      delta: freeBeds - current.freeBeds,
      freeBeds,
      totalBeds: current.totalBeds,
      admissionOpen,
      by: user.uid,
      at: serverTimestamp(),
    });
    tx.update(ref, {
      freeBeds,
      admissionOpen,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
      lastHistoryId: entry.id,
    });
  });
}
