
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {products as productsTable} from '@/drizzle/schema';
import {eq, desc, asc, inArray} from 'drizzle-orm';
import {SortableProductField, SortOrder, Product} from '@/lib/types';
import initialData from '../../../../db.json';


export async function GET(request: NextRequest) {
    const {searchParams} = new URL(request.url);
    const sortBy = searchParams.get('sortBy') as SortableProductField || 'code';
    const sortOrder = searchParams.get('sortOrder') as SortOrder || 'asc';

    try {
        const sortColumn = productsTable[sortBy];
        const sortFunction = sortOrder === 'asc' ? asc : desc;

        const allProducts = await db.select().from(productsTable).orderBy(sortFunction(sortColumn));
        return NextResponse.json(allProducts);
    } catch (error) {
        console.error("Failed to fetch products from DB, providing fallback data:", error);
        // Provide a fallback for development/testing if DB connection fails
        const fallbackProducts: Product[] = initialData.products;
        return NextResponse.json(fallbackProducts);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const [newProduct] = await db.insert(productsTable).values(body).returning();
        return NextResponse.json(newProduct);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const {ids} = body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({error: 'Invalid product IDs provided'}, {status: 400});
        }
        await db.delete(productsTable).where(inArray(productsTable.id, ids));
        return NextResponse.json({message: 'Products deleted successfully'});
    } catch (error) {
        return NextResponse.json({error: 'Failed to delete products'}, {status: 500});
    }
}
