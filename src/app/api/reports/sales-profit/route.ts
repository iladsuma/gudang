
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { shipments as shipmentsTable } from '@/drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { Shipment, ShipmentProduct } from '@/lib/types';

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
        
        const reportData: SalesProfitReportData[] = deliveredShipments.map(shipment => {
            const totalCOGS = (shipment.products as ShipmentProduct[]).reduce((sum, p) => {
                // Now using costPrice stored at the time of sale
                return sum + (p.costPrice * p.quantity);
            }, 0);

            const profit = shipment.totalRevenue - totalCOGS;

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
