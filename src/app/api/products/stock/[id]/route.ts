
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Product } from '@/lib/types';

const dbPath = path.resolve(process.cwd(), 'db.json');

async function readDb() {
  const data = await fs.readFile(dbPath, 'utf-8');
  return JSON.parse(data);
}

async function writeDb(data: any) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const { stock } = await request.json();

  if (typeof stock !== 'number' || stock < 0) {
      return NextResponse.json({ message: 'Stok tidak valid.' }, { status: 400 });
  }

  const db = await readDb();
  const productIndex = db.products.findIndex((p: Product) => p.id === id);

  if (productIndex === -1) {
    return NextResponse.json({ message: 'Produk tidak ditemukan.' }, { status: 404 });
  }

  const updatedProduct = { ...db.products[productIndex], stock: stock };
  db.products[productIndex] = updatedProduct;
  await writeDb(db);

  return NextResponse.json(updatedProduct);
}
