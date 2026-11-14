// Google sign-in (Firebase Auth) and "which shelter is mine", the same flow as
// the /operator/ page (public/shared/access-firestore.js):
//   members/{uid}        { email, name, role, shelterIds: [id], updatedAt }
//                        an operator picks their shelter once and can change it
//   adminEmails/{email}  admin accounts (may edit every shelter)
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import type { AuthSession } from "../types/models";

const memberRef = (uid: string) => doc(db, "members", uid);

async function isAdminEmail(email: string | null) {
  if (!email) return false;
  try {
    return (await getDoc(doc(db, "adminEmails", email.toLowerCase()))).exists();
  } catch {
    return false;
  }
}

export function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(auth, provider);
}

export function logout() {
  return signOut(auth);
}

// Calls back with the session (or null) now and whenever login or access changes.
export function watchSession(callback: (s: AuthSession | null) => void) {
  let stopMember = () => {};
  const stopAuth = onAuthStateChanged(auth, (user: User | null) => {
    stopMember();
    stopMember = () => {};
    if (!user) return callback(null);
    const base = {
      uid: user.uid,
      name: user.displayName || user.email || "Signed in",
      email: user.email,
    };
    let stopped = false;
    isAdminEmail(user.email).then((adminByEmail) => {
      if (stopped) return;
      const unsubscribe = onSnapshot(
        memberRef(user.uid),
        (snap) => {
          const m = snap.exists() ? snap.data() : {};
          const shelterIds: string[] = m.shelterIds || [];
          const role =
            adminByEmail || m.role === "admin"
              ? "admin"
              : shelterIds.length
                ? "operator"
                : "none";
          callback({ ...base, role, shelterIds });
        },
        () => callback({ ...base, role: adminByEmail ? "admin" : "none", shelterIds: [] }),
      );
      stopMember = () => {
        stopped = true;
        unsubscribe();
      };
    });
    stopMember = () => {
      stopped = true;
    };
  });
  return () => {
    stopMember();
    stopAuth();
  };
}

// Saves the shelter this account runs (replaces an earlier choice).
export async function chooseShelter(session: AuthSession, shelterId: string) {
  const ref = memberRef(session.uid);
  const fields = { shelterIds: [shelterId], updatedAt: serverTimestamp() };
  if ((await getDoc(ref)).exists()) await updateDoc(ref, fields);
  else
    await setDoc(ref, {
      ...fields,
      email: session.email,
      name: session.name,
      role: "operator",
    });
}
