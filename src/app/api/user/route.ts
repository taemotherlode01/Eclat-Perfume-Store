import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/authOptions';
import bcrypt from 'bcrypt';
import { isAdmin } from '../../util/isAdmin'; // นำเข้า isAdmin จากไฟล์ที่แยกไว้

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const userIdParam = searchParams.get('userId'); // ADMIN ต้องการดูข้อมูลของคนอื่น

  try {
    if (await isAdmin(req)) {
      // กรณีที่เป็น ADMIN และต้องการดูข้อมูลของคนอื่น
      if (userIdParam) {
        const user = await prisma.user.findUnique({
          where: { id: userIdParam },
          include: { accounts: true,Address: true }, // ดึงข้อมูลจาก Account model ด้วย
        });
        
        if (user) {
          const provider = user.accounts.length > 0 ? user.accounts[0].provider : 'credentials'; // ตรวจสอบ provider
          return NextResponse.json({ ...user, provider });
        } else {
          return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
      } else {
        // ถ้าไม่มี userIdParam ให้แสดงผู้ใช้ทั้งหมด
        const users = await prisma.user.findMany({ include: { accounts: true , Address: true} });
        const usersWithProvider = users.map((user) => ({
          ...user,
          provider: user.accounts.length > 0 ? user.accounts[0].provider : 'credentials',
        }));
        return NextResponse.json(usersWithProvider);
      }
    } else {
      // กรณีผู้ใช้ทั่วไป ให้ดึงข้อมูลของตนเอง
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { accounts: true, Address: true}, // ดึงข้อมูลจาก Account model ด้วย
      });

      if (user) {
        const provider = user.accounts.length > 0 ? user.accounts[0].provider : 'credentials'; // ตรวจสอบ provider
        return NextResponse.json({ ...user, provider });
      } else {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
    }
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { name, email, password, role } = await req.json();

  if (!name || !email || !password || !role) {
    return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    return NextResponse.json({ message: 'User added successfully', user: newUser });
  } catch (error) {
    console.error('Failed to add user:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string })?.id;
  const { userIdParam, name, email, currentPassword, newPassword, role } = await req.json();

  // ตรวจสอบเฉพาะ admin ถึงสามารถแก้ไข role ได้
  if (role && !(await isAdmin(req))) {
    return NextResponse.json({ message: 'Only admin can change user roles' }, { status: 403 });
  }

  // ถ้าไม่ใช่ admin ผู้ใช้ต้องแก้ไขได้เฉพาะข้อมูลของตัวเองเท่านั้น
  if (!userIdParam || userId !== userIdParam) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    // ตรวจสอบรหัสผ่านเก่า
    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user && user.password) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
        }
      } else {
        // If password is null, handle it as an error (e.g., for OAuth users who don't have a password)
        return NextResponse.json({ message: 'Password is not set for this user' }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        password: newPassword ? await bcrypt.hash(newPassword, 10) : undefined,
        role,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = await req.json(); // Ensure 'userId' is being destructured from the body

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
