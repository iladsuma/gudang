
import { db } from '@/drizzle/db';
import { shipments, financialTransactions } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { shipmentId: string } }
) {
  try {
    const { shipmentId } = params;
    const body = await request.json();
    const { accountId, paidAt } = body;

    if (!shipmentId || !accountId || !paidAt) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }

    const shipment = await db.query.shipments.findFirst({
        where: eq(shipments.id, shipmentId)
    });

    if (!shipment) {
        return NextResponse.json({ message: 'Pengiriman tidak ditemukan' }, { status: 404 });
    }

    if (shipment.paymentStatus === 'Lunas') {
        return NextResponse.json({ message: 'Tagihan ini sudah lunas.' }, { status: 400 });
    }

    // Use a transaction to ensure both operations succeed or fail together
    await db.transaction(async (tx) => {
        // 1. Update shipment status
        await tx.update(shipments)
            .set({ 
                paymentStatus: 'Lunas',
                paidAt: new Date(paidAt).toISOString(),
                accountId: accountId,
             })
            .where(eq(shipments.id, shipmentId));
        
        // 2. Create a financial transaction for the payment
        await tx.insert(financialTransactions).values({
            accountId: accountId,
            type: 'in',
            amount: shipment.totalAmount,
            category: 'Penerimaan Piutang',
            description: `Penerimaan pembayaran untuk transaksi ${shipment.transactionId}`,
            transactionDate: new Date(paidAt).toISOString().split('T')[0],
            referenceId: shipmentId,
        });
    });


    return NextResponse.json({ message: 'Pembayaran berhasil dicatat' });
  } catch (error) {
    console.error('Gagal mencatat pembayaran piutang:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal';
    return NextResponse.json({ message: 'Gagal mencatat pembayaran: ' + errorMessage }, { status: 500 });
  }
}
