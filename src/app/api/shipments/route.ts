
import { db } from '@/drizzle/db';
import { shipments, packagingOptions, financialTransactions } from '@/drizzle/schema';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import type { ShipmentProduct } from '@/lib/types';

export async function GET() {
    try {
        const allShipments = await db.select().from(shipments).orderBy(desc(shipments.createdAt));
        return NextResponse.json(allShipments);
    } catch (error) {
        console.error('Failed to fetch shipments:', error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ message: 'Failed to fetch shipments', error: errorMessage }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        const { 
            userId, transactionId, customerId, customerName, expedition, 
            packagingId, accountId, products: shipmentProducts, receipt, paymentStatus
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
            const packagingResult = await db.select({cost: packagingOptions.cost}).from(packagingOptions).where(eq(packagingOptions.id, packagingId)).limit(1);
            if (packagingResult.length > 0) {
                totalPackingCost = packagingResult[0].cost;
            }
        }
        
        const totalAmount = totalProductCost + totalPackingCost;
        
        const [newShipment] = await db.transaction(async (tx) => {
             const [createdShipment] = await tx.insert(shipments).values({
                userId,
                transactionId,
                customerId,
                customerName,
                expedition,
                packagingId,
                accountId,
                status: 'Proses',
                paymentStatus: paymentStatus,
                products: shipmentProducts,
                receipt,
                totalItems,
                totalProductCost,
                totalPackingCost,
                totalAmount,
                totalRevenue: totalAmount,
            }).returning();

            if (paymentStatus === 'Lunas' && accountId) {
                 await tx.insert(financialTransactions).values({
                    accountId: accountId,
                    type: 'in',
                    amount: totalAmount,
                    category: 'Penjualan',
                    description: `Penjualan dari transaksi ${transactionId}`,
                    transactionDate: new Date().toISOString().split('T')[0],
                    referenceId: createdShipment.id,
                });
            }

            return [createdShipment];
        });

        return NextResponse.json(newShipment, { status: 201 });
    } catch (error) {
        console.error('Failed to create shipment:', error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ message: 'failed to create shipment', error: message }, { status: 500 });
    }
}
