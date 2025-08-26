
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Purchase, Product, StockMovement, Supplier } from '@/lib/types';

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
  if (!db.purchases) db.purchases = [];
  const sortedPurchases = [...db.purchases].sort((a: Purchase, b: Purchase) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(sortedPurchases);
}

export async function POST(request: Request) {
  try {
    const data: Omit<Purchase, 'id' | 'createdAt' | 'status' | 'totalAmount'> & { supplierName: string } = await request.json();
    const db = await readDb();

    if (!db.purchases) db.purchases = [];

    const totalAmount = data.products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

    const newPurchase: Purchase = {
        ...data,
        id: `purch_${Date.now()}`,
        status: 'Selesai',
        totalAmount,
        createdAt: new Date().toISOString(),
    };

    // --- Stock and Stock Movement Logic ---
    data.products.forEach(p => {
        const productIndex = db.products.findIndex((prod: Product) => prod.id === p.productId);
        if (productIndex !== -1) {
            const product = db.products[productIndex];
            const stockBefore = product.stock;
            product.stock += p.quantity; // Increase stock
            const stockAfter = product.stock;

            const movement: StockMovement = {
                id: `sm_purch_${Date.now()}_${p.productId}`,
                productId: p.productId,
                referenceId: newPurchase.id,
                type: 'Pembelian',
                quantityChange: p.quantity,
                stockBefore: stockBefore,
                stockAfter: stockAfter,
                notes: `Pembelian dari ${data.supplierName} (No: ${data.purchaseNumber})`,
                createdAt: new Date().toISOString(),
            };
            db.stockMovements.push(movement);
        } else {
            // Handle case where product is not found, maybe throw an error
            console.warn(`Product with ID ${p.productId} not found during purchase transaction.`);
        }
    });
    // --- End of Stock Logic ---


    db.purchases.unshift(newPurchase);
    await writeDb(db);
    return NextResponse.json(newPurchase, { status: 201 });

  } catch (error) {
    console.error("Error processing purchase:", error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: "An unknown error occurred" }, { status: 500 });
  }
}
