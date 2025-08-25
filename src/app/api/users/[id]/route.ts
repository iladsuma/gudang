
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { User } from '@/lib/types';

// WARNING: See warning in /api/users/route.ts

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
    return true;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    if (!await isAdmin(request)) {
        return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const { id } = params;
    const data: Partial<Omit<User, 'id'>> = await request.json();
    const db = await readDb();
    
    const userIndex = db.users.findIndex((u: User) => u.id === id);

    if (userIndex === -1) {
        return NextResponse.json({ message: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    if (data.username && db.users.some((u: User) => u.id !== id && u.username.toLowerCase() === data.username.toLowerCase())) {
        return NextResponse.json({ message: 'Username lain dengan nama ini sudah ada.' }, { status: 400 });
    }

    // Never update password if it's empty or null
    if (!data.password) {
        delete data.password;
    }

    const updatedUser = { ...db.users[userIndex], ...data };
    db.users[userIndex] = updatedUser;
    await writeDb(db);
    
    const { password, ...userToReturn } = updatedUser;
    return NextResponse.json(userToReturn);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    if (!await isAdmin(request)) {
        return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }
    
    const { id } = params;
    const db = await readDb();

    // Prevent deleting the last admin user
    const userToDelete = db.users.find((u: User) => u.id === id);
    if(userToDelete?.role === 'admin') {
        const adminCount = db.users.filter((u: User) => u.role === 'admin').length;
        if(adminCount <= 1) {
            return NextResponse.json({ message: 'Tidak dapat menghapus admin terakhir.' }, { status: 400 });
        }
    }


    const initialLength = db.users.length;
    db.users = db.users.filter((u: User) => u.id !== id);

    if (db.users.length === initialLength) {
        return NextResponse.json({ message: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    await writeDb(db);
    return new NextResponse(null, { status: 204 });
}
