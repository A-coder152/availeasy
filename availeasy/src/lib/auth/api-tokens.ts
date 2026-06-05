import { ApiToken } from "@prisma/client";
import * as crypto from "crypto";
import bcrypt from "bcrypt";
import {
  createApiToken as dbCreateApiToken,
  findApiTokenByPrefix as dbFindApiTokenByPrefix,
  updateApiTokenLastUsed,
} from "@/lib/repositories/apiToken";

const TOKEN_PREFIX_LENGTH = 8;
const HASH_SALT_ROUNDS = 10; // For bcrypt

export type GeneratedApiToken = {
  plainTextToken: string;
  tokenHash: string;
  tokenPrefix: string;
};

/**
 * Generates a new API token, hashes it, and extracts a prefix.
 * @returns An object containing the plain text token, its hash, and its prefix.
 */
export const generateApiToken = async (): Promise<GeneratedApiToken> => {
  const plainTextToken = crypto.randomBytes(32).toString("hex"); // Generate a random 64-char hex string
  const tokenHash = await bcrypt.hash(plainTextToken, HASH_SALT_ROUNDS);
  const tokenPrefix = plainTextToken.substring(0, TOKEN_PREFIX_LENGTH);

  return { plainTextToken, tokenHash, tokenPrefix };
};

/**
 * Verifies a plain text token against a stored hash using bcrypt.
 * @param plainTextToken The token provided by the client.
 * @param storedTokenHash The hashed token from the database.
 * @returns True if the token is valid, false otherwise.
 */
export const verifyApiToken = async (
  plainTextToken: string,
  storedTokenHash: string
): Promise<boolean> => {
  return bcrypt.compare(plainTextToken, storedTokenHash);
};

/**
 * Authenticates an API token from a bearer string.
 * @param bearerToken The "Bearer {token}" string from the Authorization header.
 * @returns The authenticated ApiToken object or null if authentication fails.
 */
export const authenticateApiToken = async (
  bearerToken: string
): Promise<ApiToken | null> => {
  if (!bearerToken || !bearerToken.startsWith("Bearer ")) {
    return null;
  }

  const plainTextToken = bearerToken.substring(7); // Remove "Bearer "
  const tokenPrefix = plainTextToken.substring(0, TOKEN_PREFIX_LENGTH);

  const apiToken = await dbFindApiTokenByPrefix(tokenPrefix);

  if (!apiToken) {
    return null;
  }

  // Check if the token has expired
  if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
    return null;
  }

  const isValid = await verifyApiToken(plainTextToken, apiToken.tokenHash);

  if (isValid) {
    // Update lastUsedAt for the token asynchronously
    updateApiTokenLastUsed(apiToken.id).catch(console.error);
    return apiToken;
  }

  return null;
};

/**
 * Validates if an API token has all required scopes.
 * @param apiToken The authenticated ApiToken object.
 * @param requiredScopes An array of scopes that are required for the operation.
 * @returns True if the token has all required scopes, false otherwise.
 */
export const validateApiTokenScope = (
  apiToken: ApiToken,
  requiredScopes: string[]
): boolean => {
  if (!apiToken.scopes || apiToken.scopes.length === 0) {
    return requiredScopes.length === 0; // If token has no scopes, it only passes if no scopes are required
  }

  return requiredScopes.every((scope) => apiToken.scopes.includes(scope));
};
