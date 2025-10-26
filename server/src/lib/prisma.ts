import { PrismaClient } from "@prisma/client";

// Adiciona o 'prisma' ao objeto global do Node.js
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Evita múltiplas instâncias do PrismaClient em desenvolvimento
export const prisma =
  global.prisma ||
  new PrismaClient({
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}