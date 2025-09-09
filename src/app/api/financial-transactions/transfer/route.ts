
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { financialTransactions as ftTable, accounts as accountsTable } from '@/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import type { Transfer } from '@/lib/types';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as Transfer;
        const { fromAccountId, toAccountId, amount, transferDate, description } = body;
        
        const transferId = `trf_${Date.now()}`;

        await db.transaction(async (tx) => {
            // 1. Debit from the source account
            await tx.update(accountsTable)
                .set({ balance: sql`${accountsTable.balance} - ${amount}` })
                .where(eq(accountsTable.id, fromAccountId));
            
            // 2. Create the 'out' transaction
            await tx.insert(ftTable).values({
                accountId: fromAccountId,
                type: 'out',
                amount,
                category: 'Transfer Keluar',
                description,
                transactionDate: format(transferDate, 'yyyy-MM-dd'),
                referenceId: transferId,
            });
            
            // 3. Credit to the destination account
            await tx.update(accountsTable)
                .set({ balance: sql`${accountsTable.balance} + ${amount}` })
                .where(eq(accountsTable.id, toAccountId));
                
            // 4. Create the 'in' transaction
            await tx.insert(ftTable).values({
                accountId: toAccountId,
                type: 'in',
                amount,
                category: 'Transfer Masuk',
                description,
                transactionDate: format(transferDate, 'yyyy-MM-dd'),
                referenceId: transferId,
            });
        });

        return NextResponse.json({ message: 'Transfer successful' }, { status: 201 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process internal transfer';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
