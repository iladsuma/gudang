import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { products as productsTable, financialTransactions as ftTable, shipments as shipmentsTable, purchases as purchasesTable } from '@/drizzle/schema';
import { eq, and, gte, lte, sql, sum, ne } from 'drizzle-orm';
import { startOfYear } from 'date-fns';

export interface BalanceSheetData {
    assets: {
        cashAndEquivalents: number;
        inventory: number;
        accountsReceivable: number;
        total: number;
    };
    liabilities: {
        accountsPayable: number;
        total: number;
    };
    equity: {
        retainedEarnings: number;
        total: number;
    };
}


export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const asOfDate = searchParams.get('asOfDate') ? new Date(searchParams.get('asOfDate')!) : new Date();

    try {
        // ========== ASET (ASSETS) ==========

        // 1. Kas & Setara Kas (Cash & Equivalents)
        const cashResult = await db.select({
            total: sql<number>`SUM(CASE WHEN ${ftTable.type} = 'in' THEN ${ftTable.amount} ELSE -${ftTable.amount} END)`.mapWith(Number)
        }).from(ftTable)
        .where(lte(ftTable.transactionDate, asOfDate.toISOString().split('T')[0]));
        const cashAndEquivalents = cashResult[0]?.total || 0;
        
        // 2. Piutang Usaha (Accounts Receivable)
        const receivableResult = await db.select({
            total: sum(shipmentsTable.totalAmount)
        }).from(shipmentsTable)
        .where(and(
            eq(shipmentsTable.paymentStatus, 'Belum Lunas'),
            lte(shipmentsTable.createdAt, asOfDate)
        ));
        const accountsReceivable = receivableResult[0]?.total || 0;

        // 3. Persediaan (Inventory)
        // This is a simplified calculation. A more accurate one would require historical inventory tracking.
        // For now, we use current stock value as an approximation.
        const inventoryResult = await db.select({
            total: sum(sql`${productsTable.stock} * ${productsTable.costPrice}`)
        }).from(productsTable);
        const inventory = inventoryResult[0]?.total || 0;

        const totalAssets = cashAndEquivalents + accountsReceivable + inventory;


        // ========== KEWAJIBAN (LIABILITIES) ==========

        // 1. Utang Usaha (Accounts Payable)
        const payableResult = await db.select({
            total: sum(purchasesTable.totalAmount)
        }).from(purchasesTable)
        .where(and(
            eq(purchasesTable.paymentStatus, 'Belum Lunas'),
            lte(purchasesTable.createdAt, asOfDate)
        ));
        const accountsPayable = payableResult[0]?.total || 0;

        const totalLiabilities = accountsPayable;

        // ========== EKUITAS (EQUITY) ==========
        
        // 1. Laba Ditahan (Retained Earnings)
        // Calculated as (Revenue - COGS - Operational Expenses) from the beginning of the year until asOfDate.
        const yearStart = startOfYear(asOfDate);
        
        // Revenue from delivered shipments
        const revenueResult = await db.select({
            total: sum(shipmentsTable.totalAmount)
        }).from(shipmentsTable)
        .where(and(
            eq(shipmentsTable.status, 'Terkirim'),
            gte(shipmentsTable.createdAt, yearStart),
            lte(shipmentsTable.createdAt, asOfDate)
        ));
        const totalRevenue = revenueResult[0]?.total || 0;

        // COGS from delivered shipments
        // This requires products JSON to be parsed, which is complex in SQL.
        // We'll fetch the shipments and calculate COGS in code.
        const deliveredShipments = await db.select({ products: shipmentsTable.products, totalRevenue: shipmentsTable.totalRevenue })
            .from(shipmentsTable)
            .where(and(
                eq(shipmentsTable.status, 'Terkirim'),
                gte(shipmentsTable.createdAt, yearStart),
                lte(shipmentsTable.createdAt, asOfDate)
            ));

        const totalCOGS = deliveredShipments.reduce((acc, shipment) => {
            const cogs = (shipment.products as any[]).reduce((sum, p) => sum + (p.costPrice || 0) * p.quantity, 0);
            return acc + cogs;
        }, 0);

        const grossProfit = totalRevenue - totalCOGS;

        // Operational Expenses
        const expensesResult = await db.select({
            total: sum(ftTable.amount)
        }).from(ftTable)
        .where(and(
            eq(ftTable.type, 'out'),
            ne(ftTable.category, 'Pembelian Stok'), // Exclude stock purchases
            gte(ftTable.transactionDate, yearStart.toISOString().split('T')[0]),
            lte(ftTable.transactionDate, asOfDate.toISOString().split('T')[0])
        ));
        const operationalExpenses = expensesResult[0]?.total || 0;

        const retainedEarnings = grossProfit - operationalExpenses;

        const totalEquity = retainedEarnings; // For now, Owner's Capital is manual on client.

        const reportData: BalanceSheetData = {
            assets: {
                cashAndEquivalents,
                inventory,
                accountsReceivable,
                total: totalAssets
            },
            liabilities: {
                accountsPayable,
                total: totalLiabilities
            },
            equity: {
                retainedEarnings,
                total: totalEquity
            }
        };

        return NextResponse.json(reportData);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch balance sheet data';
        console.error("Balance Sheet Error:", errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
