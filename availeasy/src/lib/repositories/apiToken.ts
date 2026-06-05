import prisma from "@/lib/db";
import { ApiToken } from "@prisma/client";

/**
 * Creates a new API token for a user.
 * @param userId The ID of the user.
 * @param name The name of the token.
 * @param tokenHash The hashed token value.
 * @param tokenPrefix The prefix of the token.
 * @param scopes An array of scopes for the token.
 * @param expiresAt Optional expiration date for the token.
 * @returns The created ApiToken object.
 */
export const createApiToken = async (data: {
  userId: string;
  name: string;
  tokenHash: string;
  tokenPrefix: string;
  scopes: string[];
  expiresAt?: Date;
}): Promise<ApiToken> => {
  return prisma.apiToken.create({ data });
};

/**
 * Finds an API token by its prefix.
 * @param tokenPrefix The prefix of the token to find.
 * @returns The ApiToken object or null if not found.
 */
export const findApiTokenByPrefix = async (
  tokenPrefix: string
): Promise<ApiToken | null> => {
  return prisma.apiToken.findFirst({
    where: { tokenPrefix },
  });
};

/**
 * Finds an API token by its ID.
 * @param id The ID of the token to find.
 * @returns The ApiToken object or null if not found.
 */
export const findApiTokenById = async (id: string): Promise<ApiToken | null> => {
  return prisma.apiToken.findUnique({
    where: { id },
  });
};

/**
 * Retrieves all API tokens for a given user.
 * @param userId The ID of the user.
 * @returns An array of ApiToken objects.
 */
export const getApiTokensByUserId = async (
  userId: string
): Promise<ApiToken[]> => {
  return prisma.apiToken.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Deletes an API token by its ID.
 * @param id The ID of the token to delete.
 * @param userId The ID of the user who owns the token (for security).
 * @returns The deleted ApiToken object or null if not found/owned by user.
 */
export const deleteApiToken = async (
  id: string,
  userId: string
): Promise<ApiToken | null> => {
  try {
    return await prisma.apiToken.delete({
      where: {
        id,
        userId,
      },
    });
  } catch (error) {
    // If record not found, Prisma will throw an error
    return null;
  }
};

/**
 * Updates the lastUsedAt timestamp for an API token.
 * @param id The ID of the token to update.
 * @returns The updated ApiToken object.
 */
export const updateApiTokenLastUsed = async (id: string): Promise<ApiToken> => {
  return prisma.apiToken.update({
    where: { id },
    data: { lastUsedAt: new Date() },
  });
};