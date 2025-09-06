'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { financialTransactions as ftTable } from '@/drizzle/schema';
import { desc, eq } from 'drizzle-orm';
import type { FinancialTransaction } from '@/lib/types';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'in' | 'out' | null;

    try {
        let query = db.select().from(ftTable).orderBy(desc(ftTable.transactionDate), desc(ftTable.createdAt));

        if (type) {
            query.where(eq(ftTable.type, type));
        }

        const transactions = await query;
        return NextResponse.json(transactions);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch financial transactions';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as Omit<FinancialTransaction, 'id' | 'createdAt'>;
        const [newTransaction] = await db.insert(ftTable).values(body).returning();
        return NextResponse.json(newTransaction, { status: 201 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create financial transaction';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
