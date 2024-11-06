import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const MyPrismaClient = globalForPrisma.prisma ?? prismaClientSingleton();

export default MyPrismaClient;

if (process.env.NODE_ENV !== "production")
  globalForPrisma.prisma = MyPrismaClient;