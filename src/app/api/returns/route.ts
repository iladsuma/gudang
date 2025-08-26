
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Return, Product, StockMovement, Shipment, ReturnedProduct } from '@/lib/types';

const dbPath = path.resolve(process.cwd(), 'db.json');

async function readDb() {
  const data = await fs.readFile(dbPath, 'utf-8');
  return JSON.parse(data);
}

async function writeDb(data: any) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

export async function GET() {
  const db = await readDb();
  if (!db.returns) db.returns = [];
  const sortedReturns = [...db.returns].sort((a: Return, b: Return) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(sortedReturns);
}

interface ReturnRequest {
    originalShipmentId: string;
    products: ReturnedProduct[];
    reason: string;
}

export async function POST(request: Request) {
  try {
    const data: ReturnRequest = await request.json();
    const db = await readDb();

    if (!db.returns) db.returns = [];

    const originalShipment = db.shipments.find((s: Shipment) => s.id === data.originalShipmentId);
    if (!originalShipment) {
        return NextResponse.json({ message: 'Transaksi penjualan asli tidak ditemukan.' }, { status: 404 });
    }

    const totalAmount = data.products.reduce((sum, p) => sum + p.price * p.quantity, 0);

    const newReturn: Return = {
        id: `ret_${Date.now()}`,
        originalShipmentId: data.originalShipmentId,
        originalTransactionId: originalShipment.transactionId,
        customerName: originalShipment.customerName,
        products: data.products,
        reason: data.reason,
        totalAmount,
        createdAt: new Date().toISOString(),
    };

    // --- Stock and Stock Movement Logic ---
    data.products.forEach(p => {
        const productIndex = db.products.findIndex((prod: Product) => prod.id === p.productId);
        if (productIndex !== -1) {
            const product = db.products[productIndex];
            const stockBefore = product.stock;
            product.stock += p.quantity; // Increase stock due to return
            const stockAfter = product.stock;

            const movement: StockMovement = {
                id: `sm_ret_${Date.now()}_${p.productId}`,
                productId: p.productId,
                referenceId: newReturn.id,
                type: 'Retur',
                quantityChange: p.quantity,
                stockBefore: stockBefore,
                stockAfter: stockAfter,
                notes: `Retur dari transaksi ${originalShipment.transactionId}`,
                createdAt: new Date().toISOString(),
            };
            db.stockMovements.push(movement);
        } else {
            console.warn(`Product with ID ${p.productId} not found during return transaction.`);
        }
    });
    // --- End of Stock Logic ---


    db.returns.unshift(newReturn);
    await writeDb(db);
    return NextResponse.json(newReturn, { status: 201 });

  } catch (error) {
    console.error("Error processing return:", error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: "An unknown error occurred" }, { status: 500 });
  }
}
