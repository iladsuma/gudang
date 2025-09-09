
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { financialTransactions as ftTable, accounts as accountsTable } from '@/drizzle/schema';
import { desc, eq, and, gte, lte, sql } from 'drizzle-orm';
import type { FinancialTransaction, Transfer } from '@/lib/types';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'in' | 'out' | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    try {
        let conditions = [];

        if (type) {
            conditions.push(eq(ftTable.type, type));
        }

        if (startDate) {
            conditions.push(gte(ftTable.transactionDate, startDate));
        }
        if (endDate) {
            conditions.push(lte(ftTable.transactionDate, endDate));
        }
        
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const transactions = await db.query.financialTransactions.findMany({
             with: {
                account: {
                    columns: {
                        name: true,
                    },
                },
            },
            where: whereClause,
            orderBy: [desc(ftTable.transactionDate), desc(ftTable.createdAt)],
        });
            
        return NextResponse.json(transactions);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch financial transactions';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}


export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as Omit<FinancialTransaction, 'id' | 'createdAt'>;
        let newTransaction;

        await db.transaction(async (tx) => {
            // Insert the new financial transaction
            [newTransaction] = await tx.insert(ftTable).values(body).returning();

            // Update the balance of the associated account
            const amountChange = body.type === 'in' ? body.amount : -body.amount;
            await tx.update(accountsTable)
                .set({
                    balance: sql`${accountsTable.balance} + ${amountChange}`
                })
                .where(eq(accountsTable.id, body.accountId));
        });

        return NextResponse.json(newTransaction, { status: 201 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create financial transaction';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
