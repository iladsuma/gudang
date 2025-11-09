
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {users as usersTable} from '@/drizzle/schema';
import {eq} from 'drizzle-orm';
import type {User} from '@/lib/types';

export async function PUT(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        const body = await request.json() as Partial<Omit<User, 'id'>>;

        if (body.username) {
            const existing = await db.select().from(usersTable).where(eq(usersTable.username, body.username));
            if (existing.length > 0 && existing[0].id !== id) {
                 return NextResponse.json({error: 'Username already taken'}, {status: 409});
            }
        }

        const [updatedUser] = await db.update(usersTable).set(body).where(eq(usersTable.id, id)).returning();
        const { password, ...userToReturn } = updatedUser;
        return NextResponse.json(userToReturn);
    } catch (error) {
        return NextResponse.json({error: 'Failed to update user'}, {status: 500});
    }
}

export async function DELETE(request: NextRequest, {params}: { params: { id: string } }) {
    try {
        const {id} = params;
        await db.delete(usersTable).where(eq(usersTable.id, id));
        return NextResponse.json({message: 'User deleted successfully'});
    } catch (error) {
        return NextResponse.json({error: 'Failed to delete user'}, {status: 500});
    }
}
