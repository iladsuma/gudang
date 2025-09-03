
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {
    products as productsTable,
    stockMovements as stockMovementsTable
} from '@/drizzle/schema';
import {eq} from 'drizzle-orm';

export async function PUT(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        const body = await request.json();
        const {newStock, notes} = body;

        if (typeof newStock !== 'number' || newStock < 0) {
            return NextResponse.json({error: 'Invalid stock value'}, {status: 400});
        }
        
        let updatedProduct;

        await db.transaction(async (tx) => {
            const currentProduct = await tx.query.products.findFirst({
                where: eq(productsTable.id, id),
            });

            if (!currentProduct) {
                throw new Error('Product not found');
            }
            
            const stockBefore = currentProduct.stock;
            const quantityChange = newStock - stockBefore;

            [updatedProduct] = await tx.update(productsTable)
                .set({stock: newStock})
                .where(eq(productsTable.id, id))
                .returning();
            
            await tx.insert(stockMovementsTable).values({
                productId: id,
                type: 'Stok Opname',
                quantityChange: quantityChange,
                stockBefore: stockBefore,
                stockAfter: newStock,
                notes: notes || 'Penyesuaian stok manual',
            });
        });

        if (!updatedProduct) {
            return NextResponse.json({error: 'Product not found'}, {status: 404});
        }

        return NextResponse.json(updatedProduct);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update product stock';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}
