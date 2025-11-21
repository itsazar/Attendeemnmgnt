/* eslint-disable @typescript-eslint/no-require-imports */

// CRITICAL: Set engine type BEFORE any Prisma imports
// This must happen at the very top of the file, before require()
const engineTypeEnv = process.env.PRISMA_CLIENT_ENGINE_TYPE?.toLowerCase();
const prismaEngineType = engineTypeEnv === "library" ? "library" : "binary";
process.env.PRISMA_CLIENT_ENGINE_TYPE = prismaEngineType;

type PrismaClientConstructor = typeof import("@prisma/client").PrismaClient;
const { PrismaClient }: { PrismaClient: PrismaClientConstructor } = require("@prisma/client");
type PrismaClientInstance = InstanceType<PrismaClientConstructor>;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientInstance };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

