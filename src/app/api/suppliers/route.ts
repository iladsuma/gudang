
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {suppliers as suppliersTable} from '@/drizzle/schema';
import {asc} from 'drizzle-orm';

export async function GET() {
    try {
        const allSuppliers = await db.select().from(suppliersTable).orderBy(asc(suppliersTable.name));
        return NextResponse.json(allSuppliers);
    } catch (error) {
        return NextResponse.json({error: 'Failed to fetch suppliers'}, {status: 500});
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const [newSupplier] = await db.insert(suppliersTable).values(body).returning();
        return NextResponse.json(newSupplier);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create supplier';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}
