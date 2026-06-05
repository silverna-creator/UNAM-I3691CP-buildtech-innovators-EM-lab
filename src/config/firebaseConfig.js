import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage'; // Ensure this is imported
import { Platform } from 'react-native';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAmjvhlExpJwEfkd1Dx0dnJm5cpkwfnOc8",
  authDomain: "em-lab-app.firebaseapp.com",
  databaseURL: "https://em-lab-app-default-rtdb.firebaseio.com",
  projectId: "em-lab-app",
  storageBucket: "em-lab-app.firebasestorage.app",
  messagingSenderId: "388695420434",
  appId: "1:388695420434:web:e0111e1b03221bc353b2cb",
  measurementId: "G-D0YZ74XX6G"
};

// Initialize App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with Persistence
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    auth = getAuth(app); // Fallback
  }
}

const db = getFirestore(app);

export { auth, db };