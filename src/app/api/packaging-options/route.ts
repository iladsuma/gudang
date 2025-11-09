
import { db } from '@/drizzle/db';
import { packagingOptions } from '@/drizzle/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const allPackagingOptions = await db.query.packagingOptions.findMany();
    return NextResponse.json(allPackagingOptions);
  } catch (error) {
    console.error('Failed to fetch packaging options:', error);
    return NextResponse.json({ message: 'Failed to fetch packaging options' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, cost } = body;

    if (!name || cost === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const [newOption] = await db.insert(packagingOptions).values({ name, cost }).returning();
    
    return NextResponse.json(newOption, { status: 201 });
  } catch (error) {
    console.error('Failed to add packaging option:', error);
    return NextResponse.json({ message: 'Failed to add packaging option' }, { status: 500 });
  }
}
