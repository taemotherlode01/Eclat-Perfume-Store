import { NextRequest, NextResponse } from 'next/server'; 
import { PrismaClient, OrderStatus } from '@prisma/client';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-09-30.acacia' });
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { orderId, userId } = await req.json();

  if (!orderId || !userId) {
    return NextResponse.json({ message: 'Invalid request data' }, { status: 400 });
  }

  try {
    // Fetch the existing order and ensure it is unpaid
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        orderItems: { include: { product: true, inventory: true } },
        promotionCode: true,
      },
    });

    if (!order || order.isPaid || order.paymentStatus === 'succeeded') {
      return NextResponse.json({ message: 'Order is already paid or not found' }, { status: 400 });
    }

    // Calculate discount if promotion code is active
    let discountPercentage = 0;
    if (order.promotionCode && order.promotionCode.status === 'ACTIVE') {
      discountPercentage = parseFloat(order.promotionCode.discountPercentage.toString());
    }

    // Generate line items with discount applied if applicable
    const lineItems = order.orderItems.map((item) => {
      const unitAmount = Math.round(parseFloat(item.price.toString()) * 100);
      const discountedAmount = discountPercentage > 0 ? unitAmount * (1 - discountPercentage / 100) : unitAmount;

      return {
        price_data: {
          currency: 'thb',
          product_data: {
            name: item.product.title,
            images: [item.product.image.split(',')[0]],
          },
          unit_amount: Math.round(discountedAmount),
        },
        quantity: item.quantity,
      };
    });

    // Create Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders`,
      metadata: {
        userId,
        orderId: order.id.toString(),
      },
    });

    // Update the order with Stripe session details
    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripePaymentId: stripeSession.id,
        paymentStatus: 'pending', // Set status as pending until payment is completed
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error('Error during checkout-later process:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
