
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {
    purchases as purchasesTable,
    products as productsTable,
    stockMovements as stockMovementsTable,
} from '@/drizzle/schema';
import {desc, eq, sql} from 'drizzle-orm';
import type {Purchase, PurchaseProduct} from '@/lib/types';

export async function GET() {
    try {
        const allPurchases = await db.select().from(purchasesTable).orderBy(desc(purchasesTable.createdAt));
        return NextResponse.json(allPurchases);
    } catch (error) {
        return NextResponse.json({error: 'Failed to fetch purchases'}, {status: 500});
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let newPurchase: Purchase;

        await db.transaction(async (tx) => {
            const {supplierId, supplierName, purchaseNumber, products} = body;

            if (!products || products.length === 0) {
                throw new Error("Purchase must have at least one product.");
            }

            const totalAmount = products.reduce((sum: number, p: PurchaseProduct) => sum + p.costPrice * p.quantity, 0);

            const purchaseData: Omit<Purchase, 'id' | 'createdAt'> = {
                supplierId,
                supplierName,
                purchaseNumber,
                status: 'Selesai',
                products,
                totalAmount,
            };

            const [insertedPurchase] = await tx.insert(purchasesTable).values(purchaseData as any).returning();
            newPurchase = insertedPurchase;

            for (const product of products) {
                const currentProduct = await tx.query.products.findFirst({where: eq(productsTable.id, product.productId)});
                if (!currentProduct) {
                    throw new Error(`Product with ID ${product.productId} not found.`);
                }
                const stockBefore = currentProduct.stock;
                const stockAfter = stockBefore + product.quantity;

                await tx.update(productsTable)
                    .set({stock: sql`${productsTable.stock} + ${product.quantity}`})
                    .where(eq(productsTable.id, product.productId));

                await tx.insert(stockMovementsTable).values({
                    productId: product.productId,
                    referenceId: newPurchase.id,
                    type: 'Pembelian',
                    quantityChange: product.quantity,
                    stockBefore: stockBefore,
                    stockAfter: stockAfter,
                    notes: `Pembelian dari ${supplierName} - No: ${purchaseNumber}`,
                });
            }
        });

        return NextResponse.json(newPurchase!, {status: 201});
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create purchase';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}
