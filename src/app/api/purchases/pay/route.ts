
import { db } from '@/lib/db';
import { purchases, financialTransactions, accounts } from '@/app/drizzle/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { purchaseId, accountId, paidAt } = await req.json();
        
        const purchase = await db.query.purchases.findFirst({
            where: eq(purchases.id, purchaseId)
        });

        if (!purchase) {
            return NextResponse.json({ message: 'Data pembelian tidak ditemukan' }, { status: 404 });
        }

        await db.transaction(async (tx) => {
            // 1. Update status hutang
            await tx.update(purchases)
                .set({ 
                    paymentStatus: 'Lunas', 
                    paidAt: new Date(paidAt),
                    accountId: accountId 
                })
                .where(eq(purchases.id, purchaseId));

            // 2. Catat kas keluar
            await tx.insert(financialTransactions).values({
                id: `ft_pay_${Date.now()}`,
                accountId: accountId,
                type: 'out',
                amount: purchase.totalAmount,
                category: 'Pembayaran Utang',
                description: `Bayar tagihan ${purchase.purchaseNumber} (${purchase.supplierName})`,
                transactionDate: new Date(paidAt).toISOString().split('T')[0],
                referenceId: purchaseId,
            });

            // 3. Kurangi saldo akun
            await tx.update(accounts)
                .set({ balance: sql`${accounts.balance} - ${purchase.totalAmount}` })
                .where(eq(accounts.id, accountId));
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ message: String(error) }, { status: 500 });
    }
}
