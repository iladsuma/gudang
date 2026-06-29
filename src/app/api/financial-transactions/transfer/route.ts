
import { db } from '@/lib/db';
import { financialTransactions, accounts } from '@/app/drizzle/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { fromAccountId, toAccountId, amount, transferDate, description } = await req.json();
        const dateStr = new Date(transferDate).toISOString().split('T')[0];

        await db.transaction(async (tx) => {
            // 1. Catat kas keluar dari akun sumber
            await tx.insert(financialTransactions).values({
                id: `ft_out_${Date.now()}`,
                accountId: fromAccountId,
                type: 'out',
                amount: amount,
                category: 'Transfer Antar Akun',
                description: `Pindah saldo ke akun tujuan: ${description}`,
                transactionDate: dateStr,
            });

            // 2. Catat kas masuk ke akun tujuan
            await tx.insert(financialTransactions).values({
                id: `ft_in_${Date.now()}`,
                accountId: toAccountId,
                type: 'in',
                amount: amount,
                category: 'Transfer Antar Akun',
                description: `Terima pindahan saldo: ${description}`,
                transactionDate: dateStr,
            });

            // 3. Update saldo akun sumber (kurangi)
            await tx.update(accounts)
                .set({ balance: sql`${accounts.balance} - ${amount}` })
                .where(eq(accounts.id, fromAccountId));

            // 4. Update saldo akun tujuan (tambah)
            await tx.update(accounts)
                .set({ balance: sql`${accounts.balance} + ${amount}` })
                .where(eq(accounts.id, toAccountId));
        });

        return NextResponse.json({ message: 'Transfer berhasil' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: String(error) }, { status: 500 });
    }
}
