
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {products as productsTable} from '@/drizzle/schema';
import {asc, desc, inArray} from 'drizzle-orm';
import type { Product, SortableProductField, SortOrder } from '@/lib/types';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const sortBy = (searchParams.get('sortBy') || 'code') as SortableProductField;
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as SortOrder;

    try {
        const allProducts = await db.select().from(productsTable).orderBy(
            sortOrder === 'asc' ? asc(productsTable[sortBy]) : desc(productsTable[sortBy])
        );
        return NextResponse.json(allProducts);
    } catch (error) {
        // Fallback to db.json if database is not available
        console.error("Failed to fetch products from DB, falling back to db.json", error);
        try {
            const dbJson = await import('../../../../db.json');
            const sorted = [...dbJson.products].sort((a, b) => {
                if (a[sortBy] < b[sortBy]) return sortOrder === 'asc' ? -1 : 1;
                if (a[sortBy] > b[sortBy]) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
            return NextResponse.json(sorted);
        } catch (fallbackError) {
             console.error("Failed to read fallback db.json", fallbackError);
             return NextResponse.json({error: 'Failed to fetch products'}, {status: 500});
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as Omit<Product, 'id'>;
        const [newProduct] = await db.insert(productsTable).values(body).returning();
        return NextResponse.json(newProduct);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const {ids} = await request.json() as { ids: string[] };
        if (!ids || ids.length === 0) {
            return NextResponse.json({error: 'No product IDs provided'}, {status: 400});
        }
        await db.delete(productsTable).where(inArray(productsTable.id, ids));
        return NextResponse.json({message: 'Products deleted successfully'});
    } catch (error) {
        return NextResponse.json({error: 'Failed to delete products'}, {status: 500});
    }
}
