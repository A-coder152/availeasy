import { NextRequest, NextResponse } from "next/server";
import { addDays, subDays } from "date-fns";
import { z } from "zod";
import { findUserByHandle } from "@/lib/repositories/user";
import { getAvailabilityForRange } from "@/lib/availability/calculate";
import { AvailabilityResponse } from "@/lib/availability/types";
import { availabilityQueryParamsSchema } from "@/lib/availability/validation";
import { getCurrentStatusByUserId } from "@/lib/repositories/currentStatus";
import { toPublicStatus, toPublicUser } from "@/lib/public-safety";

// Placeholder for rate limiting
const applyRateLimiting = async (req: NextRequest) => {
  // In a real application, implement actual rate limiting logic here
  // e.g., using an in-memory store, Redis, or a third-party service.
  // For now, it's a no-op.
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

  // 2. Validate query parameters
  const parseResult = availabilityQueryParamsSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );

  if (!parseResult.success) {
    return new NextResponse(parseResult.error.message, { status: 400 });
  }

  let { from, to } = parseResult.data;
  const now = new Date();

  // Apply defaults: from = now, to = now + 7 days
  let startDate = from ? new Date(from) : now;
  let endDate = to ? new Date(to) : addDays(now, 7);

  // Validation: Max range 90 days
  const maxRangeEndDate = addDays(startDate, 90);
  if (endDate > maxRangeEndDate) {
    endDate = maxRangeEndDate; // Clip to max 90 days
  }
  
  // Ensure from date is not in the distant past (e.g., more than 90 days ago)
  const minRangeStartDate = subDays(now, 90);
  if (startDate < minRangeStartDate) {
    startDate = minRangeStartDate;
  }

  // Ensure 'to' is after 'from'
  if (startDate > endDate) {
    return new NextResponse("'from' date cannot be after 'to' date", {
      status: 400,
    });
  }

  // 3. Get availability windows
  const availabilityWindows = await getAvailabilityForRange({
    userId: user.id,
    from: startDate,
    to: endDate,
    timezone: user.timezone,
  });

  // 4. Get current status
  const currentStatus = await getCurrentStatusByUserId(user.id);

  // 5. Build response
  const response: AvailabilityResponse = {
    user: toPublicUser(user),
    status: toPublicStatus(currentStatus, user.timezone),
    windows: availabilityWindows,
    updated_at: new Date().toISOString(), // Or user.updatedAt if applicable
  };

  const headers = new Headers();
  headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  headers.set("Content-Type", "application/json");

  return new NextResponse(JSON.stringify(response), {
    status: 200,
    headers,
  });
}
