
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Product } from '@/lib/types';

const dbPath = path.resolve(process.cwd(), 'db.json');

async function readDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist, create it with a default structure
    if (error.code === 'ENOENT') {
      const defaultDb = { users: [], products: [], expeditions: [], packagingOptions: [], shipments: [], checkoutHistory: [] };
      await fs.writeFile(dbPath, JSON.stringify(defaultDb, null, 2));
      return defaultDb;
    }
    throw error;
  }
}

async function writeDb(data: any) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

export async function GET() {
  const db = await readDb();
  const sortedProducts = [...db.products].sort((a,b) => a.name.localeCompare(b.name));
  return NextResponse.json(sortedProducts);
}

export async function POST(request: Request) {
  const productData: Omit<Product, 'id'> = await request.json();
  const db = await readDb();

  if (db.products.some((p: Product) => p.name.toLowerCase() === productData.name.toLowerCase())) {
    return NextResponse.json({ message: 'Nama produk sudah ada.' }, { status: 400 });
  }
  if (db.products.some((p: Product) => p.code.toLowerCase() === productData.code.toLowerCase())) {
    return NextResponse.json({ message: 'Kode produk sudah ada.' }, { status: 400 });
  }

  const newProduct: Product = {
    ...productData,
    id: `prod_${Date.now()}`,
  };

  db.products.push(newProduct);
  await writeDb(db);
  return NextResponse.json(newProduct, { status: 201 });
}
