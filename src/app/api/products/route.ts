
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {products, stockMovements} from '@/lib/schema';
import {asc, desc} from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sortBy = searchParams.get('sortBy') || 'code';
        const sortOrder = searchParams.get('sortOrder') || 'asc';
        
        const column = products[sortBy as keyof typeof products];
        const orderBy = sortOrder === 'asc' ? asc(column) : desc(column);

        const allProducts = await db.select().from(products).orderBy(orderBy);
        return NextResponse.json(allProducts);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to fetch products:', error);
        return NextResponse.json({error: 'Failed to fetch products', message}, {status: 500});
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const [newProduct] = await db.insert(products).values(body).returning();
        
        // Create initial stock movement
        if(newProduct.stock > 0) {
            await db.insert(stockMovements).values({
                productId: newProduct.id,
                type: 'Stok Awal',
                quantityChange: newProduct.stock,
                stockBefore: 0,
                stockAfter: newProduct.stock,
                notes: 'Stok awal saat produk dibuat',
            });
        }
        
        return NextResponse.json(newProduct, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to create product:', error);
        return NextResponse.json({error: 'Failed to create product', message}, {status: 500});
    }
}
