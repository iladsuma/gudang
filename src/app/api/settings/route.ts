import { db } from '@/lib/db';
import { appSettings } from '@/app/drizzle/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await db.select().from(appSettings);
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ message: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { settings } = await req.json();
    
    await db.transaction(async (tx) => {
      for (const setting of settings) {
        await tx.insert(appSettings)
          .values({ 
            id: setting.key, // Using key as ID for simplicity in this MVP
            key: setting.key, 
            value: setting.value,
            updatedAt: new Date()
          })
          .onConflictDoUpdate({
            target: appSettings.key,
            set: { value: setting.value, updatedAt: new Date() }
          });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: String(error) }, { status: 500 });
  }
}