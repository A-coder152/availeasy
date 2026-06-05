import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const getPrismaClient = (datasourceUrl?: string) => {
  const options = datasourceUrl
    ? { datasources: { db: { url: datasourceUrl } } }
    : {};

  if (process.env.NODE_ENV === "test" && datasourceUrl) {
    return new PrismaClient(options);
  }
  
  if (!global.prisma) {
    global.prisma = new PrismaClient(options);
  }
  return global.prisma;
};

const prisma = getPrismaClient();
export default prisma;
