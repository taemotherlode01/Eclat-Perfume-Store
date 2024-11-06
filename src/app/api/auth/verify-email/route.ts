import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'โทเค็นไม่ถูกต้อง' }, { status: 400 });
  }

  // ตรวจสอบโทเค็นในฐานข้อมูล
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return NextResponse.json({ error: 'โทเค็นหมดอายุหรือไม่ถูกต้อง' }, { status: 400 });
  }

  // อัปเดตสถานะการยืนยันอีเมลของผู้ใช้
  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  });

  // ลบโทเค็นการยืนยันอีเมลหลังจากการยืนยันสำเร็จ
  await prisma.verificationToken.delete({
    where: { token },
  });

  // ดึงค่า NEXTAUTH_URL จาก environment variable
  const redirectUrl = `${process.env.NEXTAUTH_URL}/email-verification-success`;

  // Redirect ไปยังหน้าสำเร็จการยืนยันอีเมล
  return NextResponse.redirect(redirectUrl);
}
