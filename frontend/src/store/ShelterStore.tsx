// Shared state for the whole app: live shelters from Firestore and the signed-in
// account. All map/list, dashboard and chart components read from here.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  refreshStatus,
  setFreeBeds,
  subscribeDemoMode,
  subscribeShelters,
} from "../services/shelterService";
import {
  chooseShelter,
  logout,
  signInWithGoogle,
  watchSession,
} from "../services/authService";
import type { AuthSession, Shelter } from "../types/models";

interface Store {
  shelters: Shelter[];
  loading: boolean;
  error: string | null;
  session: AuthSession | null;
  authReady: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  chooseShelter: (shelterId: string) => Promise<void>;
  update: (shelterId: string, freeBeds: number) => Promise<void>;
}
const Context = createContext<Store | null>(null);

export function ShelterProvider({ children }: { children: ReactNode }) {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(
    () =>
      subscribeShelters(
        (list) => {
          setShelters(list);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error(err);
          setError("Live data is not reachable right now.");
          setLoading(false);
        },
      ),
    [],
  );

  // Demo mode switches the 30-minute rule off; recompute statuses when it changes.
  useEffect(
    () =>
      subscribeDemoMode(() =>
        setShelters((list) => list.map((s) => refreshStatus(s))),
      ),
    [],
  );

  // A count goes "unknown" after 30 minutes without update, even without new data.
  useEffect(() => {
    const t = setInterval(
      () => setShelters((list) => list.map((s) => refreshStatus(s))),
      30_000,
    );
    return () => clearInterval(t);
  }, []);

  useEffect(
    () =>
      watchSession((s) => {
        setSession(s);
        setAuthReady(true);
      }),
    [],
  );

  return (
    <Context.Provider
      value={{
        shelters,
        loading,
        error,
        session,
        authReady,
        login: async () => {
          await signInWithGoogle();
        },
        logout,
        chooseShelter: async (id) => {
          if (!session) throw Error("Sign in first.");
          await chooseShelter(session, id);
        },
        update: async (id, freeBeds) => {
          if (!session) throw Error("Sign in first.");
          await setFreeBeds(id, freeBeds);
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
