import { PrismaClient } from "@prisma/client";

// One client per server instance — also in production, so warm serverless
// invocations and separate route bundles reuse the same connection pool.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

globalForPrisma.prisma = db;
