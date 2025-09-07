
// src/services/auth.ts
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    // Explicitly setting the authDomain can sometimes help with domain authorization issues.
    auth.tenantId = null; // Ensure we are not using any tenant
    provider.setCustomParameters({
        'auth_domain': 'examprep-ai-wi0xc.firebaseapp.com'
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
