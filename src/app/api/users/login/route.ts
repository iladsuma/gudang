
import { NextResponse } from 'next/server';
import data from '../../../../../db.json';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username dan password harus diisi' }, { status: 400 });
    }
    
    const user = data.users.find(u => u.username === username && u.password === password);

    if (!user) {
      return NextResponse.json({ message: 'Username atau password salah' }, { status: 401 });
    }
    
    // Jangan kirim password ke client
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
