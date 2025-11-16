
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './auth-context';
import type { Notification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface NotificationContextType {
  notifications: Notification[];
  markAsRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  const handleNewNotification = useCallback((newNotification: Notification) => {
    setNotifications(prev => [newNotification, ...prev]);
    toast({
        title: "Notifikasi Baru",
        description: newNotification.message,
    });
  }, [toast]);


  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const value = useMemo(() => ({
    notifications,
    markAsRead,
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
