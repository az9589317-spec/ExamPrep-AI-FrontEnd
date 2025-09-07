
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAt7LdsUTDl-cyx1-kZvvmE7mlmNave-u8",
  authDomain: "examprep-ai-wi0xc.firebaseapp.com",
  projectId: "examprep-ai-wi0xc",
  storageBucket: "examprep-ai-wi0xc.firebasestorage.app",
  messagingSenderId: "598117662371",
  appId: "1:598117662371:web:15119767a5cecbd4874916"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
