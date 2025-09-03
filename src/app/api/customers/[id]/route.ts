
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {customers as customersTable} from '@/drizzle/schema';
import {eq} from 'drizzle-orm';

export async function PUT(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        const body = await request.json();
        const [updatedCustomer] = await db.update(customersTable).set(body).where(eq(customersTable.id, id)).returning();
        return NextResponse.json(updatedCustomer);
    } catch (error) {
        return NextResponse.json({error: 'Failed to update customer'}, {status: 500});
    }
}

export async function DELETE(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        await db.delete(customersTable).where(eq(customersTable.id, id));
        return NextResponse.json({message: 'Customer deleted successfully'});
    } catch (error) {
        return NextResponse.json({error: 'Failed to delete customer'}, {status: 500});
    }
}
