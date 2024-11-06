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
  const { productId, inventoryId, quantity = 1 }: { productId?: number; inventoryId?: number; quantity?: number } = await req.json();

  if (!productId || !inventoryId) {
    return NextResponse.json({ message: 'Product ID and Inventory ID are required' }, { status: 400 });
  }

  try {
    // ตรวจสอบว่า inventoryId มีอยู่แล้วในตะกร้าของผู้ใช้งานหรือไม่
    const existingItem = await prisma.cart.findFirst({
      where: {
        userId,
        inventoryId,
      },
    });

    // Fetch the inventory details to check stock availability
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
    });

    if (!inventory) {
      return NextResponse.json({ message: 'Inventory not found' }, { status: 404 });
    }

    if (existingItem) {
      // หากสินค้ามีอยู่ในตะกร้าแล้ว เพิ่มจำนวนสินค้า
      if (existingItem.quantity + quantity > inventory.stock) {
        return NextResponse.json({ message: 'Not enough stock available' }, { status: 400 });
      }

      const updatedItem = await prisma.cart.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
      return NextResponse.json({ message: 'Product quantity updated in cart', cartItem: updatedItem });
    }

    // หาก inventoryId ยังไม่อยู่ในตะกร้า ให้ทำการเพิ่มสินค้า
    if (quantity > inventory.stock) {
      return NextResponse.json({ message: 'Not enough stock available' }, { status: 400 });
    }

    const cartItem = await prisma.cart.create({
      data: {
        productId,
        inventoryId,
        userId,
        quantity,
      },
      include: {
        product: true,
        inventory: true,
      },
    });
    const isNewItem = !existingItem; // If `existingItem` is null, it's a new item

    return NextResponse.json({ message: 'Product added to cart', cartItem ,newItem: isNewItem});
  } catch (error) {
    console.error('Failed to add to cart:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const cartItems = await prisma.cart.findMany({
      where: { userId },
      include: {
        product: true,
        inventory: true,
      },
    });

    return NextResponse.json({ cartItems });
  } catch (error) {
    console.error('Failed to retrieve cart items:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { inventoryId, quantity }: { inventoryId?: number; quantity?: number } = await req.json();

  if (!inventoryId || quantity === undefined) {
    return NextResponse.json({ message: 'Inventory ID and quantity are required' }, { status: 400 });
  }

  try {
    const existingItem = await prisma.cart.findFirst({
      where: { userId, inventoryId },
    });

    if (!existingItem) {
      return NextResponse.json({ message: 'Item not found in cart' }, { status: 404 });
    }

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
    });

    if (!inventory) {
      return NextResponse.json({ message: 'Inventory not found' }, { status: 404 });
    }

    if (quantity > inventory.stock) {
      return NextResponse.json({ message: 'Not enough stock available' }, { status: 400 });
    }

    const updatedItem = await prisma.cart.update({
      where: { id: existingItem.id },
      data: { quantity },
    });

    return NextResponse.json({ message: 'Product quantity updated', cartItem: updatedItem });
  } catch (error) {
    console.error('Failed to update cart item quantity:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { inventoryId }: { inventoryId?: number } = await req.json();

  if (!inventoryId) {
    return NextResponse.json({ message: 'Inventory ID is required' }, { status: 400 });
  }

  try {
    const cartItem = await prisma.cart.deleteMany({
      where: {
        userId,
        inventoryId,
      },
    });

    if (cartItem.count === 0) {
      return NextResponse.json({ message: 'Item not found in cart' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product removed from cart' });
  } catch (error) {
    console.error('Failed to remove from cart:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
