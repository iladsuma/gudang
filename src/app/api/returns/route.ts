
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {
    returns as returnsTable,
    shipments as shipmentsTable,
    products as productsTable,
    stockMovements as stockMovementsTable,
} from '@/drizzle/schema';
import {desc, eq, sql} from 'drizzle-orm';
import type {Return, ReturnedProduct} from '@/lib/types';

export async function GET() {
    try {
        const allReturns = await db.select().from(returnsTable).orderBy(desc(returnsTable.createdAt));
        return NextResponse.json(allReturns);
    } catch (error) {
        return NextResponse.json({error: 'Failed to fetch returns'}, {status: 500});
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {originalShipmentId, products, reason} = body;
        let newReturn: Return;

        if (!products || products.length === 0) {
            throw new Error("Return must have at least one product.");
        }

        await db.transaction(async (tx) => {
            const originalShipment = await tx.query.shipments.findFirst({
                where: eq(shipmentsTable.id, originalShipmentId),
            });

            if (!originalShipment) {
                throw new Error("Original shipment not found.");
            }

            const totalAmount = products.reduce((sum: number, p: ReturnedProduct) => sum + p.price * p.quantity, 0);

            const returnData: Omit<Return, 'id' | 'createdAt'> = {
                originalShipmentId,
                originalTransactionId: originalShipment.transactionId,
                customerName: originalShipment.customerName,
                products,
                reason,
                totalAmount,
            };

            const [insertedReturn] = await tx.insert(returnsTable).values(returnData as any).returning();
            newReturn = insertedReturn;

            for (const product of products) {
                const currentProduct = await tx.query.products.findFirst({where: eq(productsTable.id, product.productId)});
                 if (!currentProduct) {
                    throw new Error(`Product with ID ${product.productId} not found during return process.`);
                }
                const stockBefore = currentProduct.stock;
                const stockAfter = stockBefore + product.quantity;

                await tx.update(productsTable)
                    .set({stock: sql`${productsTable.stock} + ${product.quantity}`})
                    .where(eq(productsTable.id, product.productId));

                await tx.insert(stockMovementsTable).values({
                    productId: product.productId,
                    referenceId: newReturn.id,
                    type: 'Retur',
                    quantityChange: product.quantity,
                    stockBefore: stockBefore,
                    stockAfter: stockAfter,
                    notes: `Retur dari No. Transaksi: ${originalShipment.transactionId}`,
                });
            }
        });

        return NextResponse.json(newReturn!, {status: 201});
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create return';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}
