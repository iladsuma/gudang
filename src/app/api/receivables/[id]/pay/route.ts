
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { shipments, financialTransactions, accounts } from '@/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { format } from 'date-fns';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const { id: shipmentId } = params;
    const body = await request.json();
    const { accountId, paidAt } = body;

    if (!accountId || !paidAt) {
        return NextResponse.json({ error: 'Account ID and payment date are required' }, { status: 400 });
    }

    try {
        await db.transaction(async (tx) => {
            const shipmentToPay = await tx.query.shipments.findFirst({
                where: eq(shipments.id, shipmentId),
            });

            if (!shipmentToPay) {
                throw new Error('Shipment not found');
            }
            if (shipmentToPay.paymentStatus === 'Lunas') {
                throw new Error('This shipment has already been paid');
            }

            // 1. Update shipment status
            await tx.update(shipments)
                .set({
                    paymentStatus: 'Lunas',
                    paidAt: new Date(paidAt),
                })
                .where(eq(shipments.id, shipmentId));

            // 2. Create financial transaction for the payment
            await tx.insert(financialTransactions).values({
                accountId: accountId,
                type: 'in',
                amount: shipmentToPay.totalAmount,
                category: 'Penerimaan Piutang',
                description: `Penerimaan pembayaran untuk ${shipmentToPay.transactionId} dari ${shipmentToPay.customerName}`,
                transactionDate: format(new Date(paidAt), 'yyyy-MM-dd'),
                referenceId: shipmentToPay.id,
            });

            // 3. Update account balance
            await tx.update(accounts)
                .set({ balance: sql`${accounts.balance} + ${shipmentToPay.totalAmount}` })
                .where(eq(accounts.id, accountId));
        });

        return NextResponse.json({ message: 'Payment successful' });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process payment';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
