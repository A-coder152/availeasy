import { NextRequest, NextResponse } from "next/server";
import { createBlockSchema } from "@/lib/availability/validation";
import { authenticateRequest, unauthorizedResponse, forbiddenResponse, getTokenScopes } from "@/lib/auth/server-utils";
import { createAvailabilityException } from "@/lib/repositories/availabilityException";
import { differenceInDays } from "date-fns";

export async function POST(req: NextRequest) {
  const { userId, apiToken } = await authenticateRequest(req, ["write", "write/blocks"]);

  if (!userId) {
    return unauthorizedResponse();
  }
  const tokenScopes = apiToken ? getTokenScopes(apiToken) : [];
  if (apiToken && !tokenScopes.includes("write/blocks") && !tokenScopes.includes("write")) {
    return forbiddenResponse("API Token does not have 'write/blocks' or 'write' scope.");
  }

  const body = await req.json();
  const parseResult = createBlockSchema.safeParse(body);

  if (!parseResult.success) {
    return new NextResponse(parseResult.error.message, { status: 400 });
  }

  const { start, end, state, public_label, private_note, source } = parseResult.data;

  const startsAt = new Date(start);
  const endsAt = new Date(end);

  if (startsAt >= endsAt) {
    return new NextResponse("'start' date must be before 'end' date", {
      status: 400,
    });
  }

  const durationDays = differenceInDays(endsAt, startsAt);
  if (durationDays > 30) {
    return new NextResponse("Max duration for a block is 30 days", {
      status: 400,
    });
  }

  try {
    const newBlock = await createAvailabilityException({
      userId,
      startsAt,
      endsAt,
      state,
      publicLabel: public_label,
      privateNote: private_note,
      source,
    });
    return NextResponse.json(newBlock, { status: 201 });
  } catch (error) {
    console.error("Error creating availability block:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
