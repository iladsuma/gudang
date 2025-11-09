
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './auth-context';
import type { Notification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface NotificationContextType {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  // This function is now just a placeholder for potential future use with a real-time backend
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  const audio = useMemo(() => {
    if (typeof window !== 'undefined') {
        const audioInstance = new Audio('/notification.mp3');
        audioInstance.load();
        return audioInstance;
    }
    return null;
  }, []);

  // This function can be called by client components to add a notification locally.
  const createNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif_${Date.now()}`,
        createdAt: Date.now(),
        isRead: false,
      };

      setNotifications(prev => [newNotification, ...prev]);

      toast({
        title: "Notifikasi Baru",
        description: newNotification.message,
      });

      if (audio) {
        audio.play().catch(error => console.error("Gagal memutar suara notifikasi:", error));
      }
  }, [toast, audio]);


  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const value = useMemo(() => ({
    notifications,
    markAsRead,
    createNotification,
  }), [notifications, markAsRead, createNotification]);
  
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within an NotificationProvider');
  }
  return context;
}
