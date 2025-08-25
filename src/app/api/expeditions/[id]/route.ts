
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Expedition } from '@/lib/types';

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
  const { name } = await request.json();
  const db = await readDb();
  
  const expeditionIndex = db.expeditions.findIndex((e: Expedition) => e.id === id);

  if (expeditionIndex === -1) {
    return NextResponse.json({ message: 'Ekspedisi tidak ditemukan.' }, { status: 404 });
  }
  
  if (db.expeditions.some((e: Expedition) => e.id !== id && e.name.toLowerCase() === name.toLowerCase())) {
    return NextResponse.json({ message: 'Nama ekspedisi lain dengan nama ini sudah ada.' }, { status: 400 });
  }

  const updatedExpedition = { ...db.expeditions[expeditionIndex], name };
  db.expeditions[expeditionIndex] = updatedExpedition;
  await writeDb(db);

  return NextResponse.json(updatedExpedition);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const db = await readDb();

    const initialLength = db.expeditions.length;
    db.expeditions = db.expeditions.filter((e: Expedition) => e.id !== id);

    if (db.expeditions.length === initialLength) {
        return NextResponse.json({ message: 'Ekspedisi tidak ditemukan.' }, { status: 404 });
    }

    await writeDb(db);
    return new NextResponse(null, { status: 204 });
}
