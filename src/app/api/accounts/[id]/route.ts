
import { db } from '@/lib/db';
import { accounts } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, type, notes } = body;

    const [updatedAccount] = await db
      .update(accounts)
      .set({ name, type, notes })
      .where(eq(accounts.id, id))
      .returning();

    if (!updatedAccount) {
      return NextResponse.json({ message: 'Akun tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(updatedAccount);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error tidak diketahui";
    return NextResponse.json({ message: 'Gagal memperbarui akun', error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const transactionCount = await db.query.financialTransactions.findFirst({
      where: eq(db.query.financialTransactions.findFirst.table.accountId, id),
    });

    if (transactionCount) {
        return NextResponse.json({ message: 'Tidak dapat menghapus akun karena masih memiliki transaksi terkait.' }, { status: 400 });
    }
    
    const [deletedAccount] = await db.delete(accounts).where(eq(accounts.id, id)).returning();

    if (!deletedAccount) {
      return NextResponse.json({ message: 'Akun tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Akun berhasil dihapus' });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error tidak diketahui";
    return NextResponse.json({ message: 'Gagal menghapus akun', error: message }, { status: 500 });
  }
}
