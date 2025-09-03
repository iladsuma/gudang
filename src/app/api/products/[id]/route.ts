
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {products as productsTable} from '@/drizzle/schema';
import {eq} from 'drizzle-orm';

export async function PUT(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        const body = await request.json();
        const [updatedProduct] = await db.update(productsTable).set(body).where(eq(productsTable.id, id)).returning();
        if (!updatedProduct) {
            return NextResponse.json({error: 'Product not found'}, {status: 404});
        }
        return NextResponse.json(updatedProduct);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}

export async function DELETE(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        await db.delete(productsTable).where(eq(productsTable.id, id));
        return NextResponse.json({message: 'Product deleted successfully'});
    } catch (error) {
        return NextResponse.json({error: 'Failed to delete product'}, {status: 500});
    }
}
