
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

// Helper to create a compliant email from a username
const toEmail = (username: string) => `${username.toLowerCase().replace(/\s+/g, '')}@gudang.local`;

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
          } else {
            // This case might happen if Firestore doc is deleted but auth record remains
            setUser(null);
            await signOut(auth);
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          setUser(null);
          await signOut(auth);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (loading) return; 

    const publicPaths = ['/login'];
    const pathIsPublic = publicPaths.includes(pathname);
    
    if (!user && !pathIsPublic) {
      router.push('/login');
    }

  }, [user, loading, pathname, router]);

  const login = async (username: string, password: string) => {
    const email = toEmail(username);
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // The onAuthStateChanged listener will handle setting the user state
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            // If user not found, try to create it (for demo purposes)
            if ((username === 'admin' && password === 'admin') || (username === 'user' && password === 'user')) {
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    const newUser: Omit<User, 'id'> = {
                        username,
                        role: username as 'admin' | 'user'
                    };
                    await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
                    // onAuthStateChanged will set the user state
                } catch (creationError) {
                    console.error("Failed to create demo user:", creationError);
                    throw new Error('Gagal membuat akun demo.');
                }
            } else {
                 throw new Error('Username atau password salah.');
            }
        } else {
            console.error("Login error:", error);
            throw new Error('Username atau password salah.');
        }
    }
  };

  const logout = async () => {
    await signOut(auth);
    // The onAuthStateChanged listener will set user to null
    router.push('/login');
  };

  const value = { user, login, logout, loading };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
