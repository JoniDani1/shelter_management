import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  readShelters,
  shelterService,
  shelterStorageKey,
} from "../services/shelterService";
import { authService } from "../services/authService";
import type { AuthSession, CapacityValues, Shelter } from "../types/models";
interface Store {
  shelters: Shelter[];
  session: AuthSession | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  update: (values: CapacityValues) => Promise<void>;
}
const Context = createContext<Store | null>(null);
export function ShelterProvider({ children }: { children: ReactNode }) {
  const [shelters, setShelters] = useState(readShelters);
  const [session, setSession] = useState<AuthSession | null>(null);
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (e.key === shelterStorageKey) setShelters(readShelters());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  async function update(values: CapacityValues) {
    if (!session) throw Error("Sign in first.");
    const updated = await shelterService.updateAvailability(
      session.shelterId,
      values,
    );
    setShelters((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }
  return (
    <Context.Provider
      value={{
        shelters,
        session,
        update,
        login: async (e, p) => setSession(await authService.login(e, p)),
        logout: async () => {
          await authService.logout();
          setSession(null);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useShelters() {
  const value = useContext(Context);
  if (!value) throw Error("Missing shelter provider");
  return value;
}
