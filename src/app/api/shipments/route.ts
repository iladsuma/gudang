import { db } from '@/lib/db';
import { shipments, products as productsTable, stockMovements, financialTransactions } from '@/app/drizzle/schema';
import { NextRequest, NextResponse } from 'next/server';
import { desc, eq, sql } from 'drizzle-orm';
import type { Shipment, ShipmentProduct } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all shipments
export async function GET() {
  try {
    const allShipments = await db.query.shipments.findMany({
      orderBy: [desc(shipments.createdAt)],
    });
    return NextResponse.json(allShipments, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}

// ADD a new shipment (order)
export async function POST(req: NextRequest) {
    try {
        const body: Omit<Shipment, 'id' | 'createdAt'> & { products: ShipmentProduct[] } = await req.json();
        const newShipmentId = `ship_${Date.now()}`;
        const financialTxId = `ft_${Date.now()}`;
        
        // Sanitize userId: if empty string or undefined, make it null to satisfy database
        const { userId, ...shipmentData } = body;
        const sanitizedUserId = (userId && userId.trim() !== '') ? userId : null;

        // Calculate Courier Cost (per kilo 750 profit, fee is 1000, so cost is 250)
        // Profit 750/km means deliveryFee (1000/km) - deliveryCost = 750/km -> deliveryCost = 250/km
        const distance = body.deliveryDistance || 0;
        const deliveryCost = distance * 250;

        await db.transaction(async (tx) => {
            // 1. Insert the shipment
            await tx.insert(shipments).values({
                ...shipmentData,
                userId: sanitizedUserId,
                id: newShipmentId,
                status: 'Proses',
                createdAt: new Date(),
                deliveryCost: deliveryCost,
            });

            // 2. Update stock for each product
            for (const product of body.products) {
                if (!product.productId) continue;

                const currentProduct = await tx.query.products.findFirst({ where: eq(productsTable.id, product.productId) });
                const stockBefore = currentProduct?.stock || 0;
                const stockAfter = stockBefore - product.quantity;

                await tx.update(productsTable)
                    .set({ stock: sql`${productsTable.stock} - ${product.quantity}` })
                    .where(eq(productsTable.id, product.productId));
                
                await tx.insert(stockMovements).values({
                    id: `sm_${Date.now()}_${product.productId}`,
                    productId: product.productId,
                    referenceId: newShipmentId,
                    type: 'Penjualan',
                    quantityChange: -product.quantity,
                    stockBefore: stockBefore,
                    stockAfter: stockAfter,
                    notes: `Penjualan untuk transaksi ${body.transactionId}`,
                });
            }
            
            // 3. Record the Down Payment if it exists
            if (body.downPayment && body.downPayment > 0 && body.accountId) {
                 await tx.insert(financialTransactions).values({
                    id: financialTxId,
                    accountId: body.accountId,
                    type: 'in',
                    amount: body.downPayment,
                    category: 'Uang Muka',
                    description: `DP untuk pesanan ${body.transactionId} (${body.customerName})`,
                    transactionDate: new Date().toISOString().split('T')[0],
                    referenceId: newShipmentId,
                 });
            }
        });

        const newShipment = await db.query.shipments.findFirst({ where: eq(shipments.id, newShipmentId) });
        
        return NextResponse.json(newShipment, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error("POST Shipment Error:", message);
        return NextResponse.json({ message }, { status: 500 });
    }
}