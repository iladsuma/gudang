
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {users as usersTable} from '@/drizzle/schema';
import {asc} from 'drizzle-orm';

export async function GET() {
    try {
        const allUsers = await db.select({
            id: usersTable.id,
            username: usersTable.username,
            role: usersTable.role,
        }).from(usersTable).orderBy(asc(usersTable.username));
        return NextResponse.json(allUsers);
    } catch (error) {
        return NextResponse.json({error: 'Failed to fetch users'}, {status: 500});
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const [newUser] = await db.insert(usersTable).values(body).returning();
        const { password, ...userToReturn } = newUser;
        return NextResponse.json(userToReturn);
    } catch (error) {
        return NextResponse.json({error: 'Failed to create user'}, {status: 500});
    }
}
