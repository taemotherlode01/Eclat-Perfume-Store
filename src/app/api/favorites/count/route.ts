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
    // นับจำนวนสินค้าที่ถูกกดหัวใจโดย user นี้
    const favoriteCount = await prisma.favorite.count({
      where: {
        userId,
      },
    });

    return NextResponse.json({ favoriteCount });
  } catch (error) {
    console.error('Failed to get favorite count:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
