
import { db } from '@/lib/db';
import { financialTransactions, accounts } from '@/lib/schema';
import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let conditions = [];
        if (type) {
            conditions.push(eq(financialTransactions.type, type as 'in' | 'out'));
        }
        if (startDate) {
            conditions.push(gte(financialTransactions.transactionDate, startDate));
        }
        if (endDate) {
            conditions.push(lte(financialTransactions.transactionDate, endDate));
        }

        const allTransactions = await db.query.financialTransactions.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                account: {
                    columns: {
                        name: true
                    }
                }
            },
            orderBy: [desc(financialTransactions.transactionDate), desc(financialTransactions.createdAt)]
        });

        return NextResponse.json(allTransactions);
    } catch (error) {
        console.error('Failed to fetch financial transactions:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: 'Failed to fetch financial transactions', error: errorMessage }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { accountId, type, amount, category, description, transactionDate, referenceId } = body;

        if (!accountId || !type || !amount || !category || !description || !transactionDate) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const [newTransaction] = await db.insert(financialTransactions).values({
            accountId,
            type,
            amount,
            category,
            description,
            transactionDate,
            referenceId,
        }).returning();

        return NextResponse.json(newTransaction, { status: 201 });
    } catch (error) {
        console.error('Failed to create financial transaction:', error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ message: 'Failed to create financial transaction', error: message }, { status: 500 });
    }
}
