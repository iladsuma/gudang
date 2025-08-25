
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { User } from '@/lib/types';

// Path to the JSON database
const dbPath = path.resolve(process.cwd(), 'db.json');

// Function to read the database
async function readDb() {
  const data = await fs.readFile(dbPath, 'utf-8');
  return JSON.parse(data);
}

// POST handler for login
export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const db = await readDb();
    
    // Find the user in the database
    const user = db.users.find((u: User) => u.username === username);

    // For this demo, we'll just check if the username matches the password
    // In a real app, you would hash and compare passwords securely.
    if (user && user.username === password) {
      // Return the user object without the password
      const { ...userWithoutPassword } = user;
      return NextResponse.json(userWithoutPassword, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Username atau password salah.' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
