
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

export async function GET() {
  const db = await readDb();
  const sortedOptions = [...db.packagingOptions].sort((a,b) => a.name.localeCompare(b.name));
  return NextResponse.json(sortedOptions);
}

export async function POST(request: Request) {
  const data: Omit<Packaging, 'id'> = await request.json();
  const db = await readDb();

  if (db.packagingOptions.some((o: Packaging) => o.name.toLowerCase() === data.name.toLowerCase())) {
    return NextResponse.json({ message: 'Nama kemasan sudah ada.' }, { status: 400 });
  }

  const newOption: Packaging = {
    ...data,
    id: `pkg_${Date.now()}`,
  };

  db.packagingOptions.push(newOption);
  await writeDb(db);
  return NextResponse.json(newOption, { status: 201 });
}
