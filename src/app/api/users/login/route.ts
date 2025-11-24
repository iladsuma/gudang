import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dbPath = path.join(process.cwd(), 'db.json');

async function readDb() {
    try {
        const fileContent = await fs.readFile(dbPath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error("Error reading db.json:", error);
        throw new Error("Could not read database.");
    }
}

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
        }

        const db = await readDb();
        const user = db.users.find(
            (u: any) => u.username === username && u.password === password
        );

        if (user) {
            // Do not send password back to the client
            const { password, ...userWithoutPassword } = user;
            return NextResponse.json(userWithoutPassword, { status: 200 });
        } else {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        return NextResponse.json({ message }, { status: 500 });
    }
}
