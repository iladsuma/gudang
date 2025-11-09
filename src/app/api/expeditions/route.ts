
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {expeditions as expeditionTable} from '@/drizzle/schema';
import {asc} from 'drizzle-orm';

export async function GET() {
    try {
        const allExpeditions = await db.select().from(expeditionTable).orderBy(asc(expeditionTable.name));
        return NextResponse.json(allExpeditions);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to fetch expeditions:', error);
        return NextResponse.json({error: 'Failed to fetch expeditions', message}, {status: 500});
    }
}

export async function POST(request: NextRequest) {
    try {
        const { name } = await request.json();
        
        if (!name) {
          return NextResponse.json({ message: 'Name is required' }, { status: 400 });
        }

        const [newExpedition] = await db.insert(expeditionTable).values({ name }).returning();
        return NextResponse.json(newExpedition, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to create expedition:', error);
        return NextResponse.json({error: 'Failed to create expedition', message}, {status: 500});
    }
}
