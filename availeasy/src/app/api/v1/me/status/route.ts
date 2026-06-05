import { NextRequest, NextResponse } from "next/server";
import { updateStatusSchema } from "@/lib/availability/validation";
import { authenticateRequest, unauthorizedResponse, forbiddenResponse } from "@/lib/auth/server-utils";
import { upsertCurrentStatus, getCurrentStatusByUserId } from "@/lib/repositories/currentStatus";
import { toPublicStatus } from "@/lib/public-safety";
import { findUserById } from "@/lib/repositories/user";

export async function GET(req: NextRequest) {
  const { userId } = await authenticateRequest(req, ["read", "read/status"]);

  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      return unauthorizedResponse(); // User somehow doesn't exist despite having userId
    }
    const currentStatus = await getCurrentStatusByUserId(userId);
    const publicStatus = toPublicStatus(currentStatus, user.timezone); // Use public-safety helper

    return NextResponse.json(publicStatus, { status: 200 });
  } catch (error) {
    console.error("Error fetching current status:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { userId, apiToken } = await authenticateRequest(req, ["write", "write/status"]);

  if (!userId) {
    return unauthorizedResponse();
  }
  if (apiToken && !apiToken.scopes.includes("write/status") && !apiToken.scopes.includes("write")) {
    return forbiddenResponse("API Token does not have 'write/status' or 'write' scope.");
  }

  const body = await req.json();
  const parseResult = updateStatusSchema.safeParse(body);

  if (!parseResult.success) {
    return new NextResponse(parseResult.error.message, { status: 400 });
  }

  const { state, message, valid_until } = parseResult.data;

  const validUntilDate = valid_until ? new Date(valid_until) : null;
  if (validUntilDate && validUntilDate < new Date()) {
    return new NextResponse("valid_until date cannot be in the past", {
      status: 400,
    });
  }

  try {
    const updatedStatus = await upsertCurrentStatus(
      userId,
      state,
      message,
      validUntilDate
    );
    return NextResponse.json(updatedStatus, { status: 200 });
  } catch (error) {
    console.error("Error updating current status:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
