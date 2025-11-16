
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {accounts, financialTransactions} from '@/drizzle/schema';
import {asc, sql, eq} from 'drizzle-orm';

export async function GET() {
    try {
        const allAccounts = await db.select().from(accounts).orderBy(asc(accounts.name));

        const balances = await db
            .select({
                accountId: financialTransactions.accountId,
                total: sql<number>`SUM(CASE WHEN type = 'in' THEN amount ELSE -amount END)`.as('total'),
            })
            .from(financialTransactions)
            .groupBy(financialTransactions.accountId);

        const balanceMap = new Map<string, number>();
        balances.forEach(b => {
            if (b.accountId) {
                balanceMap.set(b.accountId, Number(b.total));
            }
        });
        
        const accountsWithCalculatedBalances = allAccounts.map(acc => ({
            ...acc,
            balance: balanceMap.get(acc.id) || 0,
        }));
        
        return NextResponse.json(accountsWithCalculatedBalances);

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Gagal mengambil data akun:', error);
        return NextResponse.json({error: 'Gagal mengambil data akun', message}, {status: 500});
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, type, balance, notes } = body;
        
        if (!name || !type) {
          return NextResponse.json({ message: 'Nama dan Tipe harus diisi' }, { status: 400 });
        }

        const [newAccount] = await db.insert(accounts).values({ name, type, notes }).returning();
        
        if (balance && balance > 0) {
            await db.insert(financialTransactions).values({
                accountId: newAccount.id,
                type: 'in',
                amount: balance,
                category: 'Saldo Awal',
                description: `Saldo awal untuk akun ${name}`,
                transactionDate: new Date().toISOString().split('T')[0],
            });
        }
        
        return NextResponse.json(newAccount, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Gagal membuat akun:', error);
        return NextResponse.json({error: 'Gagal membuat akun', message}, {status: 500});
    }
}
