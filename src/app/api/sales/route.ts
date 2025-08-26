
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Shipment, Product, StockMovement, User, Customer, ShipmentProduct } from '@/lib/types';

const dbPath = path.resolve(process.cwd(), 'db.json');

async function readDb() {
  const data = await fs.readFile(dbPath, 'utf-8');
  return JSON.parse(data);
}

async function writeDb(data: any) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

export async function POST(request: Request) {
  try {
    const { user, customerId, products }: { user: User, customerId: string, products: ShipmentProduct[] } = await request.json();
    const db = await readDb();

    // 1. Check stock for all products first
    for (const product of products) {
        const masterProduct = db.products.find((p: Product) => p.id === product.productId);
        if (!masterProduct) {
            return NextResponse.json({ message: `Produk "${product.name}" tidak ditemukan.` }, { status: 400 });
        }
        if (masterProduct.stock < product.quantity) {
            return NextResponse.json({ message: `Stok tidak mencukupi untuk "${product.name}". Sisa: ${masterProduct.stock}, Dibutuhkan: ${product.quantity}.` }, { status: 400 });
        }
    }

    // 2. All stock is sufficient, proceed with transaction
    const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalAmount = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const customer = db.customers.find((c: Customer) => c.id === customerId);
    if (!customer) {
        return NextResponse.json({ message: 'Pelanggan tidak ditemukan.' }, { status: 400 });
    }

    const newShipment: Shipment = {
        id: `sale_${Date.now()}`,
        user: user.username,
        transactionId: `KASIR-${Date.now()}`,
        customerId: customerId,
        customerName: customer.name,
        expedition: 'Langsung', // Direct sale indicator
        packagingId: 'pkg_direct', // Direct sale indicator
        status: 'Terkirim', // Completed immediately
        products: products,
        totalItems: totalItems,
        totalProductCost: totalAmount,
        totalPackingCost: 0,
        totalAmount: totalAmount,
        createdAt: new Date().toISOString(),
    };

    // 3. Deduct stock and create stock movements
    products.forEach(p => {
        const productIndex = db.products.findIndex((prod: Product) => prod.id === p.productId);
        if (productIndex !== -1) {
            const product = db.products[productIndex];
            const stockBefore = product.stock;
            product.stock -= p.quantity;
            const stockAfter = product.stock;

            const movement: StockMovement = {
                id: `sm_sale_${Date.now()}_${p.productId}`,
                productId: p.productId,
                referenceId: newShipment.id,
                type: 'Penjualan',
                quantityChange: -p.quantity,
                stockBefore: stockBefore,
                stockAfter: stockAfter,
                notes: `Penjualan langsung (Kasir) - ${newShipment.transactionId}`,
                createdAt: new Date().toISOString(),
            };
            db.stockMovements.push(movement);
        }
    });

    // 4. Save shipment and persist DB
    db.shipments.unshift(newShipment);
    await writeDb(db);

    return NextResponse.json(newShipment, { status: 201 });

  } catch (error) {
    console.error("Error processing direct sale:", error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: "An unknown error occurred" }, { status: 500 });
  }
}
