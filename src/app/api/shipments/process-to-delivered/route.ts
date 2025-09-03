
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {shipments as shipmentsTable} from '@/drizzle/schema';
import {inArray} from 'drizzle-orm';

export async function POST(request: NextRequest) {
    const {shipmentIds} = await request.json();

    if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
        return NextResponse.json({error: 'Invalid shipment IDs provided'}, {status: 400});
    }

    try {
        await db.update(shipmentsTable)
            .set({status: 'Terkirim'})
            .where(inArray(shipmentsTable.id, shipmentIds));

        return NextResponse.json({message: 'Shipments marked as delivered successfully'});

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to mark as delivered';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}
