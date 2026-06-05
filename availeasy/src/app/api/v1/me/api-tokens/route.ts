import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth/server-utils";
import { getApiTokensByUserId } from "@/lib/repositories/apiToken";

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
