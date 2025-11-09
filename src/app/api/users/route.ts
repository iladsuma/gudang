
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {users} from '@/lib/schema';
import {asc} from 'drizzle-orm';

export async function GET() {
    try {
        const allUsers = await db.query.users.findMany({
            columns: {
                password: false, // exclude password
            },
            orderBy: [asc(users.username)]
        });
        return NextResponse.json(allUsers);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to fetch users:', error);
        return NextResponse.json({error: 'Failed to fetch users', message}, {status: 500});
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        if (!body.username || !body.password || !body.role) {
          return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const [newUser] = await db.insert(users).values(body).returning();
        
        const { password, ...userWithoutPassword } = newUser;
        return NextResponse.json(userWithoutPassword, { status: 201 });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to create user:', error);
        return NextResponse.json({error: 'Failed to create user', message}, {status: 500});
    }
}
