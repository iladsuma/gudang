
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {accounts as accountsTable, financialTransactions} from '@/drizzle/schema';
import {eq} from 'drizzle-orm';

export async function PUT(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        const body = await request.json();
        // Balance can only be set on creation, so we exclude it from the update payload.
        const { balance, ...updateData } = body;
        const [updatedAccount] = await db.update(accountsTable).set(updateData).where(eq(accountsTable.id, id)).returning();
        return NextResponse.json(updatedAccount);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update account';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}

export async function DELETE(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        const existingTransactions = await db.select().from(financialTransactions).where(eq(financialTransactions.accountId, id)).limit(1);
        if (existingTransactions.length > 0) {
            return NextResponse.json({error: 'Cannot delete account with existing transactions'}, {status: 400});
        }
        await db.delete(accountsTable).where(eq(accountsTable.id, id));
        return NextResponse.json({message: 'Account deleted successfully'});
    } catch (error) {
        return NextResponse.json({error: 'Failed to delete account'}, {status: 500});
    }
}
