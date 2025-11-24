import { db } from '@/lib/db';
import { financialTransactions, accounts } from '@/app/drizzle/schema';
import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// GET financial transactions with filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get('accountId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    let whereClause = [];
    if (accountId) whereClause.push(eq(financialTransactions.accountId, accountId));
    if (startDate) whereClause.push(gte(financialTransactions.transactionDate, startDate));
    if (endDate) whereClause.push(lte(financialTransactions.transactionDate, endDate));
    
    const transactions = await db.query.financialTransactions.findMany({
      where: and(...whereClause),
      with: {
        account: {
          columns: {
            name: true,
          }
        }
      },
      orderBy: [desc(financialTransactions.transactionDate), desc(financialTransactions.createdAt)],
    });
    
    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}

// POST a new financial transaction
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    await db.transaction(async (tx) => {
        const newTransactionId = `ft_${Date.now()}`;
        
        await tx.insert(financialTransactions).values({ ...body, id: newTransactionId });

        const amount = body.type === 'in' ? body.amount : -body.amount;
        await tx.update(accounts)
          .set({ balance: sql`${accounts.balance} + ${amount}` })
          .where(eq(accounts.id, body.accountId));
    });

    // We can't return the created object directly with all relations, 
    // so we just confirm success. The client will refetch.
    return NextResponse.json({ message: 'Transaction created' }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}