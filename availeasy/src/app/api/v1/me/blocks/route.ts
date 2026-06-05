import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth/server-utils";
import { getAvailabilityExceptionsByUserId } from "@/lib/repositories/availabilityException";
import { addDays, startOfDay, endOfDay } from "date-fns";
import { User } from "@prisma/client";
import { findUserById } from "@/lib/repositories/user";

export async function GET(req: NextRequest) {
  const { userId } = await authenticateRequest(req);

  if (!userId) {
    return unauthorizedResponse();
  }

  // For now, fetch blocks for the next 90 days
  const now = new Date();
  const from = startOfDay(now);
  const to = endOfDay(addDays(now, 90));

  try {
    const blocks = await getAvailabilityExceptionsByUserId(userId, from, to);
    return NextResponse.json(blocks, { status: 200 });
  } catch (error) {
    console.error("Error fetching availability blocks:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
