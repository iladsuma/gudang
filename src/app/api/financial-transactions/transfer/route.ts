
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { financialTransactions as ftTable, accounts as accountsTable } from '@/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { format } from 'date-fns';
import type { Transfer } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as Transfer;
        const transferId = `trf_${Date.now()}`;
        
        await db.transaction(async (tx) => {
            // Debit from the source account
            await tx.insert(ftTable).values({
                accountId: body.fromAccountId,
                type: 'out',
                amount: body.amount,
                category: 'Transfer Keluar',
                description: body.description,
                transactionDate: format(new Date(body.transferDate), 'yyyy-MM-dd'),
                referenceId: transferId
            });
            await tx.update(accountsTable)
                .set({ balance: sql`${accountsTable.balance} - ${body.amount}` })
                .where(eq(accountsTable.id, body.fromAccountId));

            // Credit to the destination account
            await tx.insert(ftTable).values({
                accountId: body.toAccountId,
                type: 'in',
                amount: body.amount,
                category: 'Transfer Masuk',
                description: body.description,
                transactionDate: format(new Date(body.transferDate), 'yyyy-MM-dd'),
                referenceId: transferId
            });
            await tx.update(accountsTable)
                .set({ balance: sql`${accountsTable.balance} + ${body.amount}` })
                .where(eq(accountsTable.id, body.toAccountId));
        });

        return NextResponse.json({ message: "Transfer successful" }, { status: 201 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process internal transfer';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
