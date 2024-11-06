import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '../../../util/isAdmin'; // Import isAdmin function

const prisma = new PrismaClient();

export const GET = async (req: NextRequest) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const promotionUsage = await prisma.promotionUsage.findMany({
      include: {
        promotionCode: true, // Include related promotion code details if needed
        user: true, // Include related user details if needed
      },
    });

    return NextResponse.json(promotionUsage, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch promotion usage:', error);
    return NextResponse.json({ error: 'Failed to fetch promotion usage.' }, { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const { promotionCodeId, userId } = await req.json();

    if (!promotionCodeId || !userId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const newPromotionUsage = await prisma.promotionUsage.create({
      data: {
        promotionCodeId,
        userId,
        usedAt: new Date(), // Set the current time as the usage timestamp
      },
    });

    return NextResponse.json(newPromotionUsage, { status: 201 });
  } catch (error) {
    console.error('Failed to create promotion usage:', error);
    return NextResponse.json({ error: 'Failed to create promotion usage.' }, { status: 500 });
  }
};

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

    const deletedPromotionUsage = await prisma.promotionUsage.delete({
      where: { id },
    });

    return NextResponse.json(deletedPromotionUsage, { status: 200 });
  } catch (error) {
    console.error('Failed to delete promotion usage:', error);
    return NextResponse.json({ error: 'Failed to delete promotion usage.' }, { status: 500 });
  }
};
