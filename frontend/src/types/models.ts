export interface Shelter {
  id: string;
  name: string;
  operator?: string;
  address: string;
  district: string;
  coordinates: { latitude: number; longitude: number };
  phone: string;
  openingHours: string;
  totalCapacity: number;
  occupiedBeds: number;
  availableBeds: number;
  eligibility: "All adults" | "Women" | "Men";
  accessibility: string;
  availabilityStatus: "available" | "limited" | "full" | "unknown";
  lastUpdated: string | null;
  sourceUrl: string;
  isMockAvailability: true;
}
export interface ShelterWorker {
  id: string;
  name: string;
  email: string;
  shelterId: string;
  role: "shelter_worker";
}
export interface AuthSession {
  workerId: string;
  shelterId: string;
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
