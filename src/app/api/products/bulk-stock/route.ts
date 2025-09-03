
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {
    products as productsTable,
    stockMovements as stockMovementsTable
} from '@/drizzle/schema';
import {eq, inArray} from 'drizzle-orm';

interface StockUpdate {
    code: string;
    physicalStock: number;
    notes: string;
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const {updates} = body as { updates: StockUpdate[] };

        if (!Array.isArray(updates) || updates.length === 0) {
            return NextResponse.json({error: 'Invalid update data'}, {status: 400});
        }

        const codes = updates.map(u => u.code);
        const existingProducts = await db.select().from(productsTable).where(inArray(productsTable.code, codes));

        const productMap = new Map(existingProducts.map(p => [p.code, p]));
        let successCount = 0;
        let failureCount = 0;

        await db.transaction(async (tx) => {
            for (const update of updates) {
                const product = productMap.get(update.code);
                if (product) {
                    const stockBefore = product.stock;
                    const stockAfter = update.physicalStock;
                    const quantityChange = stockAfter - stockBefore;

                    await tx.update(productsTable)
                        .set({stock: stockAfter})
                        .where(eq(productsTable.id, product.id));

                    await tx.insert(stockMovementsTable).values({
                        productId: product.id,
                        referenceId: `opname_${new Date().toISOString()}`,
                        type: 'Stok Opname',
                        quantityChange,
                        stockBefore,
                        stockAfter,
                        notes: update.notes,
                    });
                    successCount++;
                } else {
                    failureCount++;
                }
            }
        });
        
        return NextResponse.json({success: successCount, failure: failureCount});

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to perform bulk stock update';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}
