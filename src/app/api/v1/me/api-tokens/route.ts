import { NextRequest, NextResponse } from "next/server";
import { createApiTokenSchema } from "@/lib/availability/validation";
import { authenticateRequest, unauthorizedResponse, forbiddenResponse, getTokenScopes } from "@/lib/auth/server-utils";
import { generateApiToken } from "@/lib/auth/api-tokens";
import { createApiToken as dbCreateApiToken, getApiTokensByUserId } from "@/lib/repositories/apiToken";

export async function GET(req: NextRequest) {
  const { userId } = await authenticateRequest(req, ["read", "read/api-tokens"]);

  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    const apiTokens = await getApiTokensByUserId(userId);
    // Filter out tokenHash for security, only return displayable fields
    const publicApiTokens = apiTokens.map(({ tokenHash, userId, ...rest }) => rest);
    return NextResponse.json(publicApiTokens, { status: 200 });
  } catch (error) {
    console.error("Error fetching API tokens:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId, apiToken } = await authenticateRequest(req, ["write", "admin"]); 

  if (!userId) {
    return unauthorizedResponse();
  }
  
  const tokenScopes = apiToken ? getTokenScopes(apiToken) : [];
  if (apiToken && !tokenScopes.includes("admin") && !tokenScopes.includes("write")) {
    return forbiddenResponse("API Token does not have 'admin' or 'write' scope to create API tokens.");
  }

  const body = await req.json();
  const parseResult = createApiTokenSchema.safeParse(body);

  if (!parseResult.success) {
    return new NextResponse(parseResult.error.message, { status: 400 });
  }

  const { name, scopes } = parseResult.data;

  try {
    const { plainTextToken, tokenHash, tokenPrefix } = await generateApiToken();

    const newApiToken = await dbCreateApiToken({
      userId,
      name,
      tokenHash,
      tokenPrefix,
      scopes,
    });

    return NextResponse.json(
      {
        id: newApiToken.id,
        name: newApiToken.name,
        token: plainTextToken, 
        tokenPrefix: newApiToken.tokenPrefix,
        scopes: newApiToken.scopes,
        createdAt: newApiToken.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating API token:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
