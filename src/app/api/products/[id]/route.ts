import { NextRequest, NextResponse } from 'next/server';
import { Gender, PrismaClient } from '@prisma/client';
import { isAdmin } from '../../../util/isAdmin';

const prisma = new PrismaClient();

// GET: Fetch product details by ID, including inventory sorted by price
export const GET = async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { id } = params;

  try {
    // Check if the product ID is provided
    if (!id) {
      return NextResponse.json({ error: 'Missing product ID.' }, { status: 400 });
    }

    // Fetch product with inventories (sorted by price ascending)
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }, // Convert ID to number
      include: {
        fragranceFamily: true,
        productType: true,
        formula: true,
        ingredient: true,
        Inventory: {
          orderBy: { price: 'asc' }, // Sort inventory by price ascending
        },
      },
    });

    // Check if the product exists
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    // Transform the image field from string to array of URLs
    const productWithImages = {
      ...product,
      images: product.image ? product.image.split(',') : [], // Split the image string into an array
    };

    return NextResponse.json(productWithImages, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch product by ID:', error);
    return NextResponse.json({ error: 'Failed to fetch product.' }, { status: 500 });
  }
};

// PUT: แก้ไข Product ตาม ID (เฉพาะ Admin)
export const PUT = async (req: NextRequest, { params }: { params: { id: string } }) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const { id } = params;
    const {
      title,
      description,
      howToUse,
      images,
      isNew,
      gender,
      fragranceFamilyId,
      productTypeId,
      formulaId,
      ingredientId,
      inventories, // Accept inventories from the request body
    } = await req.json();

    // Debug: Log received inventory data
    console.log("Received inventories:", inventories);

    // ตรวจสอบว่า gender ที่ส่งมาเป็นค่าที่อยู่ใน enum Gender หรือไม่
    if (!Object.values(Gender).includes(gender)) {
      return NextResponse.json({ error: `Invalid value for gender: ${gender}` }, { status: 400 });
    }

    // ตรวจสอบว่า images เป็น array ของ string หรือไม่
    if (!Array.isArray(images) || images.some(image => typeof image !== 'string')) {
      return NextResponse.json({ error: 'Invalid value for images. Must be an array of strings.' }, { status: 400 });
    }

    // รวม URL ของภาพทั้งหมดใน array เป็น string เดียวคั่นด้วย ,
    const imageString = images.join(',');

    // ตรวจสอบว่ามีฟิลด์ที่จำเป็นครบถ้วนหรือไม่
    if (!id || !title || !description || !howToUse || images.length === 0 || !gender || !fragranceFamilyId || !productTypeId || !formulaId || !ingredientId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Update the product in the database
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        howToUse,
        image: imageString, // อัปเดตฟิลด์ image เป็น string เดียว
        isNew,
        gender,
        fragranceFamilyId,
        productTypeId,
        formulaId,
        ingredientId,
      },
    });

    // Handle inventories if provided
    if (Array.isArray(inventories)) {
      // Optional: Clear existing inventories for the product if needed
      await prisma.inventory.deleteMany({
        where: { productId: updatedProduct.id },
      });

      // Create new inventories without specifying the id
      const inventoryData = inventories.map(({ size, price, stock }) => ({
        size,
        price,
        stock,
        productId: updatedProduct.id, // Associate inventory with the updated product
      }));

      // Debug: Log the inventory data to be saved
      console.log("Inventory data to be saved:", inventoryData);

      const createdInventories = await prisma.inventory.createMany({
        data: inventoryData,
      });

      // Debug: Log the result of the inventory creation
      console.log("Created inventories:", createdInventories);
    }

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error('Failed to update product:', error);
    return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
  }
};

// DELETE: ลบ Product ตาม ID (เฉพาะ Admin)
export const DELETE = async (req: NextRequest, { params }: { params: { id: string } }) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id.' }, { status: 400 });
    }

    const deletedProduct = await prisma.product.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(deletedProduct, { status: 200 });
  } catch (error) {
    console.error('Failed to delete product:', error);
    return NextResponse.json({ error: 'Failed to delete product.' }, { status: 500 });
  }
};
