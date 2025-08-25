
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Packaging } from '@/lib/types';

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
  const data: Omit<Packaging, 'id'> = await request.json();
  const db = await readDb();
  
  const optionIndex = db.packagingOptions.findIndex((o: Packaging) => o.id === id);

  if (optionIndex === -1) {
    return NextResponse.json({ message: 'Tipe kemasan tidak ditemukan.' }, { status: 404 });
  }
  
  if (db.packagingOptions.some((o: Packaging) => o.id !== id && o.name.toLowerCase() === data.name.toLowerCase())) {
    return NextResponse.json({ message: 'Tipe kemasan lain dengan nama ini sudah ada.' }, { status: 400 });
  }

  const updatedOption = { ...db.packagingOptions[optionIndex], ...data };
  db.packagingOptions[optionIndex] = updatedOption;
  await writeDb(db);

  return NextResponse.json(updatedOption);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const db = await readDb();

    const initialLength = db.packagingOptions.length;
    db.packagingOptions = db.packagingOptions.filter((o: Packaging) => o.id !== id);

    if (db.packagingOptions.length === initialLength) {
        return NextResponse.json({ message: 'Tipe kemasan tidak ditemukan.' }, { status: 404 });
    }

    await writeDb(db);
    return new NextResponse(null, { status: 204 });
}
