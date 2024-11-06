import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '../../../util/isAdmin';

const prisma = new PrismaClient();

// ... (GET and PATCH methods remain unchanged)

// DELETE: Batch remove orders by IDs
export const DELETE = async (req: NextRequest) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const { ids } = await req.json();
    
    // Validate input
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Order IDs are required.' }, { status: 400 });
    }

    const deletedOrders = await prisma.order.deleteMany({
      where: {
        id: {
          in: ids, // Delete all orders where ID is in the array
        },
      },
    });

    return NextResponse.json({ deletedCount: deletedOrders.count }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete orders:', error);
    return NextResponse.json({ error: 'Failed to delete orders.' }, { status: 500 });
  }
};

// ... (Any other methods like PATCH, GET remain unchanged)
