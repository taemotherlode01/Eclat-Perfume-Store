import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/authOptions';
import { isAdmin } from '../../util/isAdmin';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userIdParam = searchParams.get('userId'); // Admin สามารถดูที่อยู่ของคนอื่นได้

  try {
    if (await isAdmin(req)) {
      if (userIdParam) {
        // Admin ดูที่อยู่ของผู้ใช้คนอื่น
        const addresses = await prisma.address.findMany({
          where: { userId: userIdParam },
        });
        return NextResponse.json(addresses);
      } else {
        // Admin ดูที่อยู่ของทุกคน
        const addresses = await prisma.address.findMany();
        return NextResponse.json(addresses);
      }
    } else {
      // ผู้ใช้ธรรมดาดูที่อยู่ของตัวเองเท่านั้น
      const userId = (session.user as { id: string }).id;
      const addresses = await prisma.address.findMany({
        where: { userId },
      });
      return NextResponse.json(addresses);
    }
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // รับฟิลด์ใหม่ recipient, phoneNumber, และ isDefault
  const { recipient, phoneNumber, address, district, province, zipCode, country, isDefault } = await req.json();

  // ตรวจสอบให้แน่ใจว่าทุกฟิลด์จำเป็นถูกส่งมา
  if (!recipient || !phoneNumber || !address || !district || !province || !zipCode || !country) {
    return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
  }

  try {
    const userId = (session.user as { id: string }).id;

    // ถ้ากำลังตั้งที่อยู่นี้เป็นที่อยู่เริ่มต้น ต้องรีเซ็ตที่อยู่เริ่มต้นของผู้ใช้อื่นก่อน
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId,
        recipient,
        phoneNumber,
        address,
        district,
        province,
        zipCode,
        country,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json(newAddress);
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { addressId, recipient, phoneNumber, address, district, province, zipCode, country, isDefault } = await req.json();
  const userId = (session.user as { id: string }).id;

  try {
    const existingAddress = await prisma.address.findUnique({
      where: { id: addressId },
    });

    // ตรวจสอบว่า Address นี้เป็นของผู้ใช้คนนี้หรือไม่ (หรือเป็น Admin)
    if (existingAddress?.userId !== userId && !(await isAdmin(req))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // ถ้ากำลังตั้งที่อยู่นี้เป็นที่อยู่เริ่มต้น ต้องรีเซ็ตที่อยู่เริ่มต้นของผู้ใช้อื่นก่อน
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: {
        recipient,
        phoneNumber,
        address,
        district,
        province,
        zipCode,
        country,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json(updatedAddress);
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { addressId } = await req.json();
  const userId = (session.user as { id: string }).id;

  try {
    const existingAddress = await prisma.address.findUnique({
      where: { id: addressId },
    });

    // ตรวจสอบว่า Address นี้เป็นของผู้ใช้คนนี้หรือไม่ (หรือเป็น Admin)
    if (existingAddress?.userId !== userId && !(await isAdmin(req))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    return NextResponse.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
