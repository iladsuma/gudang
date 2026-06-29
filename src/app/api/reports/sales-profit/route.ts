
import { db } from '@/lib/db';
import { shipments, financialTransactions, users } from '@/app/drizzle/schema';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gte, lte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    if (!startDate || !endDate) {
        return NextResponse.json({ message: 'Missing dates' }, { status: 400 });
    }

    try {
        const allShipments = await db.query.shipments.findMany({
            where: and(
                eq(shipments.status, 'Terkirim'),
                gte(shipments.createdAt, new Date(startDate)),
                lte(shipments.createdAt, new Date(endDate))
            )
        });

        let filtered = allShipments;
        if (userId && userId !== 'all') {
            filtered = allShipments.filter(s => s.userId.split(',').includes(userId));
        }

        const allUsers = await db.select().from(users);

        const transactionDetails = filtered.map(s => {
            const prods = s.products as any[];
            const totalCOGS = prods.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0);
            const userNames = s.userId.split(',').map(id => allUsers.find(u => u.id === id)?.username || 'N/A').join(', ');

            return {
                id: s.id,
                transactionId: s.transactionId,
                createdAt: s.createdAt,
                customerName: s.customerName,
                userId: s.userId,
                userName: userNames,
                totalRevenue: s.totalAmount,
                totalCOGS: totalCOGS,
                profit: s.totalAmount - totalCOGS,
            };
        });

        const totalRevenue = transactionDetails.reduce((sum, d) => sum + d.totalRevenue, 0);
        const totalCOGS = transactionDetails.reduce((sum, d) => sum + d.totalCOGS, 0);
        const grossProfit = totalRevenue - totalCOGS;

        // Simplified operational expenses from financial transactions
        const expenses = await db.query.financialTransactions.findMany({
            where: and(
                eq(financialTransactions.type, 'out'),
                gte(financialTransactions.transactionDate, startDate.split('T')[0]),
                lte(financialTransactions.transactionDate, endDate.split('T')[0])
            )
        });

        const operationalExpenses = expenses
            .filter(t => ['Biaya Operasional', 'Gaji Karyawan', 'Sewa', 'Listrik & Air', 'Transportasi'].includes(t.category))
            .reduce((sum, t) => sum + t.amount, 0);

        return NextResponse.json({
            totalRevenue,
            totalCOGS,
            grossProfit,
            operationalExpenses,
            netProfit: grossProfit - operationalExpenses,
            transactionDetails,
        });

    } catch (error) {
        return NextResponse.json({ message: String(error) }, { status: 500 });
    }
}
