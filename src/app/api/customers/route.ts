
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {customers as customerTable} from '@/drizzle/schema';
import {asc} from 'drizzle-orm';

export async function GET() {
    try {
        const allCustomers = await db.select().from(customerTable).orderBy(asc(customerTable.name));
        return NextResponse.json(allCustomers);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to fetch customers:', error);
        return NextResponse.json({error: 'Failed to fetch customers', message}, {status: 500});
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, address, phone } = body;
        
        if (!name || !address || !phone) {
          return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const [newCustomer] = await db.insert(customerTable).values({ name, address, phone }).returning();
        return NextResponse.json(newCustomer, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to create customer:', error);
        return NextResponse.json({error: 'Failed to create customer', message}, {status: 500});
    }
}
