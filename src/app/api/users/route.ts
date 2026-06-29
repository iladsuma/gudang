
import { db } from '@/lib/db';
import { users } from '@/app/drizzle/schema';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const allUsers = await db.select().from(users);
        return NextResponse.json(allUsers);
    } catch (error) {
        return NextResponse.json({ message: String(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const newUser = {
            ...body,
            id: `usr_${Date.now()}`,
        };
        await db.insert(users).values(newUser);
        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: String(error) }, { status: 500 });
    }
}
