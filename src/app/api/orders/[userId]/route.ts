import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/authOptions';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
    const session = await getServerSession(authOptions);

    // Check if the user is authenticated
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const loggedInUserId = (session.user as { id: string }).id;

    // Ensure the requested userId matches the logged-in user's id
    if (loggedInUserId !== params.userId) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        // Find orders for the user, sorted by creation date, and return only the latest one
        const orders = await prisma.order.findMany({
            where: { userId: loggedInUserId },
            include: {
                orderItems: {
                    include: {
                        product: true,
                        inventory: {
                            select: { size: true },
                        },
                    },
                },
                promotionCode: true,
            },
            orderBy: {
                createdAt: 'desc',  // Assumes you have a 'createdAt' field for sorting
            },
            take: 1,  // Limits the result to only the latest order
        });

        if (orders.length === 0) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        // Format the latest order for display
        const formattedOrder = {
            ...orders[0],
            totalAmount: orders[0].totalAmount.toNumber(),
            orderItems: orders[0].orderItems.map(item => ({
                ...item,
                price: item.price.toNumber(),
            })),
        };

        return NextResponse.json(formattedOrder);
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json({ message: 'Error fetching order' }, { status: 500 });
    }
}
