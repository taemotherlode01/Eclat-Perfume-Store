import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '../../util/isAdmin'; // นำเข้า isAdmin จากไฟล์ที่แยกไว้

const prisma = new PrismaClient();

// GET: ดึงข้อมูล Ingredient ทั้งหมดหรือค้นหาตามชื่อ
export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const nameQuery = searchParams.get('name');

    let ingredients;

    if (nameQuery) {
      ingredients = await prisma.ingredient.findMany({
        where: {
          name: {
            contains: nameQuery,
          },
        },
        include: {
          products: true,
        },
      });
    } else {
      ingredients = await prisma.ingredient.findMany({
        include: {
          products: true,
        },
      });
    }

    return NextResponse.json(ingredients, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch ingredients:', error);
    return NextResponse.json({ error: 'Failed to fetch ingredients.' }, { status: 500 });
  }
};

// POST: เพิ่ม Ingredient ใหม่ (เฉพาะผู้ใช้ที่เป็น Admin)
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

    const newIngredient = await prisma.ingredient.create({
      data: { name },
    });

    return NextResponse.json(newIngredient, { status: 201 });
  } catch (error) {
    console.error('Failed to create ingredient:', error);
    return NextResponse.json({ error: 'Failed to create ingredient.' }, { status: 500 });
  }
};

// PUT: แก้ไข Ingredient ตาม ID (เฉพาะผู้ใช้ที่เป็น Admin)
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

    const updatedIngredient = await prisma.ingredient.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(updatedIngredient, { status: 200 });
  } catch (error) {
    console.error('Failed to update ingredient:', error);
    return NextResponse.json({ error: 'Failed to update ingredient.' }, { status: 500 });
  }
};

// DELETE: ลบ Ingredient ตาม ID (เฉพาะผู้ใช้ที่เป็น Admin)
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

    const deletedIngredient = await prisma.ingredient.delete({
      where: { id },
    });

    return NextResponse.json(deletedIngredient, { status: 200 });
  } catch (error) {
    console.error('Failed to delete ingredient:', error);
    return NextResponse.json({ error: 'Failed to delete ingredient.' }, { status: 500 });
  }
};
