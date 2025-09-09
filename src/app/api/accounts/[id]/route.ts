
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {accounts as accountsTable, financialTransactions} from '@/drizzle/schema';
import {eq, count} from 'drizzle-orm';

export async function PUT(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        const body = await request.json();
        // Balance cannot be updated via this route, only name, type, and notes
        const { balance, ...updateData } = body; 

        const [updatedAccount] = await db.update(accountsTable).set(updateData).where(eq(accountsTable.id, id)).returning();
        return NextResponse.json(updatedAccount);
    } catch (error) {
        return NextResponse.json({error: 'Failed to update account'}, {status: 500});
    }
}

export async function DELETE(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        
        // Check if there are any transactions associated with this account
        const transactionsCount = await db.select({ value: count() }).from(financialTransactions).where(eq(financialTransactions.accountId, id));
        if (transactionsCount[0].value > 0) {
            return NextResponse.json({error: 'Cannot delete account with existing transactions'}, {status: 400});
        }
        
        await db.delete(accountsTable).where(eq(accountsTable.id, id));
        return NextResponse.json({message: 'Account deleted successfully'});
    } catch (error) {
        return NextResponse.json({error: 'Failed to delete account'}, {status: 500});
    }
}
