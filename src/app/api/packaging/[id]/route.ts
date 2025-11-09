
import { db } from '@/lib/db';
import { packagingOptions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, cost } = body;

    if (!name || cost === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const [updatedOption] = await db
      .update(packagingOptions)
      .set({ name, cost })
      .where(eq(packagingOptions.id, id))
      .returning();

    if (!updatedOption) {
      return NextResponse.json({ message: 'Packaging option not found' }, { status: 404 });
    }

    return NextResponse.json(updatedOption);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to update packaging option ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to update packaging option', error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const [deletedOption] = await db.delete(packagingOptions).where(eq(packagingOptions.id, id)).returning();

    if (!deletedOption) {
      return NextResponse.json({ message: 'Packaging option not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Packaging option deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to delete packaging option ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete packaging option', error: message }, { status: 500 });
  }
}
