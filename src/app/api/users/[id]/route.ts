
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const [updatedUser] = await db
      .update(users)
      .set(body)
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const { password, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
    
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: 'Failed to update user', error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const [deletedUser] = await db.delete(users).where(eq(users.id, id)).returning();

    if (!deletedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
     const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: 'Failed to delete user', error: message }, { status: 500 });
  }
}
