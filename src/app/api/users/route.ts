
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { User } from '@/lib/types';

// WARNING: This is a simplified implementation for demonstration purposes.
// In a real production application, you MUST:
// 1. Hash passwords using a strong algorithm like bcrypt. NEVER store plain text passwords.
// 2. Implement proper session management (e.g., using JWT or server-side sessions)
//    to verify the user's role on every protected API request, instead of trusting client-side context.

const dbPath = path.resolve(process.cwd(), 'db.json');

async function readDb() {
  const data = await fs.readFile(dbPath, 'utf-8');
  return JSON.parse(data);
}

async function writeDb(data: any) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

// TODO: Implement proper role-checking middleware based on authenticated session
async function isAdmin(request: Request): Promise<boolean> {
    // For this demo, we're skipping actual auth checks.
    // In a real app, you would validate a token or session here.
    return true; 
}


export async function GET(request: Request) {
    if (!await isAdmin(request)) {
        return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }
    const db = await readDb();
    // Never return passwords to the client
    const usersWithoutPasswords = db.users.map((u: User) => {
        const { password, ...user } = u;
        return user;
    });
    return NextResponse.json(usersWithoutPasswords);
}

export async function POST(request: Request) {
    if (!await isAdmin(request)) {
        return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const data: Omit<User, 'id'> = await request.json();
    const db = await readDb();

    if (!data.username || !data.password) {
         return NextResponse.json({ message: 'Username dan password harus diisi.' }, { status: 400 });
    }

    if (db.users.some((u: User) => u.username.toLowerCase() === data.username.toLowerCase())) {
        return NextResponse.json({ message: 'Username sudah digunakan.' }, { status: 400 });
    }

    const newUser: User = {
        ...data,
        id: `usr_${Date.now()}`,
    };

    db.users.push(newUser);
    await writeDb(db);
    
    const { password, ...userToReturn } = newUser;
    return NextResponse.json(userToReturn, { status: 201 });
}
