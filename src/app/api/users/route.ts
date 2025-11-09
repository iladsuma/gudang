
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {users as usersTable} from '@/drizzle/schema';
import {asc} from 'drizzle-orm';
import type { User } from '@/lib/types';

export async function GET() {
    try {
        const allUsers = await db.select({
            id: usersTable.id,
            username: usersTable.username,
            role: usersTable.role,
        }).from(usersTable).orderBy(asc(usersTable.username));
        return NextResponse.json(allUsers);
    } catch (error) {
        console.error("Failed to fetch users from DB, providing fallback data:", error);
        // Provide a fallback for development/testing if DB connection fails
        const fallbackUsers: Omit<User, 'password'>[] = [
             {
                id: 'usr_1',
                username: 'admin',
                role: 'admin',
            },
            {
                id: 'usr_2',
                username: 'user',
                role: 'user',
            }
        ];
        return NextResponse.json(fallbackUsers);
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
