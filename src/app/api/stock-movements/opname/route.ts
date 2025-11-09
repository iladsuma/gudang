
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { stockMovements } from '@/drizzle/schema';
import { and, gte, lte, eq, desc } from 'drizzle-orm';
import { format, parseISO } from 'date-fns';


export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
        return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    try {
        const movements = await db.query.stockMovements.findMany({
            where: and(
                eq(stockMovements.type, 'Stok Opname'),
                gte(stockMovements.createdAt, parseISO(startDate)),
                lte(stockMovements.createdAt, parseISO(endDate))
            ),
            with: {
                product: {
                    columns: {
                        code: true,
                        name: true,
                    },
                },
            },
            orderBy: [desc(stockMovements.createdAt)]
        });

        const result = movements.map(m => ({
            ...m,
            productCode: (m as any).product?.code || 'N/A',
            productName: (m as any).product?.name || 'N/A',
        }));

        return NextResponse.json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stock opname movements';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
