import { describe, it, expect } from "vitest";
import { availabilityStatus } from "./status";

const now = Date.parse("2026-11-14T20:00:00Z");
const fresh = new Date(now - 5 * 60 * 1000).toISOString();
const stale = new Date(now - 31 * 60 * 1000).toISOString();

describe("availability status (same rules as /board/)", () => {
  it.each([
    [{ freeBeds: 5, admissionOpen: true, updatedAt: fresh }, "available"],
    [{ freeBeds: 4, admissionOpen: true, updatedAt: fresh }, "limited"],
    [{ freeBeds: 1, admissionOpen: true, updatedAt: fresh }, "limited"],
    [{ freeBeds: 0, admissionOpen: true, updatedAt: fresh }, "full"],
    [{ freeBeds: 9, admissionOpen: false, updatedAt: fresh }, "full"],
    [{ freeBeds: 9, admissionOpen: true, updatedAt: stale }, "unknown"],
    [{ freeBeds: 9, admissionOpen: true, updatedAt: null }, "unknown"],
  ])("%o -> %s", (s, expected) =>
    expect(availabilityStatus(s, now)).toBe(expected),
  );
});

describe("demo mode", () => {
  it("keeps old counts instead of unknown while demo mode is on", async () => {
    const { setDemoMode } = await import("./status");
    setDemoMode(true);
    expect(availabilityStatus({ freeBeds: 9, admissionOpen: true, updatedAt: stale }, now)).toBe("available");
    expect(availabilityStatus({ freeBeds: 9, admissionOpen: true, updatedAt: null }, now)).toBe("unknown");
    setDemoMode(false);
    expect(availabilityStatus({ freeBeds: 9, admissionOpen: true, updatedAt: stale }, now)).toBe("unknown");
  });
});
