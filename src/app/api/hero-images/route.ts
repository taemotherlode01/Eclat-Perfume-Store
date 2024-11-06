import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '../../util/isAdmin';

const prisma = new PrismaClient();

// GET: ดึงข้อมูล HeroImage ทั้งหมด
export const GET = async (req: NextRequest) => {
    try {
        const heroImages = await prisma.heroImage.findMany();
        return NextResponse.json(heroImages, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch hero images:', error);
        return NextResponse.json({ error: 'Failed to fetch hero images.' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
};

// POST: เพิ่ม HeroImage (เฉพาะ Admin)
export const POST = async (req: NextRequest) => {
    const isAdminUser = await isAdmin(req);
    if (!isAdminUser) {
        return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
    }

    try {
        const { imageUrl, label, buttonText, buttonLink } = await req.json();

        if (!imageUrl || !label || !buttonText || !buttonLink) {
            return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
        }

        const newHeroImage = await prisma.heroImage.create({
            data: {
                imageUrl,
                label,
                buttonText,
                buttonLink,
            },
        });

        return NextResponse.json(newHeroImage, { status: 201 });
    } catch (error) {
        console.error('Failed to create hero image:', error);
        return NextResponse.json({ error: 'Failed to create hero image.' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
};

// PUT: แก้ไข HeroImage ตาม ID (เฉพาะ Admin)
export const PUT = async (req: NextRequest) => {
    const isAdminUser = await isAdmin(req);
    if (!isAdminUser) {
        return NextResponse.json({ error: 'Access denied: Admins only' }, { status: 403 });
    }

    try {
        const { id, imageUrl, label, buttonText, buttonLink } = await req.json();

        if (!id || !imageUrl || !label || !buttonText || !buttonLink) {
            return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
        }

        const updatedHeroImage = await prisma.heroImage.update({
            where: { id },
            data: {
                imageUrl,
                label,
                buttonText,
                buttonLink,
            },
        });

        return NextResponse.json(updatedHeroImage, { status: 200 });
    } catch (error) {
        console.error('Failed to update hero image:', error);
        return NextResponse.json({ error: 'Failed to update hero image.' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
};

// DELETE: ลบ HeroImage ตาม ID (เฉพาะ Admin)
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

        const deletedHeroImage = await prisma.heroImage.delete({
            where: { id },
        });

        return NextResponse.json(deletedHeroImage, { status: 200 });
    } catch (error) {
        console.error('Failed to delete hero image:', error);
        return NextResponse.json({ error: 'Failed to delete hero image.' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
};
