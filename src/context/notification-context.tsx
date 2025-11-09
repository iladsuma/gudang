
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

const WS_RECONNECT_INTERVAL = 5000; // 5 seconds

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const audio = useMemo(() => {
    if (typeof window !== 'undefined') {
        const audioInstance = new Audio('/notification.mp3');
        audioInstance.load();
        return audioInstance;
    }
    return null;
  }, []);

  const connectWebSocket = useCallback(async () => {
    if (!user || ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
        const res = await fetch('/api/ws');
        const { url } = await res.json();
        
        ws.current = new WebSocket(url);
        
        ws.current.onopen = () => {
          console.log('WebSocket Connected');
          setIsConnected(true);
          if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
          }
          // Send user info to register the client on the server
          ws.current?.send(JSON.stringify({ type: 'register', user }));
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'notification') {
                const newNotification: Notification = data.payload;
                setNotifications(prev => [newNotification, ...prev]);
                toast({
                    title: "Notifikasi Baru",
                    description: newNotification.message,
                });
                if (audio) {
                    audio.play().catch(error => console.error("Gagal memutar suara notifikasi:", error));
                }
            }
        };

        ws.current.onclose = () => {
          console.log('WebSocket Disconnected');
          setIsConnected(false);
          if (!reconnectTimeout.current) {
             reconnectTimeout.current = setTimeout(connectWebSocket, WS_RECONNECT_INTERVAL);
          }
        };

        ws.current.onerror = (error) => {
          console.error('WebSocket Error:', error);
          ws.current?.close();
        };

    } catch (error) {
        console.error("Gagal mendapatkan URL WebSocket:", error);
         if (!reconnectTimeout.current) {
            reconnectTimeout.current = setTimeout(connectWebSocket, WS_RECONNECT_INTERVAL);
         }
    }
  }, [user, toast, audio]);

  useEffect(() => {
    if (user) {
        connectWebSocket();
    } else {
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }
        setIsConnected(false);
        setNotifications([]);
    }

    return () => {
        if (ws.current) {
            ws.current.close();
        }
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
        }
    };
  }, [user, connectWebSocket]);


  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const value = useMemo(() => ({
    notifications,
    markAsRead,
    isConnected,
  }), [notifications, markAsRead, isConnected]);
  
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within an NotificationProvider');
  }
  return context;
}
