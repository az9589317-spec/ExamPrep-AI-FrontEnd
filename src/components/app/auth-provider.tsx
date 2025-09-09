
// src/components/app/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
        {isLoading ? (
            <div className="flex min-h-screen items-center justify-center">
                <p>Loading...</p>
            </div>
        ) : ( 
            children
        )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
