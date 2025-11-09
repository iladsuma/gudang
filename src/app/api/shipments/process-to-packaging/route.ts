
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { shipments, products, stockMovements } from '@/drizzle/schema';
import { inArray, eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    const { shipmentIds } = await request.json();

    if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
        return NextResponse.json({ error: 'Shipment IDs are required' }, { status: 400 });
    }

    try {
        await db.transaction(async (tx) => {
            const shipmentsToProcess = await tx.select().from(shipments).where(inArray(shipments.id, shipmentIds));

            for (const shipment of shipmentsToProcess) {
                for (const product of shipment.products as any[]) {
                    const currentProduct = await tx.query.products.findFirst({
                        where: eq(products.id, product.productId),
                        columns: { stock: true }
                    });

                    if (!currentProduct) {
                        throw new Error(`Product with ID ${product.productId} not found.`);
                    }

                    if (currentProduct.stock < product.quantity) {
                        throw new Error(`Insufficient stock for product ${product.name}. Required: ${product.quantity}, Available: ${currentProduct.stock}`);
                    }

                    // Reduce stock
                    await tx.update(products)
                        .set({ stock: sql`${products.stock} - ${product.quantity}` })
                        .where(eq(products.id, product.productId));
                    
                    // Log stock movement
                    await tx.insert(stockMovements).values({
                        productId: product.productId,
                        referenceId: shipment.id,
                        type: 'Penjualan',
                        quantityChange: -product.quantity,
                        stockBefore: currentProduct.stock,
                        stockAfter: currentProduct.stock - product.quantity,
                        notes: `Penjualan dari No. Transaksi: ${shipment.transactionId}`
                    });
                }

                // Update shipment status
                await tx.update(shipments)
                    .set({ status: 'Pengemasan' })
                    .where(eq(shipments.id, shipment.id));
            }
        });

        return NextResponse.json({ message: 'Shipments processed to packaging successfully.' });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process shipments';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
