import prisma from "@/lib/db";
import { AvailabilityException, AvailabilityState, ExceptionSource } from "@prisma/client";

/**
 * Retrieves all availability exceptions for a given user within a date range.
 * @param userId The ID of the user.
 * @param from The start of the date range (UTC Date).
 * @param to The end of the date range (UTC Date).
 * @returns An array of AvailabilityException objects.
 */
export const getAvailabilityExceptionsByUserId = async (
  userId: string,
  from: Date,
  to: Date
): Promise<AvailabilityException[]> => {
  return prisma.availabilityException.findMany({
    where: {
      userId,
      startsAt: { lte: to },
      endsAt: { gte: from },
    },
    orderBy: { startsAt: "asc" },
  });
};

/**
 * Creates a new availability exception.
 * @param data The data for the new exception.
 * @returns The created AvailabilityException object.
 */
export const createAvailabilityException = async (data: {
  userId: string;
  startsAt: Date;
  endsAt: Date;
  state: AvailabilityState;
  publicLabel?: string;
  privateNote?: string;
  source?: ExceptionSource;
}): Promise<AvailabilityException> => {
  return prisma.availabilityException.create({ data });
};

/**
 * Deletes an availability exception by its ID.
 * @param id The ID of the exception to delete.
 * @param userId The ID of the user who owns the exception (for security).
 * @returns The deleted AvailabilityException object or null if not found/owned by user.
 */
export const deleteAvailabilityException = async (
  id: string,
  userId: string
): Promise<AvailabilityException | null> => {
  try {
    return await prisma.availabilityException.delete({
      where: {
        id,
        userId,
      },
    });
  } catch (error) {
    // If record not found, Prisma will throw an error
    return null;
  }
};
