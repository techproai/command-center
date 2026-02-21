import { PrismaClient, type Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const queryLogsEnabled =
  process.env.PRISMA_LOG_QUERIES?.toLowerCase() === "true" ||
  process.env.PRISMA_LOG_QUERIES === "1";

const logLevels: Prisma.LogLevel[] = queryLogsEnabled ? ["query", "warn", "error"] : ["error"];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logLevels,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

