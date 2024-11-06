import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, OrderStatus } from '@prisma/client';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-09-30.acacia' });
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
  }

  // Parse event data directly from request body (no signature verification)
  const event = await req.json() as Stripe.Event;

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'charge.updated':
      await handleChargeUpdated(event.data.object as Stripe.Charge);
      break;
    default:
      console.warn(`Unhandled event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const addressId = session.metadata?.addressId;
  const promotionCodeId = session.metadata?.promotionCodeId;
  const paymentIntentId = session.payment_intent as string;

  if (!userId || !paymentIntentId) {
    console.error('User ID or payment intent ID is missing in session metadata.');
    return;
  }

  try {
    // Find the order by stripeSessionId (i.e., stripePaymentId)
    const order = await prisma.order.findFirst({
      where: { stripePaymentId: session.id },
    });

    if (!order) {
      console.warn(`No matching order found for stripe session ID: ${session.id}`);
      return;
    }

    // Now update the order by using the unique `id` of the order
    await prisma.order.update({
      where: { id: order.id },
      data: {
        isPaid: true,
        status: OrderStatus.PENDING, // Assuming this is the initial status
        paymentStatus: 'paid',
      },
    });

    console.log(`Order updated successfully for user ${userId} with paymentIntentId ${paymentIntentId}`);
  } catch (error) {
    console.error(`Error processing checkout session: ${error instanceof Error ? error.message : error}`);
  }
}

async function handleChargeUpdated(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;

  if (!paymentIntentId) {
    console.warn('No payment intent ID found in charge event.');
    return;
  }

  try {
    // Retrieve the checkout session ID using the payment intent ID
    const session = await stripe.checkout.sessions.list({
      payment_intent: paymentIntentId,
    });

    if (!session.data[0]) {
      console.warn(`No matching session found for payment intent ID: ${paymentIntentId}`);
      return;
    }

    const stripeSessionId = session.data[0].id;

    // Find the order by stripeSessionId
    const order = await prisma.order.findFirst({
      where: { stripePaymentId: stripeSessionId },
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PENDING, // Assuming PAID is a valid status
          paymentStatus: charge.status,
        },
      });
      console.log(`Order ${order.id} updated to status PAID.`);
    } else {
      console.warn(`No matching order found for stripe session ID: ${stripeSessionId}`);
    }
  } catch (error) {
    console.error(`Error updating order for charge event: ${error instanceof Error ? error.message : error}`);
  }
}
