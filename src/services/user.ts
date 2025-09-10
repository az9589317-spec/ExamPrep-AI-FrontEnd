// src/services/user.ts
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

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
    });
  }
}
