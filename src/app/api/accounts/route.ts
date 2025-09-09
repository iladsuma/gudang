
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {accounts as accountsTable, financialTransactions} from '@/drizzle/schema';
import {asc, sql, eq} from 'drizzle-orm';
import type { Account } from '@/lib/types';

export async function GET() {
    try {
        const allAccounts = await db.select().from(accountsTable).orderBy(asc(accountsTable.createdAt));
        return NextResponse.json(allAccounts);
    } catch (error) {
        return NextResponse.json({error: 'Failed to fetch accounts'}, {status: 500});
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as Omit<Account, 'id' | 'createdAt'>;
        const { balance, ...restOfBody } = body;
        
        let newAccount;
        await db.transaction(async (tx) => {
            [newAccount] = await tx.insert(accountsTable).values({ ...restOfBody, balance: balance || 0 }).returning();
            
            // If an initial balance is provided, create an initial financial transaction for it
            if (balance && balance > 0) {
                await tx.insert(financialTransactions).values({
                    accountId: newAccount.id,
                    type: 'in',
                    amount: balance,
                    category: 'Saldo Awal',
                    description: `Saldo awal untuk akun ${newAccount.name}`,
                    transactionDate: new Date().toISOString().split('T')[0],
                    referenceId: newAccount.id,
                });
            }
        });

        return NextResponse.json(newAccount);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}
