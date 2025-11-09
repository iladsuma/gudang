
import { db } from '@/lib/db';
import { financialTransactions } from '@/lib/schema';
import { NextResponse } from 'next/server';
import { format } from 'date-fns';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fromAccountId, toAccountId, amount, transferDate, description } = body;

        if (!fromAccountId || !toAccountId || !amount || !transferDate || !description) {
            return NextResponse.json({ message: 'Data transfer tidak lengkap' }, { status: 400 });
        }
        
        if (fromAccountId === toAccountId) {
            return NextResponse.json({ message: 'Akun sumber dan tujuan tidak boleh sama' }, { status: 400 });
        }
        
        const date = format(new Date(transferDate), 'yyyy-MM-dd');

        // Use a database transaction to ensure both are created or none are
        await db.transaction(async (tx) => {
            // Transaction out
            await tx.insert(financialTransactions).values({
                accountId: fromAccountId,
                type: 'out',
                amount: Number(amount),
                category: 'Transfer Keluar',
                description: `Transfer ke: ${description}`,
                transactionDate: date,
            });

            // Transaction in
            await tx.insert(financialTransactions).values({
                accountId: toAccountId,
                type: 'in',
                amount: Number(amount),
                category: 'Transfer Masuk',
                description: `Transfer dari: ${description}`,
                transactionDate: date,
            });
        });

        return NextResponse.json({ message: 'Transfer berhasil dicatat' }, { status: 201 });
    } catch (error) {
        console.error('Failed to process internal transfer:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: 'Gagal memproses transfer internal', error: errorMessage }, { status: 500 });
    }
}
