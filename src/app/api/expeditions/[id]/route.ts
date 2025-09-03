
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {expeditions as expeditionsTable} from '@/drizzle/schema';
import {eq} from 'drizzle-orm';

export async function PUT(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        const body = await request.json();
        const [updatedExpedition] = await db.update(expeditionsTable).set({name: body.name}).where(eq(expeditionsTable.id, id)).returning();
        return NextResponse.json(updatedExpedition);
    } catch (error) {
        return NextResponse.json({error: 'Failed to update expedition'}, {status: 500});
    }
}

export async function DELETE(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        await db.delete(expeditionsTable).where(eq(expeditionsTable.id, id));
        return NextResponse.json({message: 'Expedition deleted successfully'});
    } catch (error) {
        return NextResponse.json({error: 'Failed to delete expedition'}, {status: 500});
    }
}
