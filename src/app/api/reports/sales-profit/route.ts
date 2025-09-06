
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {
    shipments as shipmentsTable,
    products as productsTable
} from '@/drizzle/schema';
import {eq, and, gte, lte, desc} from 'drizzle-orm';
import type {Shipment, Product} from '@/lib/types';

export interface SalesProfitReportData {
    id: string;
    transactionId: string;
    customerName: string;
    createdAt: string;
    totalRevenue: number;
    totalCOGS: number;
    profit: number;
}


export async function GET(request: NextRequest) {
    const {searchParams} = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
        return NextResponse.json({error: 'Start date and end date are required'}, {status: 400});
    }

    try {
        // 1. Get all completed shipments within the date range
        const completedShipments: Shipment[] = await db.select()
            .from(shipmentsTable)
            .where(
                and(
                    eq(shipmentsTable.status, 'Terkirim'),
                    gte(shipmentsTable.createdAt, new Date(startDate)),
                    lte(shipmentsTable.createdAt, new Date(endDate))
                )
            )
            .orderBy(desc(shipmentsTable.createdAt));
        
        if (completedShipments.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Get all product IDs from these shipments to fetch their cost prices
        const productIds = new Set<string>();
        completedShipments.forEach(shipment => {
            shipment.products.forEach(p => productIds.add(p.productId));
        });

        // 3. Fetch all relevant products and create a map for quick lookup
        const productsData: Product[] = await db.query.products.findMany({
            where: (products, { inArray }) => inArray(products.id, Array.from(productIds))
        });
        const productCostMap = new Map<string, number>(productsData.map(p => [p.id, p.costPrice]));
        
        // 4. Calculate COGS and profit for each shipment
        const reportData: SalesProfitReportData[] = completedShipments.map(shipment => {
            const totalCOGS = shipment.products.reduce((sum, p) => {
                const costPrice = productCostMap.get(p.productId) || 0; // Default to 0 if not found
                return sum + (costPrice * p.quantity);
            }, 0);

            const profit = shipment.totalProductCost - totalCOGS;

            return {
                id: shipment.id,
                transactionId: shipment.transactionId,
                customerName: shipment.customerName,
                createdAt: shipment.createdAt,
                totalRevenue: shipment.totalProductCost, // Revenue from products only
                totalCOGS,
                profit
            };
        });

        return NextResponse.json(reportData);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate sales profit report';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}
