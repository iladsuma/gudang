
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './auth-context';
import type { Notification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface NotificationContextType {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// In a real app, you'd move this to a shared config
const NOTIFICATION_SOUND_PATH = '/notification.mp3';

let notificationContextInstance: NotificationContextType;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // We need to create the Audio object on the client side.
    setAudio(new Audio(NOTIFICATION_SOUND_PATH));
  }, []);

  const createNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    // This check is important. Only create notifications for the intended recipient.
    if (user && (notification.recipientId === user.id || notification.recipientId === user.role)) {
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
    }
  }, [user, toast, audio]);


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

  notificationContextInstance = value;
  
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within an NotificationProvider');
  }
  return context;
}

// This allows us to access the context from outside React components
export function getNotificationContext() {
    if (!notificationContextInstance) {
        // This is a fallback to prevent crashes if called before provider is mounted.
        // In a real app, you might want a more robust solution.
        console.warn("NotificationContext not yet initialized!");
        return {
            notifications: [],
            markAsRead: () => {},
            createNotification: () => {},
        };
    }
    return notificationContextInstance;
}
