// isAdmin.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';
import { authOptions } from '../api/auth/authOptions';

export async function isAdmin(req: NextRequest) {
  const session = await getServerSession({ req, ...authOptions });
    
  if (!session || !(session.user as { role?: string }).role || (session.user as { role?: string }).role !== 'ADMIN') {
    return false;
  }
  return true;
}
