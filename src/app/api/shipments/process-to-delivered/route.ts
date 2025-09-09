
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {shipments as shipmentsTable, financialTransactions as ftTable, accounts as accountsTable} from '@/drizzle/schema';
import {inArray, eq, sql} from 'drizzle-orm';
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
                if(!shipment.accountId) {
                    // This is a safeguard, though UI should prevent this.
                    throw new Error(`Shipment ${shipment.transactionId} does not have a payment account set.`);
                }
                
                await tx.insert(ftTable).values({
                    accountId: shipment.accountId,
                    type: 'in',
                    amount: shipment.totalAmount,
                    category: 'Penjualan Online',
                    description: `Penjualan ${shipment.transactionId} kepada ${shipment.customerName}`,
                    transactionDate: format(new Date(), 'yyyy-MM-dd'),
                    referenceId: shipment.id,
                });
                
                 await tx.update(accountsTable)
                    .set({ balance: sql`${accountsTable.balance} + ${shipment.totalAmount}`})
                    .where(eq(accountsTable.id, shipment.accountId));
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
