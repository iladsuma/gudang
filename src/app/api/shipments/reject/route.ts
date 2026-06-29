import { db } from '@/lib/db';
import { shipments } from '@/app/drizzle/schema';
import { NextRequest, NextResponse } from 'next/server';
import { inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { shipmentIds } = await req.json();
        
        if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
            return NextResponse.json({ message: 'Pilih pesanan' }, { status: 400 });
        }

        // When a tailor rejects, we just clear the userId so it becomes available for others to see again as "New"
        await db.update(shipments)
            .set({ userId: null })
            .where(inArray(shipments.id, shipmentIds));

        return NextResponse.json({ count: shipmentIds.length }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: String(error) }, { status: 500 });
    }
}