// src/services/auth.ts
import { 
  GoogleAuthProvider, 
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error("Error starting sign-in with Google redirect: ", error);
    return null;
  }
}

export async function checkRedirectResult() {
    try {
        const result = await getRedirectResult(auth);
        return result?.user || null;
    } catch (error) {
        console.error("Error getting redirect result: ", error);
        return null;
    }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
  }
}
