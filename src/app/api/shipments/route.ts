
import { db } from '@/drizzle/db';
import { shipments, packagingOptions, financialTransactions } from '@/drizzle/schema';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import type { ShipmentProduct } from '@/lib/types';

export async function GET() {
    try {
        const allShipments = await db.select().from(shipments).orderBy(desc(shipments.createdAt));
        return NextResponse.json(allShipments);
    } catch (error) {
        console.error('Gagal mengambil data pengiriman:', error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ message: 'Gagal mengambil data pengiriman', error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("LOG: Menerima permintaan POST /api/shipments dengan body:", JSON.stringify(body, null, 2));
        
        const { 
            userId, transactionId, customerId, customerName, expedition, 
            packagingId, accountId, products: shipmentProducts, receipt, paymentStatus
        } = body;

        if (!userId || !transactionId || !customerId || !customerName || !expedition || !packagingId || !paymentStatus) {
             console.error("LOG: Validasi gagal, data tidak lengkap.");
             return NextResponse.json({ message: 'Data yang dikirim tidak lengkap.' }, { status: 400 });
        }
        
        if (paymentStatus === 'Lunas' && !accountId) {
             console.error("LOG: Validasi gagal, akun pembayaran tidak ada untuk transaksi lunas.");
             return NextResponse.json({ message: 'Akun pembayaran harus dipilih untuk transaksi lunas.' }, { status: 400 });
        }

        const totalItems = shipmentProducts.reduce((sum: number, p: ShipmentProduct) => sum + p.quantity, 0);
        const totalProductCost = shipmentProducts.reduce((sum: number, p: ShipmentProduct) => sum + p.price * p.quantity, 0);
        
        let totalPackingCost = 0;
        if (packagingId) {
             try {
                console.log("LOG: Mencari biaya kemasan untuk packagingId:", packagingId);
                const packagingResult = await db.select({cost: packagingOptions.cost}).from(packagingOptions).where(eq(packagingOptions.id, packagingId)).limit(1);
                if (packagingResult.length > 0) {
                    totalPackingCost = packagingResult[0].cost;
                    console.log("LOG: Biaya kemasan ditemukan:", totalPackingCost);
                } else {
                    console.warn("LOG: packagingId tidak ditemukan di DB:", packagingId);
                }
            } catch (dbError) {
                console.error("FATAL: Error saat mengambil biaya kemasan dari DB:", dbError);
                throw new Error("Gagal mengambil data biaya kemasan.");
            }
        }
        
        const totalAmount = totalProductCost + totalPackingCost;
        
        console.log("LOG: Memulai transaksi database...");
        const [newShipment] = await db.transaction(async (tx) => {
            const shipmentDataToInsert = {
                userId,
                transactionId,
                customerId,
                customerName,
                expedition,
                packagingId,
                accountId: paymentStatus === 'Lunas' ? accountId : null,
                status: 'Proses' as const,
                paymentStatus: paymentStatus,
                products: shipmentProducts,
                receipt,
                totalItems,
                totalProductCost,
                totalPackingCost,
                totalAmount,
                totalRevenue: totalAmount,
            };
            console.log("LOG: Data yang akan di-insert ke tabel 'shipments':", JSON.stringify(shipmentDataToInsert, null, 2));
             const [createdShipment] = await tx.insert(shipments).values(shipmentDataToInsert).returning();
            console.log("LOG: Pengiriman berhasil dibuat di DB dengan ID:", createdShipment.id);

            if (paymentStatus === 'Lunas' && accountId) {
                const financialTxData = {
                    accountId: accountId,
                    type: 'in' as const,
                    amount: totalAmount,
                    category: 'Penjualan',
                    description: `Penjualan dari transaksi ${transactionId}`,
                    transactionDate: new Date().toISOString().split('T')[0],
                    referenceId: createdShipment.id,
                };
                 console.log("LOG: Membuat transaksi keuangan:", JSON.stringify(financialTxData, null, 2));
                 await tx.insert(financialTransactions).values(financialTxData);
                 console.log("LOG: Transaksi keuangan berhasil dibuat.");
            }

            return [createdShipment];
        });
        console.log("LOG: Transaksi database selesai.");
        
        return NextResponse.json(newShipment, { status: 201 });

    } catch (error) {
        console.error('FATAL: Gagal membuat pengiriman pada /api/shipments/route.ts:', error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ message: 'failed to create shipment', error: message }, { status: 500 });
    }
}
