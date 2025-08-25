
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

export async function GET() {
  const db = await readDb();
  const sortedExpeditions = [...db.expeditions].sort((a,b) => a.name.localeCompare(b.name));
  return NextResponse.json(sortedExpeditions);
}

export async function POST(request: Request) {
  const { name } = await request.json();
  const db = await readDb();

  if (db.expeditions.some((e: Expedition) => e.name.toLowerCase() === name.toLowerCase())) {
    return NextResponse.json({ message: 'Nama ekspedisi sudah ada.' }, { status: 400 });
  }

  const newExpedition: Expedition = {
    id: `exp_${Date.now()}`,
    name,
  };

  db.expeditions.push(newExpedition);
  await writeDb(db);
  return NextResponse.json(newExpedition, { status: 201 });
}
