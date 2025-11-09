
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {stockMovements} from '@/drizzle/schema';
import {eq, desc} from 'drizzle-orm';

export async function GET(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id: productId} = params;
        const movements = await db.select().from(stockMovements).where(eq(stockMovements.productId, productId)).orderBy(desc(stockMovements.createdAt));
        return NextResponse.json(movements);
    } catch (error) {
        return NextResponse.json({error: 'Failed to fetch stock movements'}, {status: 500});
    }
}
