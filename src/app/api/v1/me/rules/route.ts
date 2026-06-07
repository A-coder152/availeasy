import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { updateRulesSchema } from "@/lib/availability/validation";
import { authenticateRequest, unauthorizedResponse, forbiddenResponse, getTokenScopes } from "@/lib/auth/server-utils";
import {
  deleteAllAvailabilityRulesForUser,
  createAvailabilityRules,
} from "@/lib/repositories/availabilityRule";
import { updateUser } from "@/lib/repositories/user";
import { AvailabilityState } from "@prisma/client";

export async function PUT(req: NextRequest) {
  const { userId, apiToken } = await authenticateRequest(req, ["write", "write/rules"]);

  if (!userId) {
    return unauthorizedResponse();
  }
  
  const tokenScopes = apiToken ? getTokenScopes(apiToken) : [];
  if (apiToken && !tokenScopes.includes("write/rules") && !tokenScopes.includes("write")) {
    return forbiddenResponse("API Token does not have 'write/rules' or 'write' scope.");
  }

  const body = await req.json();
  const parseResult = updateRulesSchema.safeParse(body);

  if (!parseResult.success) {
    return new NextResponse(parseResult.error.message, { status: 400 });
  }

  const { timezone, rules } = parseResult.data;

  // Additional validation for rules (end_time after start_time, no overnight)
  for (const rule of rules) {
    const [startHour, startMinute] = rule.start_time.split(":").map(Number);
    const [endHour, endMinute] = rule.end_time.split(":").map(Number);

    if (startHour * 60 + startMinute >= endHour * 60 + endMinute) {
      return new NextResponse(
        `Rule for day ${rule.day_of_week} has an end_time (${rule.end_time}) that is not after its start_time (${rule.start_time}). Overnight rules are not supported.`,
        { status: 400 }
      );
    }
  }

  try {
    // Start a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing rules for the user
      await deleteAllAvailabilityRulesForUser(userId);

      // 2. Create new rules
      const newRules = rules.map((rule) => ({
        userId,
        dayOfWeek: rule.day_of_week,
        startTimeLocal: rule.start_time,
        endTimeLocal: rule.end_time,
        state: rule.state as AvailabilityState, // Cast because Zod's nativeEnum returns string
        timezone: timezone, // All rules will have the user's current timezone
      }));
      await createAvailabilityRules(userId, newRules);

      // 3. Update user's timezone
      await updateUser(userId, { timezone });
    });

    return new NextResponse("Availability rules and timezone updated successfully", {
      status: 200,
    });
  } catch (error) {
    console.error("Error updating availability rules or timezone:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
