
import { db } from '@/drizzle/db';
import { shipments, products, stockMovements } from '@/drizzle/schema';
import { inArray, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

async function sendNotification(body: any) {
  try {
    const url = process.env.NODE_ENV === 'production'
      ? `https://gudang-checkout-nine.vercel.app/api/ws`
      : 'http://localhost:9002/api/ws';
      
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shipmentIds, adminUser } = body;

    if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return NextResponse.json({ message: 'Data ID pengiriman tidak valid' }, { status: 400 });
    }

    const shipmentsToProcess = await db.query.shipments.findMany({
        where: inArray(shipments.id, shipmentIds),
    });

    if (shipmentsToProcess.length === 0) {
        return NextResponse.json({ message: 'Pengiriman tidak ditemukan' }, { status: 404 });
    }

    const allProductIds = shipmentsToProcess.flatMap(s => s.products.map((p: any) => p.productId));
    const uniqueProductIds = [...new Set(allProductIds)];
    
    if (uniqueProductIds.length === 0) {
        return NextResponse.json({ message: 'Tidak ada produk dalam pengiriman yang dipilih.' }, { status: 400 });
    }
    
    const productStocks = await db.query.products.findMany({
        where: inArray(products.id, uniqueProductIds),
        columns: { id: true, stock: true, name: true }
    });
    
    const productStockMap = new Map(productStocks.map(p => [p.id, p]));

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

    await db.transaction(async (tx) => {
      await tx.update(shipments)
        .set({ status: 'Pengemasan' })
        .where(inArray(shipments.id, shipmentIds));

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
            productStockMap.set(product.productId, { ...stockInfo, stock: newStock });
          }
        }
        // Send notification to the user who created the shipment
        await sendNotification({
          recipient: shipment.userId,
          message: `Pesanan Anda ${shipment.transactionId} sedang dikemas oleh ${adminUser?.username || 'admin'}.`
        });
      }
    });

    return NextResponse.json({ message: `${shipmentIds.length} pengiriman berhasil diproses ke pengemasan.` });
  } catch (error) {
    console.error('Gagal memproses pengiriman:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal';
    return NextResponse.json({ message: 'Gagal memproses pengiriman: ' + errorMessage }, { status: 500 });
  }
}
