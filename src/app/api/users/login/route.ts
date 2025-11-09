
import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/drizzle/db';
import {users as usersTable} from '@/drizzle/schema';
import {eq} from 'drizzle-orm';
import type { User } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const {username, password} = await request.json();
        if (!username || !password) {
            return NextResponse.json({error: 'Username and password are required'}, {status: 400});
        }

        // Hardcoded bypass for admin user to facilitate testing without DB dependency
        if (username === 'admin' && password === 'admin') {
            console.log("Admin user bypass login successful.");
            const adminUser: Omit<User, 'password'> = {
                id: 'usr_1', // Use a consistent ID for admin
                username: 'admin',
                role: 'admin',
            };
            return NextResponse.json(adminUser);
        }
        
        // Existing database logic for other users
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
        // Provide a more descriptive error if DB connection fails
        if (error instanceof Error && error.message.includes('connect')) {
             return NextResponse.json({error: 'Tidak dapat terhubung ke database.'}, {status: 500});
        }
        return NextResponse.json({error: 'An internal error occurred'}, {status: 500});
    }
}
