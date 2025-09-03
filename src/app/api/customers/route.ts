
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {customers as customersTable} from '@/drizzle/schema';
import {asc} from 'drizzle-orm';

export async function GET() {
    try {
        const allCustomers = await db.select().from(customersTable).orderBy(asc(customersTable.name));
        return NextResponse.json(allCustomers);
    } catch (error) {
        return NextResponse.json({error: 'Failed to fetch customers'}, {status: 500});
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const [newCustomer] = await db.insert(customersTable).values(body).returning();
        return NextResponse.json(newCustomer);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}
