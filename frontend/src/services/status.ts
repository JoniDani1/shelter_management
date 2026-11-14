// Availability rules, same as public/shared/status.js (used by /board/ and /map/):
//   no update for 30 minutes -> unknown (count not trusted)
//   admissions closed        -> full (no bed tonight)
//   0 free beds              -> full
//   1-4 free beds            -> limited
//   5+ free beds             -> available
import type { AvailabilityStatus } from "../types/models";

export const STALE_AFTER_MS = 30 * 60 * 1000;
export const LIMITED_BELOW = 5;

export function availabilityStatus(
  s: { freeBeds: number; admissionOpen: boolean; updatedAt: string | null },
  now = Date.now(),
): AvailabilityStatus {
  const updated = s.updatedAt ? Date.parse(s.updatedAt) : NaN;
  const age = now - updated;
  if (!Number.isFinite(updated) || age > STALE_AFTER_MS || age < -5 * 60 * 1000)
    return "unknown";
  if (!Number.isInteger(s.freeBeds)) return "unknown";
  if (!s.admissionOpen || s.freeBeds <= 0) return "full";
  return s.freeBeds < LIMITED_BELOW ? "limited" : "available";
}
