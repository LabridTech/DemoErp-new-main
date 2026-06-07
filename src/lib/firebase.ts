import { initializeApp, getApps } from "firebase/app"
import { getDatabase } from "firebase/database"
import { getFirestore } from "firebase/firestore"

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
//   measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
// };

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfKC9LS2064JsKmB4VNvZsF1l0h0M1sOU",
  authDomain: "testdemo-b5e01.firebaseapp.com",
  projectId: "testdemo-b5e01",
  storageBucket: "testdemo-b5e01.firebasestorage.app",
  messagingSenderId: "83638618761",
  appId: "1:83638618761:web:b4d87531743dbfec7fd458"
};

// ✅ Prevent re-initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// ✅ Export database instances
export const db = getDatabase(app); // Realtime Database
export const firestore = getFirestore(app); // Firestore Database
export default app;
