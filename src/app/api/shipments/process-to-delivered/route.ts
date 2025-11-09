
import { db } from '@/drizzle/db';
import { shipments } from '@/drizzle/schema';
import { inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

async function sendNotification(body: any) {
  try {
    // We call our own API route to broadcast the message via WebSocket
    // This is a workaround to access the WebSocket server from a serverless function
    const url = process.env.NODE_ENV === 'production'
      ? `https://gudang-checkout-nine.vercel.app/api/ws` 
      : 'http://localhost:9002/api/ws';

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shipmentIds } = body;

    if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return NextResponse.json({ message: 'Data ID pengiriman tidak valid' }, { status: 400 });
    }

    const shipmentsToUpdate = await db.query.shipments.findMany({
        where: inArray(shipments.id, shipmentIds),
    });

    if (shipmentsToUpdate.length === 0) {
        return NextResponse.json({ message: 'Pengiriman tidak ditemukan' }, { status: 404 });
    }

    await db.transaction(async (tx) => {
        await tx.update(shipments)
            .set({ status: 'Terkirim' })
            .where(inArray(shipments.id, shipmentIds));

        for (const shipment of shipmentsToUpdate) {
            await sendNotification({
                recipient: shipment.userId,
                message: `Pesanan Anda ${shipment.transactionId} telah dikirim.`
            });
        }
    });

    return NextResponse.json({ message: `${shipmentIds.length} pengiriman berhasil ditandai terkirim.` });
  } catch (error) {
    console.error('Gagal menandai terkirim:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal';
    return NextResponse.json({ message: 'Gagal menandai terkirim: ' + errorMessage }, { status: 500 });
  }
}
