
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
  const productUpdate: Omit<Product, 'id'> = await request.json();
  const db = await readDb();
  
  const productIndex = db.products.findIndex((p: Product) => p.id === id);

  if (productIndex === -1) {
    return NextResponse.json({ message: 'Produk tidak ditemukan.' }, { status: 404 });
  }

  if (db.products.some((p: Product) => p.id !== id && p.name.toLowerCase() === productUpdate.name.toLowerCase())) {
      return NextResponse.json({ message: 'Nama produk lain dengan nama ini sudah ada.' }, { status: 400 });
  }

  if (db.products.some((p: Product) => p.id !== id && p.code.toLowerCase() === productUpdate.code.toLowerCase())) {
      return NextResponse.json({ message: 'Kode produk lain dengan nama ini sudah ada.' }, { status: 400 });
  }

  const updatedProduct = { ...db.products[productIndex], ...productUpdate };
  db.products[productIndex] = updatedProduct;
  await writeDb(db);

  return NextResponse.json(updatedProduct);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const db = await readDb();

    const initialLength = db.products.length;
    db.products = db.products.filter((p: Product) => p.id !== id);

    if (db.products.length === initialLength) {
        return NextResponse.json({ message: 'Produk tidak ditemukan.' }, { status: 404 });
    }

    await writeDb(db);
    return new NextResponse(null, { status: 204 });
}
