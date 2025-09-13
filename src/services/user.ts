
// src/services/user.ts
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { updateProfile as firebaseUpdateProfile } from 'firebase/auth';

export async function createUserIfNotExists(user: User) {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { uid, email, displayName, photoURL } = user;
    await setDoc(userRef, {
      uid,
      email,
      displayName,
      photoURL,
      createdAt: new Date().toISOString(),
      status: 'active', // Set default status on creation
      role: 'user',
    });
  }
}

export async function updateUserProfile(user: User, data: { displayName: string }) {
    if (!user) throw new Error("User not authenticated.");

    // Update Firebase Auth profile
    await firebaseUpdateProfile(auth.currentUser!, {
        displayName: data.displayName
    });

    // Update Firestore user document
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
        displayName: data.displayName
    });
}

export async function getUserPreferences(userId: string): Promise<string[]> {
    if (!userId) return [];
    const prefRef = doc(db, 'userPreferences', userId);
    const docSnap = await getDoc(prefRef);
    if (docSnap.exists()) {
        return docSnap.data().interestedCategories || [];
    }
    return [];
}

export async function updateUserPreferences(userId: string, interestedCategories: string[]) {
    if (!userId) throw new Error("User not authenticated.");
    const prefRef = doc(db, 'userPreferences', userId);
    await setDoc(prefRef, { interestedCategories }, { merge: true });
}
