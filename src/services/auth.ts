// src/services/auth.ts
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    // Explicitly setting the authDomain can sometimes help with domain authorization issues.
    provider.setCustomParameters({
        'auth_domain': auth.app.options.authDomain
    });
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google: ", error);
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
