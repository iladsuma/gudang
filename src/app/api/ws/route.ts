
import { initializeWebSocketServer, broadcastNotification } from '@/websocket-server';
import { NextRequest, NextResponse } from 'next/server';

const PORT = 3001;

function ensureWebSocketServer() {
    if (!(global as any).webSocketServer) {
        console.log('Creating new WebSocket server instance...');
        const wss = initializeWebSocketServer(new (require('ws').Server)({ port: PORT }));
        (global as any).webSocketServer = wss;
    } else {
        console.log('Reusing existing WebSocket server instance.');
    }
}

export async function GET() {
    ensureWebSocketServer();
    const url = process.env.NODE_ENV === 'production' 
        ? `wss://gudang-checkout-nine.vercel.app` // Replace with your actual production WebSocket URL
        : `ws://localhost:${PORT}`;

    return NextResponse.json({ url });
}

export async function POST(request: NextRequest) {
    ensureWebSocketServer();
    const body = await request.json();

    if (!body.recipient || !body.message) {
        return NextResponse.json({ message: 'Invalid notification payload' }, { status: 400 });
    }

    try {
        broadcastNotification({ recipient: body.recipient, message: body.message });
        return NextResponse.json({ message: 'Notification broadcasted' }, { status: 200 });
    } catch (error) {
        console.error('Failed to broadcast notification:', error);
        return NextResponse.json({ message: 'Failed to broadcast notification' }, { status: 500 });
    }
}
