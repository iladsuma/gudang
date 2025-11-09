
import { db } from '../../../../drizzle/db';
import { shipments, products, stockMovements } from '../../../../drizzle/schema';
import { inArray, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getNotificationContext } from '@/context/notification-context';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shipmentIds } = body;

    if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return NextResponse.json({ message: 'Data ID pengiriman tidak valid' }, { status: 400 });
    }

    // Ambil semua pengiriman dan produk yang relevan dalam satu panggilan
    const shipmentsToProcess = await db.query.shipments.findMany({
        where: inArray(shipments.id, shipmentIds),
    });

    if (shipmentsToProcess.length === 0) {
        return NextResponse.json({ message: 'Pengiriman tidak ditemukan' }, { status: 404 });
    }

    const allProductIds = shipmentsToProcess.flatMap(s => s.products.map((p: any) => p.productId));
    const uniqueProductIds = [...new Set(allProductIds)];
    
    const productStocks = await db.query.products.findMany({
        where: inArray(products.id, uniqueProductIds),
        columns: { id: true, stock: true, name: true }
    });
    
    const productStockMap = new Map(productStocks.map(p => [p.id, p]));

    // Validasi stok
    for (const shipment of shipmentsToProcess) {
        if (shipment.status !== 'Proses') {
            return NextResponse.json({ message: `Pengiriman ${shipment.transactionId} sudah diproses sebelumnya.` }, { status: 400 });
        }
        for (const product of shipment.products) {
            const stockInfo = productStockMap.get(product.productId);
            if (!stockInfo || stockInfo.stock < product.quantity) {
                return NextResponse.json({ message: `Stok untuk produk "${product.name}" tidak mencukupi.` }, { status: 400 });
            }
        }
    }

    // Lakukan transaksi database
    await db.transaction(async (tx) => {
      // 1. Update status pengiriman
      await tx.update(shipments)
        .set({ status: 'Pengemasan' })
        .where(inArray(shipments.id, shipmentIds));

      // 2. Kurangi stok dan catat pergerakan stok
      for (const shipment of shipmentsToProcess) {
        for (const product of shipment.products) {
          const stockInfo = productStockMap.get(product.productId);
          if (stockInfo) {
            const newStock = stockInfo.stock - product.quantity;
            await tx.update(products)
              .set({ stock: newStock })
              .where(eq(products.id, product.productId));

            await tx.insert(stockMovements).values({
              productId: product.productId,
              referenceId: shipment.id,
              type: 'Penjualan',
              quantityChange: -product.quantity,
              stockBefore: stockInfo.stock,
              stockAfter: newStock,
              notes: `Penjualan dari transaksi ${shipment.transactionId}`,
            });
             // Update map for subsequent checks within the same batch
            productStockMap.set(product.productId, { ...stockInfo, stock: newStock });
          }
        }
      }
    });

    return NextResponse.json({ message: `${shipmentIds.length} pengiriman berhasil diproses ke pengemasan.` });
  } catch (error) {
    console.error('Gagal memproses pengiriman:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal';
    return NextResponse.json({ message: 'Gagal memproses pengiriman: ' + errorMessage }, { status: 500 });
  }
}
