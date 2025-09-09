
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { financialTransactions as ftTable, accounts as accountsTable } from '@/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import type { FinancialTransaction } from '@/lib/types';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json() as Omit<FinancialTransaction, 'id' | 'createdAt'>;
        
        let updatedTransaction;
        await db.transaction(async (tx) => {
            const originalTx = await tx.query.financialTransactions.findFirst({ where: eq(ftTable.id, id) });
            if (!originalTx) {
                throw new Error('Transaction not found');
            }

            // Reverse the original transaction amount on its original account
            const originalAmountChange = originalTx.type === 'in' ? -originalTx.amount : originalTx.amount;
            await tx.update(accountsTable)
                .set({ balance: sql`${accountsTable.balance} + ${originalAmountChange}` })
                .where(eq(accountsTable.id, originalTx.accountId));

            // Update the transaction details
            [updatedTransaction] = await tx.update(ftTable).set(body).where(eq(ftTable.id, id)).returning();
            
            // Apply the new transaction amount to its new account
            const newAmountChange = updatedTransaction.type === 'in' ? updatedTransaction.amount : -updatedTransaction.amount;
            await tx.update(accountsTable)
                .set({ balance: sql`${accountsTable.balance} + ${newAmountChange}` })
                .where(eq(accountsTable.id, updatedTransaction.accountId));
        });
        
        return NextResponse.json(updatedTransaction);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update financial transaction';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

         await db.transaction(async (tx) => {
            const txToDelete = await tx.query.financialTransactions.findFirst({ where: eq(ftTable.id, id) });

            if (!txToDelete) {
                throw new Error('Transaction not found');
            }
            
            // Revert the balance on the associated account
            const amountToRevert = txToDelete.type === 'in' ? -txToDelete.amount : txToDelete.amount;
            await tx.update(accountsTable)
                .set({ balance: sql`${accountsTable.balance} + ${amountToRevert}` })
                .where(eq(accountsTable.id, txToDelete.accountId));

            // Delete the transaction
            await tx.delete(ftTable).where(eq(ftTable.id, id));
        });

        return NextResponse.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete financial transaction';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
