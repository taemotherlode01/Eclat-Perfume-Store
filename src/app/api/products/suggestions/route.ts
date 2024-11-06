import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';

    if (!query) {
      return NextResponse.json([], { status: 200 });
    }

    // Convert the query to lowercase
    const lowercaseQuery = query.toLowerCase();

    // Fetch products and convert titles to lowercase for comparison
    const suggestions = await prisma.product.findMany({
      where: {
        title: {
          contains: lowercaseQuery, // Search using the lowercase query
        },
      },
      select: {
        id: true,
        title: true,
      },
      take: 5, // Limit to top 5 suggestions
    });

    return NextResponse.json(suggestions, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions.' }, { status: 500 });
  }
};
