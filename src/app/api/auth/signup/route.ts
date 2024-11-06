// pages/api/register.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

type UserRequestBody = {
  name: string;
  email: string;
  password: string;
};

export async function POST(request: NextRequest) {
  try {
    const { name, email, password }: UserRequestBody = await request.json();

    // ตรวจสอบว่ามีอีเมลในฐานข้อมูลอยู่แล้วหรือไม่
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'อีเมลถูกใช้งานไปแล้ว' },
        { status: 400 }
      );
    }

    // แฮชรหัสผ่าน
    const hashedPassword = bcrypt.hashSync(password, 10);

    // สร้างผู้ใช้ใหม่
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: null,
      },
    });

    // สร้างโทเค็นการยืนยันอีเมล
    const token = randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    // ตั้งค่าการส่งอีเมล (สมมุติว่าใช้ nodemailer)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // ส่งอีเมลยืนยันไปยังผู้ใช้
   // ส่วนที่ส่งอีเมลใน register.ts
const mailOptions = {
  from: process.env.GMAIL_USER,
  to: email,
  subject: 'ยืนยันอีเมลของคุณ',
  html: `
    <h3>สวัสดี ${name},</h3>
    <p>โปรดคลิกลิงก์ด้านล่างเพื่อยืนยันอีเมลของคุณ:</p>
    <a href="${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}">ยืนยันอีเมล</a>
    <p>ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง</p>
  `,
};

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      message: 'ลงทะเบียนสำเร็จ กรุณาตรวจสอบอีเมลของคุณเพื่อทำการยืนยัน',
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลงทะเบียน' },
      { status: 500 }
    );
  }
}
