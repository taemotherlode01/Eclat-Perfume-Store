import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
  

    const { token, email, newPassword } = body;

    if (!token || !email || !newPassword) {
      console.log('Missing required fields:', { token, email, newPassword });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Validate the token and expiration
   if (!user || !user.resetPasswordToken || user.resetPasswordToken !== token || !user.resetPasswordExpires || new Date() > new Date(user.resetPasswordExpires)) {
  console.log('Invalid token or token expired:', {
    userExists: !!user,
    resetPasswordToken: user?.resetPasswordToken,
    tokenMatches: user?.resetPasswordToken === token,
    isExpired: user?.resetPasswordExpires ? new Date() > new Date(user.resetPasswordExpires) : true,
  });
  return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
}

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and clear the reset token and expiration date
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetPasswordToken: null, // Clear the reset token
        resetPasswordExpires: null, // Clear the expiration
      },
    });

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const GET = () => {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
};
