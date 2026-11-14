// Firebase setup for the React frontend. Same project and web app as the static
// pages (public/shared/firebase-config.js). These values are public identifiers,
// not secrets: access is controlled by firestore.rules.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCvbAT2Cc0cGZ-vu5Xa791zCtQk1wBZBgo",
  authDomain: "gen-lang-client-0099418772.firebaseapp.com",
  projectId: "gen-lang-client-0099418772",
  storageBucket: "gen-lang-client-0099418772.firebasestorage.app",
  messagingSenderId: "1016165220146",
  appId: "1:1016165220146:web:34cad5af669f58a7d7212b",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
