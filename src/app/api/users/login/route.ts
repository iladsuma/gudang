
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {users as usersTable} from '@/drizzle/schema';
import {eq} from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const {username, password} = await request.json();
        if (!username || !password) {
            return NextResponse.json({error: 'Username and password are required'}, {status: 400});
        }
        
        const user = await db.query.users.findFirst({
            where: eq(usersTable.username, username)
        });

        if (user && user.password === password) {
            const { password: _, ...userToReturn } = user;
            return NextResponse.json(userToReturn);
        } else {
            return NextResponse.json({error: 'Username atau password salah.'}, {status: 401});
        }
    } catch (error) {
        return NextResponse.json({error: 'An internal error occurred'}, {status: 500});
    }
}
