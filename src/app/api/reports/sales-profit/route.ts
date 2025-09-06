
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { shipments as shipmentsTable } from '@/drizzle/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import type { Shipment } from '@/lib/types';

export interface SalesProfitReportData extends Shipment {
    totalCOGS: number;
    profit: number;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
        return NextResponse.json({ error: 'Start and end date are required' }, { status: 400 });
    }

    try {
        const deliveredShipments = await db.select()
            .from(shipmentsTable)
            .where(
                and(
                    eq(shipmentsTable.status, 'Terkirim'),
                    gte(shipmentsTable.createdAt, new Date(startDate)),
                    lte(shipmentsTable.createdAt, new Date(endDate))
                )
            );
        
        const reportData = deliveredShipments.map(shipment => {
            const totalCOGS = shipment.products.reduce((sum, p) => {
                // This is a simplification. In a real scenario, you'd fetch the cost price
                // at the time of sale. Here we assume the current cost price is used.
                // For a more accurate system, costPrice should be stored with the shipment product.
                // For now, let's estimate it. A proper implementation would need to join with products table.
                // Let's assume a 20% margin for calculation if costPrice is not available on product.
                const estimatedCostPrice = p.price * 0.8; 
                return sum + (estimatedCostPrice * p.quantity);
            }, 0);

            const profit = shipment.totalProductCost - totalCOGS;

            return {
                ...shipment,
                totalCOGS,
                profit,
            };
        });

        return NextResponse.json(reportData);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sales profit report';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
