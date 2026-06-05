import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { authenticateApiToken, validateApiTokenScope } from "./api-tokens";
import { ApiToken } from "@prisma/client";

export type AuthenticatedRequest = NextRequest & {
  user?: { id: string };
  apiToken?: ApiToken;
};

/**
 * Middleware-like function to authenticate requests for private API routes.
 * Supports session-based authentication and bearer token authentication.
 *
 * @param req The NextRequest object.
 * @param requiredScopes An array of scopes required for the current operation.
 * @returns An object containing the userId (if authenticated), and the ApiToken (if authenticated via token).
 *          Returns null for userId/apiToken if authentication fails or is not present.
 */
export const authenticateRequest = async (
  req: NextRequest,
  requiredScopes: string[] = []
): Promise<{ userId: string | null; apiToken: ApiToken | null }> => {
  // 1. Try session-based authentication (for dashboard requests)
  const session = await getServerSession(authOptions);
  console.log("Auth Debug - Session:", session);
  if (session?.user?.id) {
    return { userId: session.user.id, apiToken: null };
  }

  // 2. Try bearer token authentication
  const authorizationHeader = req.headers.get("Authorization");
  if (authorizationHeader) {
    const apiToken = await authenticateApiToken(authorizationHeader);
    if (apiToken) {
      if (validateApiTokenScope(apiToken, requiredScopes)) {
        return { userId: apiToken.userId, apiToken: apiToken };
      } else {
        console.warn(
          `API Token ${apiToken.tokenPrefix} lacks required scopes: ${requiredScopes.join(
            ", "
          )}`
        );
      }
    }
  }

  return { userId: null, apiToken: null };
};

/**
 * Helper to create an unauthorized response.
 */
export const unauthorizedResponse = (message: string = "Unauthorized") => {
  return new NextResponse(message, { status: 401 });
};

/**
 * Helper to create a forbidden response (e.g., due to insufficient scope).
 */
export const forbiddenResponse = (message: string = "Forbidden") => {
  return new NextResponse(message, { status: 403 });
};
