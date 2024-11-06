import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const POST = async (req: NextRequest) => {
   try {
      const { code, userId } = await req.json();

      // Ensure promotion code and user ID are provided
      if (!code || !userId) {
         return NextResponse.json({ error: 'Promotion code and user ID are required.' }, { status: 400 });
      }

      // Find the promotion code in the database
      const promotion = await prisma.promotionCode.findUnique({
         where: { code },
      });

      // If no promotion is found, return an error
      if (!promotion) {
         return NextResponse.json({ error: 'Invalid promotion code.' }, { status: 404 });
      }

      const currentTime = new Date();

      // Check if the promotion code is active
      if (currentTime < promotion.startDate) {
         return NextResponse.json({ error: 'Promotion code is not yet valid.' }, { status: 400 });
      } else if (currentTime > promotion.endDate) {
         return NextResponse.json({ error: 'Promotion code has expired.' }, { status: 400 });
      }

      // Check if the user has already used this promotion code
      const existingUsage = await prisma.promotionUsage.findUnique({
         where: {
            promotionCodeId_userId: {
               promotionCodeId: promotion.id,
               userId: userId,
            },
         },
      });

      if (existingUsage) {
         return NextResponse.json({ message: 'Promotion code has already been used by this user.', used: true });
      }

      // If the code has not been used, return this information
      return NextResponse.json({
         message: 'Promotion code has not been used by this user.',
         used: false,
      });
   } catch (error) {
      console.error('Failed to check promotion code usage:', error);
      return NextResponse.json({ error: 'Failed to check promotion code usage.' }, { status: 500 });
   }
};
