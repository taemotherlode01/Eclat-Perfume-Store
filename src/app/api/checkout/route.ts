import { NextRequest, NextResponse } from 'next/server'; 
import { PrismaClient, OrderStatus } from '@prisma/client';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-09-30.acacia' });
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { cartItems, addressId, selectedItems, promotionCode, userId, amountToPay } = await req.json();

  if (!cartItems || !addressId || !Array.isArray(selectedItems) || selectedItems.length === 0 || !userId || !amountToPay) {
    return NextResponse.json({ message: 'Invalid request data' }, { status: 400 });
  }

  try {
    const items = await prisma.cart.findMany({
      where: { userId, id: { in: selectedItems } },
      include: { inventory: true, product: true },
    });

    if (items.length === 0) {
      return NextResponse.json({ message: 'Cart items not found' }, { status: 404 });
    }

    let discountPercentage = 0;
    let promotionCodeId = null;
    if (promotionCode) {
      const promotion = await prisma.promotionCode.findUnique({
        where: { code: promotionCode },
      });

      if (promotion && promotion.status === 'ACTIVE') {
        discountPercentage = parseFloat(promotion.discountPercentage.toString());
        promotionCodeId = promotion.id;

        try {
          await prisma.promotionUsage.create({
            data: {
              promotionCodeId: promotion.id,
              userId,
            },
          });
        } catch (usageError) {
          console.error('Error recording promotion usage:', usageError);
        }
      }
    }

    const lineItems = items.map((item) => {
      const unitAmount = Math.round(parseFloat(item.inventory.price.toString()) * 100);
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

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      metadata: {
        userId,
        addressId: addressId.toString(),
        promotionCodeId: promotionCodeId ? promotionCodeId.toString() : '',
      },
    });

    const order = await prisma.order.create({
      data: {
        userId,
        addressId,
        stripePaymentId: stripeSession.id,
        isPaid: false,
        status: OrderStatus.PENDING,
        promotionCodeId: promotionCodeId || null,
        totalAmount: parseFloat(amountToPay),
      },
    });

    const orderItemsData = items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: parseFloat(item.inventory.price.toString()),
      inventoryId: item.inventoryId,
    }));

    await prisma.orderItem.createMany({ data: orderItemsData });

    for (const item of items) {
      await prisma.inventory.update({
        where: { id: item.inventoryId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // **Remove purchased items from cart**
    await prisma.cart.deleteMany({
      where: {
        userId,
        id: { in: selectedItems },
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error('Error during checkout process:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
