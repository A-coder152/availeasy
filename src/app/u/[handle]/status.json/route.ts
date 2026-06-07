import { NextRequest, NextResponse } from "next/server";
import { findUserByHandle } from "@/lib/repositories/user";
import { getCurrentStatusByUserId } from "@/lib/repositories/currentStatus";
import { toPublicStatus, toPublicUser } from "@/lib/public-safety";
import { PublicStatusResponse } from "@/lib/availability/types";

// Placeholder for rate limiting
const applyRateLimiting = async (req: NextRequest) => {
  // In a real application, implement actual rate limiting logic here
  console.log("Applying rate limiting (placeholder)");
  return { allowed: true };
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;

  // Rate limiting placeholder
  const { allowed } = await applyRateLimiting(req);
  if (!allowed) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  // 1. Fetch User by handle
  const user = await findUserByHandle(handle);
  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  // 2. Get current status
  const currentStatus = await getCurrentStatusByUserId(user.id);

  // 3. Build response
  const response: PublicStatusResponse = {
    user: toPublicUser(user),
    status: toPublicStatus(currentStatus, user.timezone),
    updated_at: new Date().toISOString(), // Or currentStatus.updatedAt if available
  };

  const headers = new Headers();
  headers.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
  headers.set("Content-Type", "application/json");

  return new NextResponse(JSON.stringify(response), {
    status: 200,
    headers,
  });
}
