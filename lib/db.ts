import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Prisma 7 uses driver adapters. SQLite for local dev — swap this adapter
// (and the schema provider) for Postgres to deploy.
const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

// Reuse a single PrismaClient across hot reloads in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
