import prisma from "@/lib/db";
import { CurrentStatus, CurrentStatusState } from "@prisma/client";

/**
 * Retrieves the current status for a given user.
 * @param userId The ID of the user.
 * @returns The CurrentStatus object or null if not found.
 */
export const getCurrentStatusByUserId = async (
  userId: string
): Promise<CurrentStatus | null> => {
  return prisma.currentStatus.findUnique({
    where: { userId },
  });
};

/**
 * Creates or updates the current status for a given user.
 * @param userId The ID of the user.
 * @param state The state of the current status.
 * @param message An optional message.
 * @param validUntil An optional datetime when the status expires.
 * @returns The created or updated CurrentStatus object.
 */
export const upsertCurrentStatus = async (
  userId: string,
  state: CurrentStatusState,
  message?: string | null,
  validUntil?: Date | null
): Promise<CurrentStatus> => {
  return prisma.currentStatus.upsert({
    where: { userId },
    update: { state, message, validUntil },
    create: { userId, state, message, validUntil },
  });
};
