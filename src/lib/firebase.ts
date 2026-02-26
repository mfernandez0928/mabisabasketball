import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// These values should be replaced with your actual Firebase project configuration
// from the Firebase Console (Project Settings > General > Your Apps)
const firebaseConfig = {
  apiKey: "AIzaSyAjaCphIo6MIIF_NmDENqKfgdSNkfLgcUQ",
  authDomain: "mabisa-basketball.firebaseapp.com",
  projectId: "mabisa-basketball",
  storageBucket: "mabisa-basketball.firebasestorage.app",
  messagingSenderId: "71885550520",
  appId: "1:71885550520:web:b4ccbb7886abc69dfe954d",
  measurementId: "G-YHM7CTRYR8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Analytics is only supported in certain environments (browser)
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);
