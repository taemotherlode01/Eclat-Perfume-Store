import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

type ResendRequestBody = {
  email: string;
};

export async function POST(request: NextRequest) {
  try {
    // Check the request body content
    const { email }: ResendRequestBody = await request.json();

    // Log the incoming email for debugging
    console.log('Email received in request body:', email);

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required for resending verification' },
        { status: 400 }
      );
    }

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If the user is not found, return an error
    if (!user) {
      console.log('User not found for email:', email);
      return NextResponse.json(
        { error: 'ไม่พบอีเมลนี้ในระบบ กรุณาลงทะเบียนก่อน' },
        { status: 400 }
      );
    }

    // If the email is already verified, return a message
    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'อีเมลนี้ได้รับการยืนยันแล้ว' },
        { status: 400 }
      );
    }

    // Create a new email verification token
    const token = randomBytes(32).toString('hex');

    // Check if there's an existing verification token
    const existingToken = await prisma.verificationToken.findFirst({
      where: { identifier: email },
    });

    // Log the existing token details for debugging
    console.log('Existing token details:', existingToken);

    // Upsert the verification token in the database
    await prisma.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: email,
          token: existingToken?.token ?? '', // Fallback to an empty string if no existing token
        },
      },
      update: {
        token, // Update with new token
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiration
      },
      create: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiration
      },
    });

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Email content and options
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'ยืนยันอีเมลของคุณอีกครั้ง',
      html: `
        <h3>สวัสดี,</h3>
        <p>โปรดคลิกลิงก์ด้านล่างเพื่อยืนยันอีเมลของคุณ:</p>
        <a href="${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}">ยืนยันอีเมล</a>
        <p>ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง</p>
      `,
    };

    // Send the email using Nodemailer
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      message: 'ส่งอีเมลยืนยันใหม่แล้ว กรุณาตรวจสอบอีเมลของคุณ',
    });
  } catch (error) {
    // Log any unexpected errors for debugging
    console.error('Error during resending email:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการส่งอีเมลยืนยันใหม่' },
      { status: 500 }
    );
  }
}
