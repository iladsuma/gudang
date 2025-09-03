
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {stockMovements as stockMovementsTable} from '@/drizzle/schema';
import {eq, desc} from 'drizzle-orm';

export async function GET(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        const movements = await db.select()
            .from(stockMovementsTable)
            .where(eq(stockMovementsTable.productId, id))
            .orderBy(desc(stockMovementsTable.createdAt));
            
        return NextResponse.json(movements);
    } catch (error) {
        return NextResponse.json({error: 'Failed to fetch stock movements'}, {status: 500});
    }
}
