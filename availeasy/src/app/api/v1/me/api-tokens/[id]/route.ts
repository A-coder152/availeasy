import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, unauthorizedResponse, forbiddenResponse } from "@/lib/auth/server-utils";
import { deleteApiToken } from "@/lib/repositories/apiToken";
import { idSchema } from "@/lib/availability/validation";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, apiToken } = await authenticateRequest(req, ["write", "admin"]);

  if (!userId) {
    return unauthorizedResponse();
  }
  if (apiToken && !apiToken.scopes.includes("admin") && !apiToken.scopes.includes("write")) {
    return forbiddenResponse("API Token does not have 'admin' or 'write' scope to delete API tokens.");
  }

  const parseResult = idSchema.safeParse(params.id);
  if (!parseResult.success) {
    return new NextResponse("Invalid API token ID", { status: 400 });
  }

  const tokenId = parseResult.data;

  try {
    const deletedToken = await deleteApiToken(tokenId, userId);
    if (!deletedToken) {
      return new NextResponse("API token not found or not owned by user", { status: 404 });
    }
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error("Error deleting API token:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
