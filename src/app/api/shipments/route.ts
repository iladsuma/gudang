
import { db } from '@/lib/db';
import { shipments, packagingOptions, financialTransactions } from '@/drizzle/schema';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import type { ShipmentProduct } from '@/lib/types';

export async function GET() {
    console.log("==============================================");
    console.log("LOG: Menerima permintaan GET untuk /api/shipments");
    try {
        const allShipments = await db.select().from(shipments).orderBy(desc(shipments.createdAt));
        console.log(`LOG: Berhasil mengambil ${allShipments.length} data pengiriman.`);
        return NextResponse.json(allShipments);
    } catch (error) {
        console.error('LOG: Gagal mengambil data pengiriman:', error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ message: 'Gagal mengambil data pengiriman', error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    console.log("==============================================");
    console.log("LOG: Menerima permintaan POST untuk /api/shipments");
    try {
        const body = await request.json();
        console.log("LOG: Body permintaan yang diterima:", JSON.stringify(body, null, 2));
        
        const { 
            userId, transactionId, customerId, customerName, expedition, 
            packagingId, accountId, products: shipmentProducts, receipt, paymentStatus
        } = body;

        // Validasi Awal
        console.log("LOG: Melakukan validasi awal...");
        if (!userId || !transactionId || !customerId || !customerName || !expedition || !packagingId || !paymentStatus) {
             console.error("LOG: Validasi gagal! Data yang dikirim tidak lengkap.");
             console.error("LOG: Data yang hilang:", { userId, transactionId, customerId, customerName, expedition, packagingId, paymentStatus });
             return NextResponse.json({ message: 'Data yang dikirim tidak lengkap.' }, { status: 400 });
        }
        
        if (paymentStatus === 'Lunas' && !accountId) {
             console.error("LOG: Validasi gagal! Akun pembayaran harus dipilih untuk transaksi lunas.");
             return NextResponse.json({ message: 'Akun pembayaran harus dipilih untuk transaksi lunas.' }, { status: 400 });
        }
        console.log("LOG: Validasi awal berhasil.");

        // Perhitungan Total
        console.log("LOG: Memulai perhitungan total...");
        const totalItems = shipmentProducts.reduce((sum: number, p: ShipmentProduct) => sum + p.quantity, 0);
        const totalProductCost = shipmentProducts.reduce((sum: number, p: ShipmentProduct) => sum + p.price * p.quantity, 0);
        console.log(`LOG: Total item: ${totalItems}, Total biaya produk: ${totalProductCost}`);
        
        let totalPackingCost = 0;
        if (packagingId) {
            console.log(`LOG: Mengambil biaya kemasan untuk packagingId: ${packagingId}`);
            try {
                const packagingResult = await db.select({cost: packagingOptions.cost}).from(packagingOptions).where(eq(packagingOptions.id, packagingId)).limit(1);
                if (packagingResult.length > 0) {
                    totalPackingCost = packagingResult[0].cost;
                    console.log(`LOG: Biaya kemasan ditemukan: ${totalPackingCost}`);
                } else {
                    console.warn(`LOG: Biaya kemasan untuk packagingId: ${packagingId} tidak ditemukan. Menggunakan 0.`);
                }
            } catch (dbError) {
                console.error("LOG: Error saat mengambil biaya kemasan dari DB:", dbError);
                throw new Error("Gagal mengambil data biaya kemasan.");
            }
        }
        
        const totalAmount = totalProductCost + totalPackingCost;
        console.log(`LOG: Total keseluruhan dihitung: ${totalAmount}`);
        
        console.log("LOG: Memulai transaksi database...");
        const [newShipment] = await db.transaction(async (tx) => {
            console.log("LOG: Membuat data pengiriman (shipment)...");
            const shipmentDataToInsert = {
                userId,
                transactionId,
                customerId,
                customerName,
                expedition,
                packagingId,
                accountId: paymentStatus === 'Lunas' ? accountId : null,
                status: 'Proses' as const, // Status awal
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
             console.log("LOG: Data pengiriman berhasil dibuat dengan ID:", createdShipment.id);


            if (paymentStatus === 'Lunas' && accountId) {
                 console.log("LOG: Status 'Lunas', membuat transaksi keuangan...");
                 const financialDataToInsert = {
                    accountId: accountId,
                    type: 'in' as const,
                    amount: totalAmount,
                    category: 'Penjualan',
                    description: `Penjualan dari transaksi ${transactionId}`,
                    transactionDate: new Date().toISOString().split('T')[0],
                    referenceId: createdShipment.id,
                };
                console.log("LOG: Data yang akan di-insert ke tabel 'financialTransactions':", JSON.stringify(financialDataToInsert, null, 2));
                 await tx.insert(financialTransactions).values(financialDataToInsert);
                 console.log("LOG: Transaksi keuangan berhasil dibuat.");
            }

            return [createdShipment];
        });
        
        console.log("LOG: Transaksi database berhasil.");
        console.log("==============================================");
        return NextResponse.json(newShipment, { status: 201 });

    } catch (error) {
        console.error('FATAL: Gagal membuat pengiriman pada /api/shipments/route.ts:', error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ message: 'failed to create shipment', error: message }, { status: 500 });
    }
}
