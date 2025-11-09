
import { db } from '@/drizzle/db';
import { expeditions } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    const [updatedExpedition] = await db
      .update(expeditions)
      .set({ name })
      .where(eq(expeditions.id, id))
      .returning();

    if (!updatedExpedition) {
      return NextResponse.json({ message: 'Expedition not found' }, { status: 404 });
    }

    return NextResponse.json(updatedExpedition);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to update expedition', error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const [deletedExpedition] = await db.delete(expeditions).where(eq(expeditions.id, id)).returning();

    if (!deletedExpedition) {
      return NextResponse.json({ message: 'Expedition not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Expedition deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to delete expedition', error: message }, { status: 500 });
  }
}
