// /api/cart/count.ts
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
    const cartItemCount = await prisma.cart.count({
      where: { userId },
    });

    return NextResponse.json({ count: cartItemCount });
  } catch (error) {
    console.error('Failed to retrieve cart item count:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
