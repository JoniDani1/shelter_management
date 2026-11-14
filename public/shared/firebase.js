// Shared Firebase setup for all pages. On localhost with the Firebase emulators
// running (npm run emulators), it talks to the emulators instead of production.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const usingEmulators = ['localhost', '127.0.0.1'].includes(location.hostname);
if (usingEmulators) {
  connectFirestoreEmulator(db, location.hostname, 8080);
  connectAuthEmulator(auth, `http://${location.hostname}:9099`, { disableWarnings: true });
}
