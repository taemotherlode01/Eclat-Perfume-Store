import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '../../util/isAdmin'; // นำเข้า isAdmin จากไฟล์ที่แยกไว้

const prisma = new PrismaClient();

// GET: ดึงข้อมูล Inventory ตาม productId หรือดึงทั้งหมด (ทุกคนสามารถเข้าถึงได้)
export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    let inventories;

    if (productId) {
      inventories = await prisma.inventory.findMany({
        where: {
          productId: parseInt(productId),
        },
      });
    } else {
      inventories = await prisma.inventory.findMany();
    }

    return NextResponse.json(inventories, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch inventories:', error);
    return NextResponse.json({ error: 'Failed to fetch inventories.' }, { status: 500 });
  }
};

// POST: เพิ่ม Inventory ใหม่ (เฉพาะ Admin)
export const POST = async (req: NextRequest) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const { productId, size, price, stock } = await req.json();

    if (!productId || !size || !price || stock == null) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const newInventory = await prisma.inventory.create({
      data: {
        productId,
        size,
        price,
        stock,
      },
    });

    return NextResponse.json(newInventory, { status: 201 });
  } catch (error) {
    console.error('Failed to create inventory:', error);
    return NextResponse.json({ error: 'Failed to create inventory.' }, { status: 500 });
  }
};

// PUT: แก้ไข Inventory ตาม ID (เฉพาะ Admin)
export const PUT = async (req: NextRequest) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const { id, size, price, stock } = await req.json();

    if (!id || !size || !price || stock == null) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const updatedInventory = await prisma.inventory.update({
      where: { id },
      data: {
        size,
        price,
        stock,
      },
    });

    return NextResponse.json(updatedInventory, { status: 200 });
  } catch (error) {
    console.error('Failed to update inventory:', error);
    return NextResponse.json({ error: 'Failed to update inventory.' }, { status: 500 });
  }
};

// DELETE: ลบ Inventory ตาม ID (เฉพาะ Admin)
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

    const deletedInventory = await prisma.inventory.delete({
      where: { id },
    });

    return NextResponse.json(deletedInventory, { status: 200 });
  } catch (error) {
    console.error('Failed to delete inventory:', error);
    return NextResponse.json({ error: 'Failed to delete inventory.' }, { status: 500 });
  }
};
