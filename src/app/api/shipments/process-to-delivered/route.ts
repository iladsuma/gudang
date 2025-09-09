
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {shipments as shipmentsTable, financialTransactions as ftTable} from '@/drizzle/schema';
import {inArray, eq} from 'drizzle-orm';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
    const {shipmentIds} = await request.json();

    if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
        return NextResponse.json({error: 'Invalid shipment IDs provided'}, {status: 400});
    }

    try {
       await db.transaction(async (tx) => {
            const shipmentsToUpdate = await tx.query.shipments.findMany({
                where: inArray(shipmentsTable.id, shipmentIds),
            });
            
            for (const shipment of shipmentsToUpdate) {
                await tx.insert(ftTable).values({
                    type: 'in',
                    amount: shipment.totalAmount,
                    category: 'Penjualan Tunai',
                    description: `Penjualan ${shipment.transactionId} kepada ${shipment.customerName}`,
                    transactionDate: format(new Date(), 'yyyy-MM-dd'),
                    referenceId: shipment.id,
                });
            }

            await tx.update(shipmentsTable)
                .set({status: 'Terkirim'})
                .where(inArray(shipmentsTable.id, shipmentIds));
        });

        return NextResponse.json({message: 'Shipments marked as delivered successfully'});

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to mark as delivered';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}
