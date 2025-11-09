
import { db } from '@/drizzle/db';
import { shipments, packagingOptions, financialTransactions } from '@/drizzle/schema';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import type { ShipmentProduct, User } from '@/lib/types';

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


export async function GET() {
    try {
        const allShipments = await db.select().from(shipments).orderBy(desc(shipments.createdAt));
        return NextResponse.json(allShipments);
    } catch (error) {
        console.error('Gagal mengambil data pengiriman:', error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ message: 'Gagal mengambil data pengiriman', error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        const { 
            userId, transactionId, customerId, customerName, expedition, 
            packagingId, accountId, products: shipmentProducts, receipt, paymentStatus, user // User object is passed from frontend
        } = body;

        if (!userId || !transactionId || !customerId || !customerName || !expedition || !packagingId || !paymentStatus) {
             return NextResponse.json({ message: 'Data yang dikirim tidak lengkap.' }, { status: 400 });
        }
        
        if (paymentStatus === 'Lunas' && !accountId) {
             return NextResponse.json({ message: 'Akun pembayaran harus dipilih untuk transaksi lunas.' }, { status: 400 });
        }

        const totalItems = shipmentProducts.reduce((sum: number, p: ShipmentProduct) => sum + p.quantity, 0);
        const totalProductCost = shipmentProducts.reduce((sum: number, p: ShipmentProduct) => sum + p.price * p.quantity, 0);
        
        let totalPackingCost = 0;
        if (packagingId) {
             try {
                const packagingResult = await db.select({cost: packagingOptions.cost}).from(packagingOptions).where(eq(packagingOptions.id, packagingId)).limit(1);
                if (packagingResult.length > 0) {
                    totalPackingCost = packagingResult[0].cost;
                }
            } catch (dbError) {
                console.error("FATAL: Error saat mengambil biaya kemasan dari DB:", dbError);
                throw new Error("Gagal mengambil data biaya kemasan.");
            }
        }
        
        const totalAmount = totalProductCost + totalPackingCost;
        
        const [newShipment] = await db.transaction(async (tx) => {
            const shipmentDataToInsert = {
                userId,
                transactionId,
                customerId,
                customerName,
                expedition,
                packagingId,
                accountId: paymentStatus === 'Lunas' ? accountId : null,
                status: 'Proses' as const,
                paymentStatus: paymentStatus,
                products: shipmentProducts,
                receipt,
                totalItems,
                totalProductCost,
                totalPackingCost,
                totalAmount,
                totalRevenue: totalAmount,
            };
             const [createdShipment] = await tx.insert(shipments).values(shipmentDataToInsert).returning();

            if (paymentStatus === 'Lunas' && accountId) {
                const financialTxData = {
                    accountId: accountId,
                    type: 'in' as const,
                    amount: totalAmount,
                    category: 'Penjualan',
                    description: `Penjualan dari transaksi ${transactionId}`,
                    transactionDate: new Date().toISOString().split('T')[0],
                    referenceId: createdShipment.id,
                };
                 await tx.insert(financialTransactions).values(financialTxData);
            }

            return [createdShipment];
        });
        
        // Send notification to admins
        if (user) {
            await sendNotification({
                recipient: 'admin',
                message: `Kiriman baru #${transactionId} dibuat oleh ${user.username}.`
            });
        }

        return NextResponse.json(newShipment, { status: 201 });

    } catch (error) {
        console.error('FATAL: Gagal membuat pengiriman pada /api/shipments/route.ts:', error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ message: 'failed to create shipment', error: message }, { status: 500 });
    }
}
