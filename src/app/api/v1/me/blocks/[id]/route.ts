import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, unauthorizedResponse, forbiddenResponse } from "@/lib/auth/server-utils";
import { deleteAvailabilityException } from "@/lib/repositories/availabilityException";
import { idSchema } from "@/lib/availability/validation";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, apiToken } = await authenticateRequest(req, ["write", "write/blocks"]);

  if (!userId) {
    return unauthorizedResponse();
  }
  if (apiToken && !apiToken.scopes.includes("write/blocks") && !apiToken.scopes.includes("write")) {
    return forbiddenResponse("API Token does not have 'write/blocks' or 'write' scope.");
  }

  const parseResult = idSchema.safeParse(params.id);
  if (!parseResult.success) {
    return new NextResponse("Invalid block ID", { status: 400 });
  }

  const blockId = parseResult.data;

  try {
    const deletedBlock = await deleteAvailabilityException(blockId, userId);
    if (!deletedBlock) {
      return new NextResponse("Availability block not found or not owned by user", { status: 404 });
    }
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error("Error deleting availability block:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
