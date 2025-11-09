
import { db } from '@/drizzle/db';
import { customers } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, address, phone } = body;

    if (!name || !address || !phone) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const [updatedCustomer] = await db
      .update(customers)
      .set({ name, address, phone })
      .where(eq(customers.id, id))
      .returning();

    if (!updatedCustomer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to update customer', error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const [deletedCustomer] = await db.delete(customers).where(eq(customers.id, id)).returning();

    if (!deletedCustomer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to delete customer', error: message }, { status: 500 });
  }
}
