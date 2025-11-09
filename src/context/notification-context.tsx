
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import type { Notification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, collection, query, where, onSnapshot, orderBy, updateDoc, doc, serverTimestamp, addDoc } from "firebase/firestore";
import { firebaseApp } from '@/lib/firebase';

interface NotificationContextType {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// In a real app, you'd move this to a shared config
const NOTIFICATION_SOUND_PATH = '/notification.mp3';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

   useEffect(() => {
    // We need to create the Audio object on the client side.
    setAudio(new Audio(NOTIFICATION_SOUND_PATH));
  }, []);

  useEffect(() => {
    if (!user || !firebaseApp) return;

    const db = getFirestore(firebaseApp);
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', 'in', [user.id, user.role]),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedNotifications: Notification[] = [];
      let hasUnread = false;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const notif: Notification = {
          id: doc.id,
          recipientId: data.recipientId,
          message: data.message,
          url: data.url,
          isRead: data.isRead,
          createdAt: data.createdAt.toMillis(),
        };
        fetchedNotifications.push(notif);

        // Check if this is a new, unread notification
        const existingNotif = notifications.find(n => n.id === doc.id);
        if (!existingNotif && !notif.isRead) {
            hasUnread = true;
        }
      });
      
      setNotifications(fetchedNotifications);

      if (hasUnread && audio) {
        toast({
          title: "Notifikasi Baru",
          description: fetchedNotifications[0].message,
        });
        audio.play().catch(error => console.error("Gagal memutar suara notifikasi:", error));
      }
    });

    return () => unsubscribe();
  }, [user, notifications, toast, audio]);

  const markAsRead = useCallback(async (id: string) => {
    const db = getFirestore(firebaseApp);
    const notifRef = doc(db, 'notifications', id);
    try {
      await updateDoc(notifRef, { isRead: true });
    } catch (error) {
      console.error("Gagal menandai notifikasi sebagai terbaca:", error);
    }
  }, []);

  const createNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
     const db = getFirestore(firebaseApp);
     try {
        await addDoc(collection(db, 'notifications'), {
            ...notification,
            isRead: false,
            createdAt: serverTimestamp()
        });
     } catch (error) {
        console.error("Gagal membuat notifikasi:", error);
     }
  }, []);

  const value = { notifications, markAsRead, createNotification };
  
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within an NotificationProvider');
  }
  return context;
}
