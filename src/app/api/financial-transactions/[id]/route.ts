
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { financialTransactions as ftTable } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import type { FinancialTransaction } from '@/lib/types';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json() as Omit<FinancialTransaction, 'id' | 'createdAt'>;
        const [updatedTransaction] = await db.update(ftTable).set(body).where(eq(ftTable.id, id)).returning();
        
        if (!updatedTransaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }
        
        return NextResponse.json(updatedTransaction);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update financial transaction';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        await db.delete(ftTable).where(eq(ftTable.id, id));
        return NextResponse.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete financial transaction';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

    