import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/authOptions';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  // ตรวจสอบ session ของผู้ใช้
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string }).role;

  // ตรวจสอบสิทธิ์การเข้าถึง
  if (!session || userRole !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // นับจำนวนสินค้า
    const productsCount = await prisma.product.count();
    // นับจำนวนคำสั่งซื้อ
    const ordersCount = await prisma.order.count();

    // คำนวณรายได้รวม
    const totalRevenue = await prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        paymentStatus: 'succeeded',
      },
    });

    // นับจำนวนผู้ใช้ที่เป็นลูกค้า
    const customersCount = await prisma.user.count({
      where: { role: 'USER' },
    });

    // คำนวณรายได้ประจำวัน
    const dailyRevenue = await prisma.order.groupBy({
      by: ['createdAt'],
      _sum: { totalAmount: true },
      orderBy: { createdAt: 'desc' },
      where: { paymentStatus: 'succeeded' },
    });

    // นับจำนวนคำสั่งซื้อประจำวัน
    const dailyOrders = await prisma.order.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    // จัดกลุ่มผลลัพธ์ตามวัน
    const revenueByDay = dailyRevenue.reduce((acc, curr) => {
      const date = curr.createdAt.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = 0;
      acc[date] += (curr._sum.totalAmount?.toNumber() || 0); // แปลง Decimal เป็นตัวเลข
      return acc;
    }, {} as Record<string, number>);

    const ordersByDay = dailyOrders.reduce((acc, curr) => {
      const date = curr.createdAt.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = 0;
      acc[date] += curr._count.id || 0;
      return acc;
    }, {} as Record<string, number>);

    // แปลงข้อมูลเป็น array เพื่อใช้ใน chart
    const dailyRevenueArray = Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue }));
    const dailyOrdersArray = Object.entries(ordersByDay).map(([date, orders]) => ({ date, orders }));

    // ส่งข้อมูลไปยัง client
    return NextResponse.json({
      productsCount,
      ordersCount,
      totalRevenue: totalRevenue._sum.totalAmount?.toNumber() || 0, // แปลง Decimal เป็นตัวเลข
      customersCount,
      dailyRevenue: dailyRevenueArray,
      dailyOrders: dailyOrdersArray,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
