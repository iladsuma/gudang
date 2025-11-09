
import { db } from '@/drizzle/db';
import { financialTransactions } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Ensure you don't update immutable fields like id, createdAt
    const { accountId, type, amount, category, description, transactionDate, referenceId } = body;
    const updateData = { accountId, type, amount, category, description, transactionDate, referenceId };


    const [updatedTransaction] = await db
      .update(financialTransactions)
      .set(updateData)
      .where(eq(financialTransactions.id, id))
      .returning();

    if (!updatedTransaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error(`Failed to update transaction ${params.id}:`, error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: 'Failed to update transaction', error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Optional: check if the transaction is referenced by something that prevents deletion
    const transaction = await db.query.financialTransactions.findFirst({ where: eq(financialTransactions.id, id) });
    if (transaction?.referenceId) {
        return NextResponse.json({ message: 'Cannot delete a transaction linked to a sale or purchase.' }, { status: 400 });
    }

    const [deletedTransaction] = await db.delete(financialTransactions).where(eq(financialTransactions.id, id)).returning();

    if (!deletedTransaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error(`Failed to delete transaction ${params.id}:`, error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: 'Failed to delete transaction', error: message }, { status: 500 });
  }
}
