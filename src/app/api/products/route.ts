import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Gender } from '@prisma/client';
import { isAdmin } from '../../util/isAdmin';

const prisma = new PrismaClient();

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    const titleQuery = searchParams.get('searchQuery') || '';
    const formulaId = searchParams.get('formulaId') || '';
    const fragranceFamilyId = searchParams.get('fragranceFamilyId') || '';
    const ingredientId = searchParams.get('ingredientId') || '';
    const productTypeId = searchParams.get('productTypeId') || '';
    const gender = searchParams.get('gender') || ''; // ใช้ค่าเป็น string

    const products = await prisma.product.findMany({
      where: {
        title: {
          contains: titleQuery,
        },
        ...(formulaId && { formulaId: Number(formulaId) }),
        ...(fragranceFamilyId && { fragranceFamilyId: Number(fragranceFamilyId) }),
        ...(ingredientId && { ingredientId: Number(ingredientId) }),
        ...(productTypeId && { productTypeId: Number(productTypeId) }),
        ...(gender && { gender: gender as Gender }), // แปลงเป็น Gender enum
      },
      include: {
        fragranceFamily: true,
        productType: true,
        formula: true,
        ingredient: true,
        Inventory: true,
      },
    });

    const productsWithImages = products.map(product => ({
      ...product,
      images: product.image ? product.image.split(',') : [],
    }));

    return NextResponse.json(productsWithImages, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ error: 'Failed to fetch products.' }, { status: 500 });
  }
};


// POST: Add new Product (Admin only)
export const POST = async (req: NextRequest) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const { title, description, howToUse, images, isNew, gender, fragranceFamilyId, productTypeId, formulaId, ingredientId } = await req.json();

    // Validate gender
    if (!Object.values(Gender).includes(gender)) {
      return NextResponse.json({ error: `Invalid value for gender: ${gender}` }, { status: 400 });
    }

    // Validate images
    if (!Array.isArray(images) || images.some(image => typeof image !== 'string')) {
      return NextResponse.json({ error: 'Invalid value for images. Must be an array of strings.' }, { status: 400 });
    }

    // Combine image URLs into a string
    const imageString = images.join(',');

    // Check required fields
    if (!title || !description || !howToUse || images.length === 0 || !gender || !fragranceFamilyId || !productTypeId || !formulaId || !ingredientId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        title,
        description,
        howToUse,
        image: imageString,
        isNew,
        gender,
        fragranceFamilyId,
        productTypeId,
        formulaId,
        ingredientId,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ error: 'Failed to create product.' }, { status: 500 });
  }
};

// PUT: Update Product by ID (Admin only)
export const PUT = async (req: NextRequest) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const { id, title, description, howToUse, images, isNew, gender, fragranceFamilyId, productTypeId, formulaId, ingredientId } = await req.json();

    // Validate gender
    if (!Object.values(Gender).includes(gender)) {
      return NextResponse.json({ error: `Invalid value for gender: ${gender}` }, { status: 400 });
    }

    // Validate images
    if (!Array.isArray(images) || images.some(image => typeof image !== 'string')) {
      return NextResponse.json({ error: 'Invalid value for images. Must be an array of strings.' }, { status: 400 });
    }

    // Combine image URLs into a string
    const imageString = images.join(',');

    // Check required fields
    if (!id || !title || !description || !howToUse || images.length === 0 || !gender || !fragranceFamilyId || !productTypeId || !formulaId || !ingredientId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title,
        description,
        howToUse,
        image: imageString,
        isNew,
        gender,
        fragranceFamilyId,
        productTypeId,
        formulaId,
        ingredientId,
      },
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error('Failed to update product:', error);
    return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
  }
};

// DELETE: Remove Product by ID (Admin only)
export const DELETE = async (req: NextRequest) => {
  const isAdminUser = await isAdmin(req);
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id.' }, { status: 400 });
    }

    const deletedProduct = await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json(deletedProduct, { status: 200 });
  } catch (error) {
    console.error('Failed to delete product:', error);
    return NextResponse.json({ error: 'Failed to delete product.' }, { status: 500 });
  }
};
