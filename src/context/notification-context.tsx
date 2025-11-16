
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './auth-context';
import type { Notification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface NotificationContextType {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  isConnected: boolean;
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

  const handleNewNotification = useCallback((newNotification: Notification) => {
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
    isConnected: false, // WebSocket is removed, so this is always false
  }), [notifications, markAsRead]);
  
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within an NotificationProvider');
  }
  return context;
}
