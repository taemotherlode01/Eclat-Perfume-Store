import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ฟังก์ชันสำหรับจัดการคำขอ GET
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Missing or invalid email' }, { status: 400 });
  }

  try {
    // ค้นหาผู้ใช้ตาม email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ส่งสถานะการยืนยันอีเมลกลับไป
    return NextResponse.json({ emailVerified: !!user.emailVerified }, { status: 200 });
  } catch (error) {
    console.error('Error checking email verification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
