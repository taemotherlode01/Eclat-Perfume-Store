import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/authOptions';
import bcrypt from 'bcrypt';
import { isAdmin } from '../../../util/isAdmin';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(await isAdmin(req))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
  
    const { userId, name, email, password, role } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }
    
    try {
      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
  
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
  
      return NextResponse.json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
      console.error('Failed to update user:', error);
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
  }
  