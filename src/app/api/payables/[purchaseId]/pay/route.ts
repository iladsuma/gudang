
import { db } from '@/lib/db';
import { purchases, financialTransactions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { purchaseId: string } }
) {
  try {
    const { purchaseId } = params;
    const body = await request.json();
    const { accountId, paidAt } = body;

    if (!purchaseId || !accountId || !paidAt) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }
    
    const purchase = await db.query.purchases.findFirst({
        where: eq(purchases.id, purchaseId)
    });

    if (!purchase) {
        return NextResponse.json({ message: 'Pembelian tidak ditemukan' }, { status: 404 });
    }

    if (purchase.paymentStatus === 'Lunas') {
        return NextResponse.json({ message: 'Tagihan ini sudah lunas.' }, { status: 400 });
    }

    // Use a transaction
    await db.transaction(async (tx) => {
        // 1. Update purchase status
        await tx.update(purchases)
            .set({ 
                paymentStatus: 'Lunas',
                paidAt: new Date(paidAt).toISOString(),
                accountId: accountId,
             })
            .where(eq(purchases.id, purchaseId));
        
        // 2. Create financial transaction for the payment
        await tx.insert(financialTransactions).values({
            accountId: accountId,
            type: 'out',
            amount: purchase.totalAmount,
            category: 'Pembayaran Utang',
            description: `Pembayaran utang untuk pembelian ${purchase.purchaseNumber}`,
            transactionDate: new Date(paidAt).toISOString().split('T')[0],
            referenceId: purchaseId,
        });
    });

    return NextResponse.json({ message: 'Pembayaran berhasil dicatat' });
  } catch (error) {
    console.error('Gagal mencatat pembayaran utang:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal';
    return NextResponse.json({ message: 'Gagal mencatat pembayaran: ' + errorMessage }, { status: 500 });
  }
}
