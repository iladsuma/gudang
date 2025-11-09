
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {users as usersTable} from '@/drizzle/schema';
import {asc} from 'drizzle-orm';
import type {User} from '@/lib/types';

export async function GET() {
    try {
        const users = await db.select({
            id: usersTable.id,
            username: usersTable.username,
            role: usersTable.role,
        }).from(usersTable).orderBy(asc(usersTable.username));
        return NextResponse.json(users);
    } catch (error) {
         console.error("Failed to fetch users from DB, falling back to db.json", error);
        try {
            const dbJson = await import('../../../../db.json');
            const users = dbJson.users.map(u => {
                const { password, ...userToReturn } = u;
                return userToReturn as User;
            });
            return NextResponse.json(users);
        } catch (fallbackError) {
             console.error("Failed to read fallback db.json", fallbackError);
             return NextResponse.json({error: 'Failed to fetch users'}, {status: 500});
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as Omit<User, 'id'>;
        const [newUser] = await db.insert(usersTable).values(body).returning();
        const { password, ...userToReturn } = newUser;
        return NextResponse.json(userToReturn);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
        return NextResponse.json({error: errorMessage}, {status: 500});
    }
}
