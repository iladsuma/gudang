
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Shipment, Product } from '@/lib/types';

const dbPath = path.resolve(process.cwd(), 'db.json');

async function readDb() {
  const data = await fs.readFile(dbPath, 'utf-8');
  return JSON.parse(data);
}

async function writeDb(data: any) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

export async function POST(request: Request) {
  const { shipmentIds } = await request.json();
  const db = await readDb();

  const shipmentsToProcess = db.shipments.filter((s: Shipment) => shipmentIds.includes(s.id));
  
  if (shipmentsToProcess.length === 0) {
    return NextResponse.json({ message: "Tidak ada pengiriman yang valid untuk diproses." }, { status: 400 });
  }
  
  if (shipmentsToProcess.some((s: Shipment) => s.status !== 'Proses')) {
    return NextResponse.json({ message: "Hanya pengiriman dengan status 'Proses' yang bisa dibungkus." }, { status: 400 });
  }

  // Stock Deduction Logic
  const allMasterProducts = db.products;
  const productStockUpdates: { [productId: string]: number } = {};

  for (const shipment of shipmentsToProcess) {
    for (const product of shipment.products) {
      const masterProduct = allMasterProducts.find((p: Product) => p.id === product.productId);
      if (!masterProduct) {
        return NextResponse.json({ message: `Produk dengan kode "${product.code}" tidak ditemukan di database.` }, { status: 400 });
      }
      const currentStock = (productStockUpdates[product.productId] !== undefined) ? productStockUpdates[product.productId] : masterProduct.stock;
      const stockNeeded = product.quantity;
      const stockAfterThisTx = currentStock - stockNeeded;

      if (stockAfterThisTx < 0) {
        return NextResponse.json({ message: `Stok tidak mencukupi untuk produk "${product.name}". Stok sisa: ${currentStock}, dibutuhkan: ${stockNeeded}.` }, { status: 400 });
      }
      productStockUpdates[product.productId] = stockAfterThisTx;
    }
  }

  // Apply stock updates and status changes
  db.products.forEach((p: Product, index: number) => {
    if (productStockUpdates[p.id] !== undefined) {
      db.products[index].stock = productStockUpdates[p.id];
    }
  });

  db.shipments.forEach((s: Shipment, index: number) => {
    if (shipmentIds.includes(s.id)) {
      db.shipments[index].status = 'Pengemasan';
    }
  });
  
  await writeDb(db);

  return new NextResponse(null, { status: 204 });
}
