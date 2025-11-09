
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { shipments, financialTransactions, users } from '@/drizzle/schema';
import { and, gte, lte, eq, sql, sum, ne } from 'drizzle-orm';
import type { SalesProfitReportData } from '@/lib/types';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    if (!startDate || !endDate) {
        return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    try {
        // Build conditions for shipments
        let shipmentConditions = [
            eq(shipments.status, 'Terkirim' as const),
            gte(shipments.createdAt, new Date(startDate)),
            lte(shipments.createdAt, new Date(endDate)),
        ];
        if (userId && userId !== 'all') {
            shipmentConditions.push(eq(shipments.userId, userId));
        }

        const deliveredShipments = await db.query.shipments.findMany({
            where: and(...shipmentConditions),
            with: { user: { columns: { username: true } } }
        });

        let totalRevenue = 0;
        let totalCOGS = 0;
        const transactionDetails = deliveredShipments.map(shipment => {
            const cogs = (shipment.products as any[]).reduce((sum, p) => sum + (p.costPrice || 0) * p.quantity, 0);
            const profit = shipment.totalRevenue - cogs;

            totalRevenue += shipment.totalRevenue;
            totalCOGS += cogs;

            return {
                id: shipment.id,
                transactionId: shipment.transactionId,
                createdAt: shipment.createdAt.toISOString(),
                customerName: shipment.customerName,
                userId: shipment.userId,
                userName: (shipment as any).user?.username || 'N/A',
                totalRevenue: shipment.totalRevenue,
                totalCOGS: cogs,
                profit: profit,
            };
        });

        const grossProfit = totalRevenue - totalCOGS;

        // Build conditions for expenses
        let expenseConditions = [
            eq(financialTransactions.type, 'out' as const),
            ne(financialTransactions.category, 'Pembelian Stok'),
            ne(financialTransactions.category, 'Pelunasan Utang'),
            gte(financialTransactions.transactionDate, format(new Date(startDate), 'yyyy-MM-dd')),
            lte(financialTransactions.transactionDate, format(new Date(endDate), 'yyyy-MM-dd')),
        ];

        const expensesResult = await db.select({
            total: sum(financialTransactions.amount)
        }).from(financialTransactions).where(and(...expenseConditions));
        
        const operationalExpenses = parseFloat(expensesResult[0]?.total || '0');
        const netProfit = grossProfit - operationalExpenses;
        
        const reportData: SalesProfitReportData = {
            totalRevenue,
            totalCOGS,
            grossProfit,
            operationalExpenses,
            netProfit,
            transactionDetails,
        };

        return NextResponse.json(reportData);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate sales profit report';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
