
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {shipments as shipmentsTable, customers, users as usersTable} from '@/drizzle/schema';
import {eq} from 'drizzle-orm';
import type {Shipment} from '@/lib/types';

export async function PUT(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        const body = await request.json();
        const {customerId, packagingCost, user: username, ...restOfBody} = body;

        const customer = await db.query.customers.findFirst({where: eq(customers.id, customerId)});
        const user = await db.query.users.findFirst({where: eq(usersTable.username, username)});

        if (!customer) return NextResponse.json({error: 'Customer not found'}, {status: 404});
        if (!user) return NextResponse.json({error: 'User not found'}, {status: 404});

        const totalItems = body.products.reduce((sum: number, p: any) => sum + p.quantity, 0);
        const totalProductCost = body.products.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);
        const totalAmount = totalProductCost + packagingCost;

        const updatedShipmentData: Partial<Shipment> = {
            ...restOfBody,
            userId: user.id,
            customerName: customer.name,
            customerId: customer.id,
            totalItems,
            totalProductCost,
            totalPackingCost: packagingCost,
            totalAmount,
        };

        const [updatedShipment] = await db.update(shipmentsTable).set(updatedShipmentData).where(eq(shipmentsTable.id, id)).returning();
        return NextResponse.json(updatedShipment);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update shipment';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}

export async function DELETE(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        await db.delete(shipmentsTable).where(eq(shipmentsTable.id, id));
        return NextResponse.json({message: 'Shipment deleted successfully'});
    } catch (error) {
        return NextResponse.json({error: 'Failed to delete shipment'}, {status: 500});
    }
}
