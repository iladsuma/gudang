
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {
    shipments as shipmentsTable,
    products as productsTable,
    stockMovements as stockMovementsTable
} from '@/drizzle/schema';
import {inArray, eq, sql} from 'drizzle-orm';
import type {ShipmentProduct} from '@/lib/types';

export async function POST(request: NextRequest) {
    const {shipmentIds} = await request.json();

    if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
        return NextResponse.json({error: 'Invalid shipment IDs provided'}, {status: 400});
    }

    try {
        await db.transaction(async (tx) => {
            // 1. Get all selected shipments
            const selectedShipments = await tx.query.shipments.findMany({
                where: inArray(shipmentsTable.id, shipmentIds),
            });
            
            if (selectedShipments.length === 0) {
                 throw new Error("No valid shipments found to process.");
            }

            // 2. Reduce stock for each product in each shipment
            for (const shipment of selectedShipments) {
                const productsToUpdate = shipment.products as ShipmentProduct[];

                for (const product of productsToUpdate) {
                    const currentProduct = await tx.query.products.findFirst({
                        where: eq(productsTable.id, product.productId),
                        columns: { stock: true }
                    });

                    if (!currentProduct) {
                        throw new Error(`Product ${product.name} (${product.productId}) not found.`);
                    }

                    if (currentProduct.stock < product.quantity) {
                        throw new Error(`Stok tidak cukup untuk produk ${product.name}. Tersisa: ${currentProduct.stock}, Dibutuhkan: ${product.quantity}`);
                    }
                    
                    const stockBefore = currentProduct.stock;
                    const stockAfter = stockBefore - product.quantity;

                    // Update stock in products table
                    await tx.update(productsTable)
                        .set({ stock: sql`${productsTable.stock} - ${product.quantity}` })
                        .where(eq(productsTable.id, product.productId));
                        
                    // Insert into stock movements
                     await tx.insert(stockMovementsTable).values({
                        productId: product.productId,
                        referenceId: shipment.id,
                        type: 'Penjualan',
                        quantityChange: -product.quantity,
                        stockBefore: stockBefore,
                        stockAfter: stockAfter,
                        notes: `Penjualan dari No. Transaksi: ${shipment.transactionId}`
                    });
                }
            }

            // 3. Update the status of the shipments
            await tx.update(shipmentsTable)
                .set({status: 'Pengemasan'})
                .where(inArray(shipmentsTable.id, shipmentIds));
        });

        return NextResponse.json({message: 'Shipments processed to packaging successfully'});

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process shipments';
        console.error("Processing Error:", errorMessage);
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}
