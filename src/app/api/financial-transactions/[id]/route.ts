
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { financialTransactions as ftTable, accounts as accountsTable } from '@/drizzle/schema';
import { eq, sql } from 'drizzle-orm';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const body = await request.json();
        let updatedTransaction;

        await db.transaction(async (tx) => {
            const originalTx = await tx.query.financialTransactions.findFirst({ where: eq(ftTable.id, id) });
            if (!originalTx) {
                throw new Error("Transaction not found");
            }

            // Revert the original transaction amount from the account balance
            const originalAmountChange = originalTx.type === 'in' ? -originalTx.amount : originalTx.amount;
            await tx.update(accountsTable)
                .set({ balance: sql`${accountsTable.balance} + ${originalAmountChange}` })
                .where(eq(accountsTable.id, originalTx.accountId));

            // Apply the new transaction amount to the (potentially new) account balance
            const newAmountChange = body.type === 'in' ? body.amount : -body.amount;
            const targetAccountId = body.accountId || originalTx.accountId;
            await tx.update(accountsTable)
                .set({ balance: sql`${accountsTable.balance} + ${newAmountChange}` })
                .where(eq(accountsTable.id, targetAccountId));

            // Update the transaction itself
            [updatedTransaction] = await tx.update(ftTable).set(body).where(eq(ftTable.id, id)).returning();
        });

        return NextResponse.json(updatedTransaction, { status: 200 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update transaction';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        let deletedTransaction;
        await db.transaction(async (tx) => {
             const txToDelete = await tx.query.financialTransactions.findFirst({ where: eq(ftTable.id, id) });
            if (!txToDelete) {
                throw new Error("Transaction not found");
            }
             if (txToDelete.referenceId) {
                throw new Error("Cannot delete transactions linked to sales, purchases, or transfers.");
            }

            // Revert the amount from the account balance
            const amountChange = txToDelete.type === 'in' ? -txToDelete.amount : txToDelete.amount;
            await tx.update(accountsTable)
                .set({ balance: sql`${accountsTable.balance} + ${amountChange}` })
                .where(eq(accountsTable.id, txToDelete.accountId));

            // Delete the transaction
            [deletedTransaction] = await tx.delete(ftTable).where(eq(ftTable.id, id)).returning();
        });

        return NextResponse.json(deletedTransaction, { status: 200 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete transaction';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
