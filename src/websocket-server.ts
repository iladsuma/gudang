
import { WebSocketServer, WebSocket } from 'ws';
import type { User, Notification } from './lib/types';

interface ExtendedWebSocket extends WebSocket {
  userId: string;
  role: 'admin' | 'user';
  isAlive: boolean;
}

// This is a simple in-memory store for our WebSocket server.
// In a production environment, you might want to use a more robust solution
// like Redis to handle multiple server instances.
const clients = new Map<string, ExtendedWebSocket>();
const admins = new Map<string, ExtendedWebSocket>();

function broadcastToAdmins(message: object) {
  const stringifiedMessage = JSON.stringify(message);
  admins.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(stringifiedMessage);
    }
  });
}

function sendToUser(userId: string, message: object) {
  const stringifiedMessage = JSON.stringify(message);
  clients.forEach((ws) => {
    if (ws.userId === userId && ws.readyState === WebSocket.OPEN) {
      ws.send(stringifiedMessage);
    }
  });
}

function heartbeat() {
  const allClients = [...clients.values(), ...admins.values()];
  allClients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}

let wss: WebSocketServer | null = null;
let interval: NodeJS.Timeout | null = null;

export function initializeWebSocketServer(server: any) {
  if (wss) {
    console.log('WebSocket server already initialized.');
    return wss;
  }

  wss = new WebSocketServer({ server });
  console.log('✅ WebSocket server initialized.');

  wss.on('connection', (ws: ExtendedWebSocket) => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'register' && data.user) {
          const user: User = data.user;
          ws.userId = user.id;
          ws.role = user.role;
          if (user.role === 'admin') {
            admins.set(user.id, ws);
            clients.delete(user.id); // Remove from clients if they were there
          } else {
            clients.set(user.id, ws);
            admins.delete(user.id); // Ensure not in admins
          }
          console.log(`Client registered: ${user.username} (Role: ${user.role})`);
        }
      } catch (error) {
        console.error('Failed to parse message or register client:', error);
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        clients.delete(ws.userId);
        admins.delete(ws.userId);
        console.log(`Client disconnected: ${ws.userId}`);
      }
    });
  });

  if (interval) clearInterval(interval);
  interval = setInterval(heartbeat, 30000);

  return wss;
}

export function broadcastNotification(notification: { recipient: 'admin' | string; message: string }) {
    const payload: Notification = {
        id: `notif_${Date.now()}`,
        recipientId: notification.recipient,
        message: notification.message,
        isRead: false,
        createdAt: Date.now(),
    };

    const message = {
        type: 'notification',
        payload: payload,
    };
    
    if (notification.recipient === 'admin') {
        broadcastToAdmins(message);
    } else {
        sendToUser(notification.recipient, message);
    }
}
