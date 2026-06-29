
import { db } from '@/lib/db';
import { suppliers } from '@/app/drizzle/schema';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const all = await db.select().from(suppliers);
        return NextResponse.json(all);
    } catch (error) {
        return NextResponse.json({ message: String(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const newItem = {
            ...body,
            id: `sup_${Date.now()}`,
        };
        await db.insert(suppliers).values(newItem);
        return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: String(error) }, { status: 500 });
    }
}
