
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { products, stockMovements } from '@/drizzle/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const { id: productId } = params;
    try {
        const { newStock, notes } = await request.json();

        if (typeof newStock !== 'number' || !notes) {
            return NextResponse.json({ error: 'New stock and notes are required' }, { status: 400 });
        }

        let updatedProduct;
        await db.transaction(async (tx) => {
            const product = await tx.query.products.findFirst({
                where: eq(products.id, productId),
                columns: { stock: true }
            });

            if (!product) {
                throw new Error('Product not found');
            }

            const stockBefore = product.stock;
            const quantityChange = newStock - stockBefore;

            [updatedProduct] = await tx.update(products)
                .set({ stock: newStock })
                .where(eq(products.id, productId))
                .returning();
            
            await tx.insert(stockMovements).values({
                productId: productId,
                type: 'Stok Opname',
                quantityChange: quantityChange,
                stockBefore: stockBefore,
                stockAfter: newStock,
                notes: notes,
            });
        });

        return NextResponse.json(updatedProduct);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update stock';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
