import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/authOptions';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    // ดึงรายการสินค้าที่อยู่ใน favorites ของผู้ใช้
    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
      },
      include: {
        product: true, // ดึงข้อมูลสินค้าที่เกี่ยวข้อง
      },
    });

    const favoriteProducts = favorites.map(favorite => favorite.product);

    return NextResponse.json(favoriteProducts); // ส่งคืนข้อมูลสินค้าใน favorites
  } catch (error) {
    console.error('Failed to fetch favorite products:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
