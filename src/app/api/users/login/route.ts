import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/app/drizzle/schema';
import { eq } from 'drizzle-orm';


export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
        }
        
        const user = await db.query.users.findFirst({
            where: and(eq(users.username, username), eq(users.password, password))
        });

        if (user) {
            const { password, ...userWithoutPassword } = user;
            return NextResponse.json(userWithoutPassword, { status: 200 });
        } else {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error("Login API Error:", error);
        return NextResponse.json({ message }, { status: 500 });
    }
}