import { mockShelterWorkers } from "../data/mockShelterWorkers";
import type { AuthSession } from "../types/models";
export interface AuthService {
  login(email: string, password: string): Promise<AuthSession>;
  logout(): Promise<void>;
  getCurrentSession(): Promise<AuthSession | null>;
}
let session: AuthSession | null = null;
export const authService: AuthService = {
  async login(email, password) {
    await new Promise((r) => setTimeout(r, 850));
    const worker = mockShelterWorkers.find(
      (w) => w.email === email.trim().toLowerCase() && w.password === password,
    );
    if (!worker)
      throw Error(
        "Email or password is incorrect. Try the demonstration credentials below.",
      );
    session = { workerId: worker.id, shelterId: worker.shelterId };
    return session;
  },
  async logout() {
    session = null;
  },
  async getCurrentSession() {
    return session;
  },
};
