// src/services/auth.ts
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut as firebaseSignOut,
  UserCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export type SignInResult = {
    user: UserCredential['user'] | null;
    isCancelled: boolean;
};

export async function signInWithGoogle(): Promise<SignInResult> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return { user: result.user, isCancelled: false };
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      // This is an expected user action, not an error.
      return { user: null, isCancelled: true };
    }
    console.error("Error signing in with Google: ", error);
    return { user: null, isCancelled: false };
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
  }
}
