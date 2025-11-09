
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {expeditions as expeditionsTable} from '@/drizzle/schema';
import {asc} from 'drizzle-orm';

export async function GET() {
    try {
        const allExpeditions = await db.select().from(expeditionsTable).orderBy(asc(expeditionsTable.name));
        return NextResponse.json(allExpeditions);
    } catch (error) {
        return NextResponse.json({error: 'Failed to fetch expeditions'}, {status: 500});
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const [newExpedition] = await db.insert(expeditionsTable).values({name: body.name}).returning();
        return NextResponse.json(newExpedition);
    } catch (error) {
        return NextResponse.json({error: 'Failed to create expedition'}, {status: 500});
    }
}
