
import { db } from '@/lib/db';
import { shipments, financialTransactions, accounts } from '@/app/drizzle/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { shipmentId, accountId, paidAt } = await req.json();
        
        const shipment = await db.query.shipments.findFirst({
            where: eq(shipments.id, shipmentId)
        });

        if (!shipment) {
            return NextResponse.json({ message: 'Pesanan tidak ditemukan' }, { status: 404 });
        }

        const remainingAmount = shipment.totalAmount - (shipment.downPayment || 0);

        if (remainingAmount <= 0) {
             return NextResponse.json({ message: 'Pesanan ini sudah lunas' }, { status: 400 });
        }

        await db.transaction(async (tx) => {
            // 1. Perbarui status pesanan
            await tx.update(shipments)
                .set({ 
                    paymentStatus: 'Lunas', 
                    paidAt: new Date(paidAt),
                    accountId: accountId 
                })
                .where(eq(shipments.id, shipmentId));

            // 2. Catat transaksi masuk di buku kas
            await tx.insert(financialTransactions).values({
                id: `ft_${Date.now()}`,
                accountId: accountId,
                type: 'in',
                amount: remainingAmount,
                category: 'Pelunasan Pesanan',
                description: `Pelunasan ${shipment.transactionId} (${shipment.customerName})`,
                transactionDate: new Date(paidAt).toISOString().split('T')[0],
                referenceId: shipmentId,
            });

            // 3. Tambah saldo akun
            await tx.update(accounts)
                .set({ balance: sql`${accounts.balance} + ${remainingAmount}` })
                .where(eq(accounts.id, accountId));
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("PAY RECEIVABLE Error:", error);
        return NextResponse.json({ message: String(error) }, { status: 500 });
    }
}
