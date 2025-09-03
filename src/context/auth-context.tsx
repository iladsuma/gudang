
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { login as apiLogin } from '@/lib/data';

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

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('gudangcheckout_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('gudangcheckout_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return; 

    const publicPaths = ['/login'];
    const pathIsPublic = publicPaths.includes(pathname);
    
    if (!user && !pathIsPublic) {
      router.push('/login');
    }

  }, [user, loading, pathname, router]);


  const login = async (username: string, password: string) => {
    const loggedInUser = await apiLogin(username, password);
    setUser(loggedInUser);
    localStorage.setItem('gudangcheckout_user', JSON.stringify(loggedInUser));
    
    // Clear cart from previous user session if any
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
        if (key.startsWith('shipping_cart_')) {
            localStorage.removeItem(key);
        }
    }
    
    if (loggedInUser.role === 'admin') {
        router.push('/dashboard');
    } else {
        router.push('/shipments');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gudangcheckout_user');
    // We don't clear the cart on logout, it's tied to the user ID
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
