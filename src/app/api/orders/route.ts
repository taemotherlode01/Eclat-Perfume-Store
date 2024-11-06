import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { isAdmin } from '../../util/isAdmin';

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
        address: true, // Include address details
      },
    });

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders.' }, { status: 500 });
  }
};

// PATCH: Update an order's status by ID
export const PATCH = async (req: NextRequest) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const { id, status } = await req.json();
    console.log('Received PATCH request with:', { id, status }); // Log incoming data

    // Validate the input
    if (!id || !status) {
      console.error('Validation error: Missing ID or status');
      return NextResponse.json({ error: 'Order ID and status are required.' }, { status: 400 });
    }

    // Ensure the status is valid
    const validStatuses = ['PENDING', 'SHIPPED', 'TRANSIT', 'DELIVERED'];
    if (!validStatuses.includes(status)) {
      console.error('Validation error: Invalid status');
      return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
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
        address: true, // Include address details in the updated order
      },
    });

    console.log('Order updated successfully:', updatedOrder); // Log updated order
    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error('Failed to update order status:', error);
    return NextResponse.json({ error: 'Failed to update order status.' }, { status: 500 });
  }
};

// DELETE: Remove an order by ID
export const DELETE = async (req: NextRequest) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const { ids } = await req.json(); // Expecting an array of IDs

    // Validate the input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No valid IDs provided.' }, { status: 400 });
    }

    // Perform deletion for each ID
    const deletedOrders = await Promise.all(
      ids.map(id => {
        return prisma.order.delete({
          where: { id },
          include: {
            user: true,
            orderItems: {
              include: {
                product: true,
                inventory: true,
              },
            },
            address: true,
          },
        });
      })
    );

    return NextResponse.json(deletedOrders, { status: 200 });
  } catch (error) {
    console.error('Failed to delete orders:', error);
    return NextResponse.json({ error: 'Failed to delete orders.' }, { status: 500 });
  }
};
