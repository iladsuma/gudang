'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { login as apiLogin, getDummyUsers } from '@/lib/data';

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
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const dummyUsers = getDummyUsers();
        // Simple validation if user exists in our dummy data
        if(dummyUsers.find(u => u.username === parsedUser.username)){
            setUser(parsedUser);
        } else {
            localStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);
  
  useEffect(() => {
    if (loading) return;

    const publicPaths = ['/login'];
    const pathIsPublic = publicPaths.includes(pathname);
    
    if (!user && !pathIsPublic) {
      router.push('/login');
      return;
    }

    if (user) {
        if(pathIsPublic){
            router.push('/shipments');
        }
    }

  }, [user, loading, pathname, router]);


  const login = async (username: string, password: string) => {
    const loggedInUser = await apiLogin(username, password);
    setUser(loggedInUser);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/login');
  };

  const value = { user, login, logout, loading };

  if (loading) {
      // You can return a global loading spinner here
      return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
