import { db } from '@/lib/db';
import { accounts, financialTransactions } from '@/app/drizzle/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';

// GET all accounts
export async function GET() {
  try {
    const allAccounts = await db.select().from(accounts);
    return NextResponse.json(allAccounts, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error("GET Accounts Error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}

// ADD a new account
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { balance, ...accountData } = body;
        const newAccountId = `acc_${Date.now()}`;

        await db.transaction(async (tx) => {
            // Insert the new account with a zero balance first
            await tx.insert(accounts).values({ 
                ...accountData,
                id: newAccountId,
                balance: 0,
             });

            // If there's an initial balance, create a financial transaction for it
            if (balance && balance > 0) {
                await tx.insert(financialTransactions).values({
                    id: `ft_${Date.now()}`,
                    accountId: newAccountId,
                    type: 'in',
                    amount: balance,
                    category: 'Saldo Awal',
                    description: `Saldo awal untuk akun ${accountData.name}`,
                    transactionDate: new Date().toISOString().split('T')[0],
                });
                
                // Now update the balance
                 await tx.update(accounts)
                    .set({ balance: balance })
                    .where(eq(accounts.id, newAccountId));
            }
        });

        const newAccount = await db.query.accounts.findFirst({ where: eq(accounts.id, newAccountId) });

        return NextResponse.json(newAccount, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error("POST Account Error:", message);
        return NextResponse.json({ message }, { status: 500 });
    }
}