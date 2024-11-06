import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/authOptions';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { productId }: { productId?: string | number } = await req.json();
  const parsedProductId: number | undefined = typeof productId === 'string' ? parseInt(productId, 10) : productId;

  if (!parsedProductId) {
    return NextResponse.json({ message: 'Product ID is required and must be a valid number' }, { status: 400 });
  }

  try {
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        productId_userId: {
          productId: parsedProductId,
          userId,
        },
      },
    });

    if (existingFavorite) {
      return NextResponse.json({ message: 'Product is already in favorites' }, { status: 400 });
    }

    const newFavorite = await prisma.favorite.create({
      data: {
        productId: parsedProductId,
        userId,
      },
    });

    return NextResponse.json({ message: 'Product added to favorites', favorite: newFavorite });
  } catch (error) {
    console.error('Failed to handle adding to favorites:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { productId }: { productId?: string | number } = await req.json();
  const parsedProductId: number | undefined = typeof productId === 'string' ? parseInt(productId, 10) : productId;

  if (!parsedProductId) {
    return NextResponse.json({ message: 'Product ID is required and must be a valid number' }, { status: 400 });
  }

  try {
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        productId_userId: {
          productId: parsedProductId,
          userId,
        },
      },
    });

    if (!existingFavorite) {
      return NextResponse.json({ message: 'Product not found in favorites' }, { status: 404 });
    }

    await prisma.favorite.delete({
      where: {
        productId_userId: {
          productId: parsedProductId,
          userId,
        },
      },
    });

    return NextResponse.json({ message: 'Product removed from favorites' });
  } catch (error) {
    console.error('Failed to handle removing from favorites:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
