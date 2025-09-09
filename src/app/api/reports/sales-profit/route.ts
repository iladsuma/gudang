
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { shipments as shipmentsTable, financialTransactions as ftTable } from '@/drizzle/schema';
import { eq, and, gte, lte, ne, sql } from 'drizzle-orm';
import type { Shipment, ShipmentProduct } from '@/lib/types';

export interface SalesProfitReportData {
    totalRevenue: number;
    totalCOGS: number;
    grossProfit: number;
    operationalExpenses: number;
    netProfit: number;
    transactionDetails: {
      id: string;
      transactionId: string;
      createdAt: string;
      customerName: string;
      totalRevenue: number;
      totalCOGS: number;
      profit: number;
    }[];
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
        return NextResponse.json({ error: 'Start and end date are required' }, { status: 400 });
    }

    try {
        const dateRangeCondition = and(
            gte(shipmentsTable.createdAt, new Date(startDate)),
            lte(shipmentsTable.createdAt, new Date(endDate))
        );

        // 1. Get all delivered shipments within the date range
        const deliveredShipments = await db.select()
            .from(shipmentsTable)
            .where(and(eq(shipmentsTable.status, 'Terkirim'), dateRangeCondition));
        
        // 2. Calculate Revenue, COGS, and Gross Profit from shipments
        let totalRevenue = 0;
        let totalCOGS = 0;
        const transactionDetails = deliveredShipments.map(shipment => {
            const cogs = (shipment.products as ShipmentProduct[]).reduce((sum, p) => {
                return sum + ((p.costPrice || 0) * p.quantity);
            }, 0);
            const profit = shipment.totalRevenue - cogs;
            
            totalRevenue += shipment.totalRevenue;
            totalCOGS += cogs;

            return {
                id: shipment.id,
                transactionId: shipment.transactionId,
                createdAt: shipment.createdAt,
                customerName: shipment.customerName,
                totalRevenue: shipment.totalRevenue,
                totalCOGS: cogs,
                profit: profit,
            };
        });

        const grossProfit = totalRevenue - totalCOGS;
        
        // 3. Get all operational expenses from financial transactions within the date range
        // Exclude 'Pembelian Stok' because it's already accounted for in COGS.
        const expensesResult = await db.select({
                amount: ftTable.amount
            })
            .from(ftTable)
            .where(and(
                eq(ftTable.type, 'out'),
                ne(ftTable.category, 'Pembelian Stok'),
                gte(ftTable.transactionDate, startDate.split('T')[0]),
                lte(ftTable.transactionDate, endDate.split('T')[0])
            ));

        const operationalExpenses = expensesResult.reduce((sum, e) => sum + e.amount, 0);

        // 4. Calculate Net Profit
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
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sales profit report';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

