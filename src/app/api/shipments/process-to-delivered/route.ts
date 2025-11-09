
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { shipments, financialTransactions, accounts } from '@/drizzle/schema';
import { inArray, eq, sql } from 'drizzle-orm';
import { format } from 'date-fns';


export async function POST(request: NextRequest) {
    const { shipmentIds } = await request.json();

    if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
        return NextResponse.json({ error: 'Shipment IDs are required' }, { status: 400 });
    }
    
    try {
        await db.transaction(async (tx) => {
            for (const id of shipmentIds) {
                const shipmentToDeliver = await tx.query.shipments.findFirst({
                    where: eq(shipments.id, id),
                });
                
                if (!shipmentToDeliver) {
                    throw new Error(`Shipment with ID ${id} not found.`);
                }
                
                if (!shipmentToDeliver.accountId) {
                    throw new Error(`Shipment ${shipmentToDeliver.transactionId} is missing an account ID.`);
                }

                // Update shipment status
                await tx.update(shipments)
                    .set({ status: 'Terkirim', paymentStatus: 'Lunas', paidAt: new Date() })
                    .where(eq(shipments.id, id));

                // Create financial transaction
                await tx.insert(financialTransactions).values({
                    accountId: shipmentToDeliver.accountId,
                    type: 'in',
                    amount: shipmentToDeliver.totalAmount,
                    category: 'Penjualan Online',
                    description: `Penjualan ${shipmentToDeliver.transactionId} kepada ${shipmentToDeliver.customerName}`,
                    transactionDate: format(new Date(), 'yyyy-MM-dd'),
                    referenceId: id,
                });
                
                // Update account balance
                await tx.update(accounts)
                    .set({ balance: sql`${accounts.balance} + ${shipmentToDeliver.totalAmount}`})
                    .where(eq(accounts.id, shipmentToDeliver.accountId));
            }
        });
        
         return NextResponse.json({ message: 'Shipments processed to delivered successfully.' });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process shipments';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
