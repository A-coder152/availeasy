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
  return handleStatusUpdate(req);
}

export async function POST(req: NextRequest) {
  return handleStatusUpdate(req);
}

async function handleStatusUpdate(req: NextRequest) {
  const { userId, apiToken } = await authenticateRequest(req, ["write", "write/status"]);

  if (!userId) {
    return unauthorizedResponse();
  }
  if (apiToken && !apiToken.scopes.includes("write/status") && !apiToken.scopes.includes("write")) {
    return forbiddenResponse("API Token does not have 'write/status' or 'write' scope.");
  }

  const contentType = req.headers.get("content-type");
  let body;

  if (contentType?.includes("application/x-www-form-urlencoded")) {
    const formData = await req.formData();
    body = Object.fromEntries(formData.entries());
    // Convert stringified booleans or numbers if needed, though here they are strings
  } else {
    body = await req.json();
  }

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
    // For form submissions, redirect back to dashboard
    if (contentType?.includes("application/x-www-form-urlencoded")) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.json(updatedStatus, { status: 200 });
  } catch (error) {
    console.error("Error updating current status:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
