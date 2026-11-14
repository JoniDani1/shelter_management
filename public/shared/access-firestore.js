// Sign-in with Google (Firebase Auth) and "which shelter is mine" for the operator page.
//
// Firestore layout (enforced by firestore.rules):
//   members/{uid}        { email, name, role: 'operator' | 'admin', shelterIds: [id], updatedAt }
//                        For now an operator picks their shelter themselves (no approval
//                        step). shelterIds is a list so approval or several shelters per
//                        account can be added later without changing the structure.
//   adminEmails/{email}  any document here makes that Google account an admin (may edit
//                        every shelter), even before its first login. Managed only with
//                        admin credentials (scripts/set-admin.js), never in the repo.
import {
  GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { db, auth } from './firebase.js';

const memberRef = (uid) => doc(db, 'members', uid);

function toUser(u) {
  return u && { uid: u.uid, name: u.displayName || u.email, email: u.email, photoURL: u.photoURL };
}

async function isAdminEmail(email) {
  if (!email) return false;
  try {
    return (await getDoc(doc(db, 'adminEmails', email.toLowerCase()))).exists();
  } catch (_) {
    return false;
  }
}

export default {
  needsLogin: true,

  onUser(callback) {
    return onAuthStateChanged(auth, (u) => callback(toUser(u)));
  },

  signIn() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(auth, provider);
  },

  signOut() {
    return signOut(auth);
  },

  // Calls back with { role: 'admin' | 'operator' | 'none', shelterIds } now and on every change.
  watchAccess(user, callback) {
    let stopped = false;
    let unsubscribe = () => {};
    isAdminEmail(user.email).then((adminByEmail) => {
      if (stopped) return;
      unsubscribe = onSnapshot(memberRef(user.uid), (snap) => {
        const m = snap.exists() ? snap.data() : {};
        const shelterIds = m.shelterIds || [];
        let role = 'none';
        if (adminByEmail || m.role === 'admin') role = 'admin';
        else if (shelterIds.length) role = 'operator';
        callback({ role, shelterIds });
      }, (err) => {
        console.error(err);
        callback({ role: adminByEmail ? 'admin' : 'none', shelterIds: [] });
      });
    });
    return () => { stopped = true; unsubscribe(); };
  },

  // Saves the shelter this account runs (replaces an earlier choice).
  async chooseShelter(user, shelterId) {
    const ref = memberRef(user.uid);
    const fields = { shelterIds: [shelterId], updatedAt: serverTimestamp() };
    if ((await getDoc(ref)).exists()) {
      await updateDoc(ref, fields);
    } else {
      await setDoc(ref, { ...fields, email: user.email, name: user.name || user.email, role: 'operator' });
    }
  },
};
