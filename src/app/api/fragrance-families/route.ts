import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '../../util/isAdmin'; // นำเข้า isAdmin จากไฟล์ที่แยกไว้ (ยังคงไว้สำหรับ POST, PUT, DELETE)

const prisma = new PrismaClient();

// GET: ดึงข้อมูล FragranceFamily ทั้งหมด หรือค้นหาตามชื่อ (ทุกคนสามารถเข้าถึงได้)
export const GET = async (req: NextRequest) => {
  try {
    // ดึง query parameter จาก URL
    const { searchParams } = new URL(req.url);
    const nameQuery = searchParams.get('name'); // ดึงค่า name จาก query

    let fragranceFamilies;

    // ตรวจสอบว่า query parameter 'name' มีการส่งค่ามาหรือไม่
    if (nameQuery) {
      // ใช้ฟังก์ชัน prisma.$queryRaw เพื่อทำการค้นหาแบบ case-insensitive
      fragranceFamilies = await prisma.fragranceFamily.findMany({
        where: {
          name: {
            contains: nameQuery,
            // ใช้ case insensitive ด้วยวิธีการแปลงค่าเป็น lowercase ทั้งสองด้านของการเปรียบเทียบ
          },
        },
        include: {
          products: true, // หากต้องการรวมข้อมูล product ที่เกี่ยวข้อง
        },
      });
    } else {
      // ดึงข้อมูลทั้งหมด
      fragranceFamilies = await prisma.fragranceFamily.findMany({
        include: {
          products: true, // หากต้องการรวมข้อมูล product ที่เกี่ยวข้อง
        },
      });
    }

    return NextResponse.json(fragranceFamilies, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch fragrance families.' }, { status: 500 });
  }
};

// POST: เพิ่ม FragranceFamily ใหม่ (เฉพาะผู้ใช้ที่เป็น Admin)
export const POST = async (req: NextRequest) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Missing required field: name.' }, { status: 400 });
    }

    const newFragranceFamily = await prisma.fragranceFamily.create({
      data: {
        name,
      },
    });

    return NextResponse.json(newFragranceFamily, { status: 201 });
  } catch (error) {
    console.error('Failed to create fragrance family:', error);
    return NextResponse.json({ error: 'Failed to create fragrance family.' }, { status: 500 });
  }
};

// PUT: แก้ไขข้อมูล FragranceFamily ตาม ID (เฉพาะผู้ใช้ที่เป็น Admin)
export const PUT = async (req: NextRequest) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const { id, name } = await req.json();

    if (!id || !name) {
      return NextResponse.json({ error: 'Missing required fields: id or name.' }, { status: 400 });
    }

    const updatedFragranceFamily = await prisma.fragranceFamily.update({
      where: { id },
      data: {
        name,
      },
    });
    return NextResponse.json(updatedFragranceFamily, { status: 200 });
  } catch (error) {
    console.error('Failed to update fragrance family:', error);
    return NextResponse.json({ error: 'Failed to update fragrance family.' }, { status: 500 });
  }
};

// DELETE: ลบ FragranceFamily ตาม ID (เฉพาะผู้ใช้ที่เป็น Admin)
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

    const deletedFragranceFamily = await prisma.fragranceFamily.delete({
      where: { id },
    });
    return NextResponse.json(deletedFragranceFamily, { status: 200 });
  } catch (error) {
    console.error('Failed to delete fragrance family:', error);
    return NextResponse.json({ error: 'Failed to delete fragrance family.' }, { status: 500 });
  }
};
