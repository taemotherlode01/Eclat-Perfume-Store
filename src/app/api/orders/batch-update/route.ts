import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { isAdmin } from '../../../util/isAdmin';

const prisma = new PrismaClient();

// GET: Fetch orders with optional filters
export const GET = async (req: NextRequest) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';
    const status = searchParams.get('status') || '';

    const orders = await prisma.order.findMany({
      where: {
        ...(orderId && { id: Number(orderId) }),
        ...(paymentStatus && { paymentStatus }), // Example of payment status filter
        ...(status && { status: status as OrderStatus }),
      },
      include: {
        user: true,
        orderItems: {
          include: {
            product: true,
            inventory: true,
          },
        },
      },
    });

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders.' }, { status: 500 });
  }
};

// PATCH: Batch update order statuses
export const PATCH = async (req: NextRequest) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const { ids, status } = await req.json();
    console.log('Received PATCH request with:', { ids, status }); // Log incoming data

    // Validate the input
    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      console.error('Validation error: Missing IDs or status');
      return NextResponse.json({ error: 'Order IDs and status are required.' }, { status: 400 });
    }

    // Ensure the status is valid
    const validStatuses = ['PENDING', 'SHIPPED', 'TRANSIT', 'DELIVERED'];
    if (!validStatuses.includes(status)) {
      console.error('Validation error: Invalid status');
      return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 });
    }

    const updatedOrders = await Promise.all(
      ids.map(async (id) => {
        return prisma.order.update({
          where: { id },
          data: { status },
          include: {
            user: true,
            orderItems: {
              include: {
                product: true,
                inventory: true,
              },
            },
          },
        });
      })
    );

    console.log('Orders updated successfully:', updatedOrders); // Log updated orders
    return NextResponse.json(updatedOrders, { status: 200 });
  } catch (error) {
    console.error('Failed to update order statuses:', error);
    return NextResponse.json({ error: 'Failed to update order statuses.' }, { status: 500 });
  }
};

