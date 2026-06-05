import prisma from "@/lib/db";
import { AvailabilityRule, AvailabilityState } from "@prisma/client";

/**
 * Retrieves all availability rules for a given user.
 * @param userId The ID of the user.
 * @returns An array of AvailabilityRule objects.
 */
export const getAvailabilityRulesByUserId = async (
  userId: string
): Promise<AvailabilityRule[]> => {
  return prisma.availabilityRule.findMany({
    where: { userId },
    orderBy: [{ dayOfWeek: "asc" }, { startTimeLocal: "asc" }],
  });
};

/**
 * Creates multiple availability rules for a user.
 * This function is typically used in conjunction with `deleteAllAvailabilityRulesForUser`
 * to implement a "replace all" functionality.
 * @param userId The ID of the user.
 * @param rules The array of rule data to create.
 * @returns An array of the created AvailabilityRule objects.
 */
export const createAvailabilityRules = async (
  userId: string,
  rules: Array<{
    dayOfWeek: number;
    startTimeLocal: string;
    endTimeLocal: string;
    state: AvailabilityState;
    timezone: string;
  }>
): Promise<AvailabilityRule[]> => {
  const rulesWithUserId = rules.map((rule) => ({ ...rule, userId }));
  const createdRules = await prisma.$transaction(
    rulesWithUserId.map((rule) => prisma.availabilityRule.create({ data: rule }))
  );
  return createdRules;
};

/**
 * Deletes all availability rules for a given user.
 * @param userId The ID of the user.
 * @returns The count of deleted rules.
 */
export const deleteAllAvailabilityRulesForUser = async (
  userId: string
): Promise<number> => {
  const { count } = await prisma.availabilityRule.deleteMany({
    where: { userId },
  });
  return count;
};