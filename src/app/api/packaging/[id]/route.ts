
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {packagingOptions as packagingTable} from '@/drizzle/schema';
import {eq} from 'drizzle-orm';

export async function PUT(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        const body = await request.json();
        const [updatedOption] = await db.update(packagingTable).set(body).where(eq(packagingTable.id, id)).returning();
        return NextResponse.json(updatedOption);
    } catch (error) {
        return NextResponse.json({error: 'Failed to update packaging option'}, {status: 500});
    }
}

export async function DELETE(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        await db.delete(packagingTable).where(eq(packagingTable.id, id));
        return NextResponse.json({message: 'Packaging option deleted successfully'});
    } catch (error) {
        return NextResponse.json({error: 'Failed to delete packaging option'}, {status: 500});
    }
}
