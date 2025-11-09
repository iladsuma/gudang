
import { db } from '@/drizzle/db';
import { shipments, products, financialTransactions } from '@/drizzle/schema';
import { desc, eq, inArray } from 'drizzle-orm';
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
        
        // Destructuring with validation
        const { 
            userId, transactionId, customerId, customerName, expedition, 
            packagingId, accountId, products: shipmentProducts, receipt, paymentStatus
        } = body;

        if (!userId || !transactionId || !customerId || !customerName || !expedition || !packagingId || !accountId || !shipmentProducts) {
             return NextResponse.json({ message: 'Data yang dikirim tidak lengkap.' }, { status: 400 });
        }

        // Calculate totals server-side to ensure data integrity
        const totalItems = shipmentProducts.reduce((sum: number, p: ShipmentProduct) => sum + p.quantity, 0);
        const totalProductCost = shipmentProducts.reduce((sum: number, p: ShipmentProduct) => sum + p.price * p.quantity, 0);
        
        // Find packaging cost
        const packagingOption = await db.query.packagingOptions.findFirst({
            where: eq(db.query.packagingOptions.findFirst.table.id, packagingId)
        });
        const totalPackingCost = packagingOption?.cost ?? 0;
        
        const totalAmount = totalProductCost + totalPackingCost;
        const totalRevenue = totalAmount; // For direct sales model
        const totalCOGS = shipmentProducts.reduce((sum: number, p: ShipmentProduct) => sum + p.costPrice * p.quantity, 0);

        // --- Start Transaction ---
        const [newShipment] = await db.transaction(async (tx) => {
            // 1. Create the shipment record
             const [createdShipment] = await tx.insert(shipments).values({
                userId,
                transactionId,
                customerId,
                customerName,
                expedition,
                packagingId,
                accountId,
                status: 'Proses', // All new shipments start as 'Proses'
                paymentStatus: paymentStatus || 'Lunas',
                products: shipmentProducts,
                receipt,
                totalItems,
                totalProductCost,
                totalPackingCost,
                totalAmount,
                totalRevenue,
            }).returning();

            // 2. Create financial transaction for this sale
            await tx.insert(financialTransactions).values({
                accountId: accountId,
                type: 'in',
                amount: totalAmount,
                category: 'Penjualan',
                description: `Penjualan dari transaksi ${transactionId}`,
                transactionDate: new Date().toISOString().split('T')[0],
                referenceId: createdShipment.id,
            });

            return [createdShipment];
        });
        // --- End Transaction ---

        return NextResponse.json(newShipment, { status: 201 });
    } catch (error) {
        console.error('Failed to create shipment:', error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ message: 'Failed to create shipment', error: message }, { status: 500 });
    }
}
