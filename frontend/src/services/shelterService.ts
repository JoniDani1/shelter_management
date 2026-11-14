import { mockShelters } from "../data/mockShelters";
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
export interface ShelterService {
  getShelters(): Promise<Shelter[]>;
  getShelterById(id: string): Promise<Shelter>;
  updateAvailability(id: string, values: CapacityValues): Promise<Shelter>;
}
const key = "tonight:shelters:v1";
export function readShelters(): Shelter[] {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    if (Array.isArray(saved) && saved.length === mockShelters.length)
      return mockShelters.map((seed) => {
        const s = saved.find((v) => v.id === seed.id);
        return s && !validateCapacity(s)
          ? {
              ...seed,
              totalCapacity: s.totalCapacity,
              occupiedBeds: s.occupiedBeds,
              availableBeds: s.totalCapacity - s.occupiedBeds,
              lastUpdated: s.lastUpdated,
              availabilityStatus:
                seed.availabilityStatus === "unknown" && !s.lastUpdated
                  ? "unknown"
                  : s.totalCapacity === s.occupiedBeds
                    ? "full"
                    : s.totalCapacity - s.occupiedBeds <= 3
                      ? "limited"
                      : "available",
            }
          : seed;
      });
  } catch {
    /* Storage is optional. */
  }
  return mockShelters;
}
export const shelterService: ShelterService = {
  async getShelters() {
    return readShelters();
  },
  async getShelterById(id) {
    const s = readShelters().find((s) => s.id === id);
    if (!s) throw Error("Shelter not found.");
    return s;
  },
  async updateAvailability(id, values) {
    const error = validateCapacity(values);
    if (error) throw Error(error);
    await new Promise((r) => setTimeout(r, 900));
    const all = readShelters();
    const shelter = all.find((s) => s.id === id);
    if (!shelter) throw Error("Shelter not found.");
    const availableBeds = values.totalCapacity - values.occupiedBeds;
    const updated: Shelter = {
      ...shelter,
      ...values,
      availableBeds,
      availabilityStatus:
        availableBeds === 0
          ? "full"
          : availableBeds <= 3
            ? "limited"
            : "available",
      lastUpdated: new Date().toISOString(),
    };
    try {
      localStorage.setItem(
        key,
        JSON.stringify(all.map((s) => (s.id === id ? updated : s))),
      );
    } catch {
      /* Continue in memory when storage is unavailable. */
    }
    return updated;
  },
};
export const shelterStorageKey = key;
