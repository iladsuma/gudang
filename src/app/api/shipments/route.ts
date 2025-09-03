
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {shipments as shipmentsTable, customers, users as usersTable} from '@/drizzle/schema';
import {desc, eq} from 'drizzle-orm';
import type {Shipment} from '@/lib/types';

export async function GET() {
    try {
        const allShipments = await db.select().from(shipmentsTable).orderBy(desc(shipmentsTable.createdAt));
        return NextResponse.json(allShipments);
    } catch (error) {
        return NextResponse.json({error: 'Failed to fetch shipments'}, {status: 500});
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {customerId, packagingCost, user: username, ...restOfBody} = body;
        
        const customer = await db.query.customers.findFirst({where: eq(customers.id, customerId)});
        const user = await db.query.users.findFirst({where: eq(usersTable.username, username)});

        if (!customer) return NextResponse.json({error: 'Customer not found'}, {status: 404});
        if (!user) return NextResponse.json({error: 'User not found'}, {status: 404});

        const totalItems = body.products.reduce((sum: number, p: any) => sum + p.quantity, 0);
        const totalProductCost = body.products.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);
        const totalAmount = totalProductCost + packagingCost;

        const newShipmentData: Omit<Shipment, 'id' | 'createdAt'> = {
            ...restOfBody,
            userId: user.id,
            customerName: customer.name,
            customerId: customer.id,
            status: 'Proses',
            totalItems,
            totalProductCost,
            totalPackingCost: packagingCost,
            totalAmount,
        };

        const [newShipment] = await db.insert(shipmentsTable).values(newShipmentData as any).returning();
        return NextResponse.json(newShipment);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create shipment';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}
