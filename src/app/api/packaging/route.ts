
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {packagingOptions as packagingTable} from '@/lib/schema';
import {asc} from 'drizzle-orm';

export async function GET() {
    try {
        const allOptions = await db.select().from(packagingTable).orderBy(asc(packagingTable.name));
        return NextResponse.json(allOptions);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to fetch packaging options:', error);
        return NextResponse.json({error: 'Failed to fetch packaging options', message}, {status: 500});
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, cost } = body;
        
        if (!name || cost === undefined) {
          return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const [newOption] = await db.insert(packagingTable).values({ name, cost }).returning();
        return NextResponse.json(newOption, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to create packaging option:', error);
        return NextResponse.json({error: 'Failed to create packaging option', message}, {status: 500});
    }
}
