// Shapes used by the UI. Shelter records come from Firestore (collection
// `shelters`) and are mapped in src/services/shelterService.ts.
export type AvailabilityStatus = "available" | "limited" | "full" | "unknown";

export interface Shelter {
  id: string;
  name: string;
  address: string;
  district: string;
  coordinates: { latitude: number; longitude: number };
  phone: string;
  openingHours: string;
  nearestStation: string | null;
  totalCapacity: number;
  occupiedBeds: number;
  availableBeds: number;
  eligibility: "All adults" | "Women" | "Men";
  accessibility: string;
  admissionOpen: boolean;
  availabilityStatus: AvailabilityStatus;
  lastUpdated: string | null;
  sourceUrl: string;
  // Free-bed numbers in the live database are still demo values.
  isMockAvailability: true;
}

// The signed-in Google account and the shelter(s) it may edit.
export interface AuthSession {
  uid: string;
  name: string;
  email: string | null;
  role: "admin" | "operator" | "none";
  shelterIds: string[];
}

export interface PopulationStatistic {
  value: number;
  referenceDate: string;
  sourceUrl: string;
  category: "without_accommodation" | "accommodated";
}

export interface CapacityValues {
  totalCapacity: number;
  occupiedBeds: number;
}
