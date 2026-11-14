import { describe, it, expect } from "vitest";
import { validateCapacity } from "./shelterService";
describe("capacity validation", () => {
  it.each([
    { totalCapacity: -1, occupiedBeds: 0 },
    { totalCapacity: 50, occupiedBeds: -1 },
    { totalCapacity: 50, occupiedBeds: 51 },
    { totalCapacity: 50.5, occupiedBeds: 30 },
    { totalCapacity: 50, occupiedBeds: 30.5 },
    { totalCapacity: NaN, occupiedBeds: 0 },
  ])("rejects inconsistent or invalid counts %o", (values) =>
    expect(validateCapacity(values)).toBeTruthy(),
  );
  it("accepts full, empty and zero-capacity shelters", () => {
    for (const values of [
      { totalCapacity: 50, occupiedBeds: 50 },
      { totalCapacity: 50, occupiedBeds: 0 },
      { totalCapacity: 0, occupiedBeds: 0 },
    ])
      expect(validateCapacity(values)).toBeNull();
  });
});
