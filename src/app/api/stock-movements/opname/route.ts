
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {
    stockMovements as stockMovementsTable,
    products as productsTable,
} from '@/drizzle/schema';
import {eq, and, gte, lte, desc} from 'drizzle-orm';

export async function GET(request: NextRequest) {
    const {searchParams} = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
        return NextResponse.json({error: 'Start date and end date are required'}, {status: 400});
    }

    try {
        const movements = await db.select({
                id: stockMovementsTable.id,
                productId: stockMovementsTable.productId,
                productCode: productsTable.code,
                productName: productsTable.name,
                referenceId: stockMovementsTable.referenceId,
                type: stockMovementsTable.type,
                quantityChange: stockMovementsTable.quantityChange,
                stockBefore: stockMovementsTable.stockBefore,
                stockAfter: stockMovementsTable.stockAfter,
                notes: stockMovementsTable.notes,
                createdAt: stockMovementsTable.createdAt,
            })
            .from(stockMovementsTable)
            .leftJoin(productsTable, eq(stockMovementsTable.productId, productsTable.id))
            .where(
                and(
                    eq(stockMovementsTable.type, 'Stok Opname'),
                    gte(stockMovementsTable.createdAt, new Date(startDate)),
                    lte(stockMovementsTable.createdAt, new Date(endDate))
                )
            )
            .orderBy(desc(stockMovementsTable.createdAt));

        return NextResponse.json(movements);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch opname movements';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}
