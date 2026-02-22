import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "REDACTED_FIREBASE_KEY",
  authDomain: "smart-campus-manager.firebaseapp.com",
  projectId: "smart-campus-manager",
  storageBucket: "smart-campus-manager.firebasestorage.app",
  messagingSenderId: "35838544206",
  appId: "1:35838544206:web:88b32b4021a69248de761f",
  measurementId: "G-2P1JGMHKV2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export default app;
