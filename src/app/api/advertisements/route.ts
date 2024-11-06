import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '../../util/isAdmin'; // ตรวจสอบสิทธิ์ Admin

const prisma = new PrismaClient();

// GET: ดึงข้อมูล Advertisement ทั้งหมด
export const GET = async (req: NextRequest) => {
  try {
    const ads = await prisma.advertisement.findMany();
    return NextResponse.json(ads, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch advertisements:', error);
    return NextResponse.json({ error: 'Failed to fetch advertisements.' }, { status: 500 });
  }
};

// POST: เพิ่ม Advertisement ใหม่ (เฉพาะผู้ใช้ที่เป็น Admin)
export const POST = async (req: NextRequest) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const { description } = await req.json();
    if (!description) {
      return NextResponse.json({ error: 'Missing required fields: description.' }, { status: 400 });
    }

    const newAd = await prisma.advertisement.create({
      data: { description },
    });

    return NextResponse.json(newAd, { status: 201 });
  } catch (error) {
    console.error('Failed to create advertisement:', error);
    return NextResponse.json({ error: 'Failed to create advertisement.' }, { status: 500 });
  }
};

// PUT: แก้ไขข้อมูล Advertisement ตาม ID (เฉพาะผู้ใช้ที่เป็น Admin)
export const PUT = async (req: NextRequest) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const { id , description } = await req.json();
    if (!id || !description) {
      return NextResponse.json({ error: 'Missing required fields: id , or description.' }, { status: 400 });
    }

    const updatedAd = await prisma.advertisement.update({
      where: { id },
      data: { description },
    });

    return NextResponse.json(updatedAd, { status: 200 });
  } catch (error) {
    console.error('Failed to update advertisement:', error);
    return NextResponse.json({ error: 'Failed to update advertisement.' }, { status: 500 });
  }
};

// DELETE: ลบ Advertisement ตาม ID (เฉพาะผู้ใช้ที่เป็น Admin)
export const DELETE = async (req: NextRequest) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id.' }, { status: 400 });
    }

    const deletedAd = await prisma.advertisement.delete({
      where: { id },
    });

    return NextResponse.json(deletedAd, { status: 200 });
  } catch (error) {
    console.error('Failed to delete advertisement:', error);
    return NextResponse.json({ error: 'Failed to delete advertisement.' }, { status: 500 });
  }
};
