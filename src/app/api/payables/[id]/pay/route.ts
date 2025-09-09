
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { purchases, financialTransactions, accounts } from '@/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { format } from 'date-fns';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const { id: purchaseId } = params;
    const body = await request.json();
    const { accountId, paidAt } = body;

    if (!accountId || !paidAt) {
        return NextResponse.json({ error: 'Account ID and payment date are required' }, { status: 400 });
    }

    try {
        await db.transaction(async (tx) => {
            const purchaseToPay = await tx.query.purchases.findFirst({
                where: eq(purchases.id, purchaseId),
            });

            if (!purchaseToPay) {
                throw new Error('Purchase not found');
            }
            if (purchaseToPay.paymentStatus === 'Lunas') {
                throw new Error('This purchase has already been paid');
            }

            // 1. Update purchase status
            await tx.update(purchases)
                .set({
                    paymentStatus: 'Lunas',
                    paidAt: new Date(paidAt),
                    accountId: accountId, // Assign the account used for payment
                })
                .where(eq(purchases.id, purchaseId));

            // 2. Create financial transaction for the payment
            await tx.insert(financialTransactions).values({
                accountId: accountId,
                type: 'out',
                amount: purchaseToPay.totalAmount,
                category: 'Pelunasan Utang',
                description: `Pembayaran utang untuk pembelian ${purchaseToPay.purchaseNumber} dari ${purchaseToPay.supplierName}`,
                transactionDate: format(new Date(paidAt), 'yyyy-MM-dd'),
                referenceId: purchaseToPay.id,
            });

            // 3. Update account balance
            await tx.update(accounts)
                .set({ balance: sql`${accounts.balance} - ${purchaseToPay.totalAmount}` })
                .where(eq(accounts.id, accountId));
        });

        return NextResponse.json({ message: 'Payment successful' });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process payment';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
