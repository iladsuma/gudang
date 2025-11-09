
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {packagingOptions as packagingTable} from '@/drizzle/schema';
import {asc} from 'drizzle-orm';

export async function GET() {
    try {
        const allOptions = await db.select().from(packagingTable).orderBy(asc(packagingTable.name));
        return NextResponse.json(allOptions);
    } catch (error) {
        return NextResponse.json({error: 'Failed to fetch packaging options'}, {status: 500});
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const [newOption] = await db.insert(packagingTable).values(body).returning();
        return NextResponse.json(newOption);
    } catch (error) {
        return NextResponse.json({error: 'Failed to create packaging option'}, {status: 500});
    }
}
