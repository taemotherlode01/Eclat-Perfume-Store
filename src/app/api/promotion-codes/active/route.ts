import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET = async (req: NextRequest) => {
  try {
    // Retrieve only active promotion codes
    const activePromotionCodes = await prisma.promotionCode.findMany({
      where: {
        status: 'ACTIVE',
      },
    });

    return NextResponse.json(activePromotionCodes, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch active promotion codes:', error);
    return NextResponse.json({ error: 'Failed to fetch promotion codes.' }, { status: 500 });
  }
};
