
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {suppliers as suppliersTable} from '@/drizzle/schema';
import {eq} from 'drizzle-orm';

export async function PUT(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        const body = await request.json();
        const [updatedSupplier] = await db.update(suppliersTable).set(body).where(eq(suppliersTable.id, id)).returning();
        return NextResponse.json(updatedSupplier);
    } catch (error) {
        return NextResponse.json({error: 'Failed to update supplier'}, {status: 500});
    }
}

export async function DELETE(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        await db.delete(suppliersTable).where(eq(suppliersTable.id, id));
        return NextResponse.json({message: 'Supplier deleted successfully'});
    } catch (error) {
        return NextResponse.json({error: 'Failed to delete supplier'}, {status: 500});
    }
}
