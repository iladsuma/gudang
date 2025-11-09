
import { db } from '@/drizzle/db';
import { shipments } from '@/drizzle/schema';
import { inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getNotificationContext } from '@/context/notification-context';

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

    // Lakukan transaksi database
    await db.transaction(async (tx) => {
        // 1. Update status pengiriman
        await tx.update(shipments)
            .set({ status: 'Terkirim' })
            .where(inArray(shipments.id, shipmentIds));

        // 2. Kirim notifikasi untuk setiap pengiriman yang diupdate
        for (const shipment of shipmentsToUpdate) {
            getNotificationContext().createNotification({
                recipientId: shipment.userId,
                message: `Pesanan Anda #${shipment.transactionId} telah dikirim.`,
                url: '/my-shipments',
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
