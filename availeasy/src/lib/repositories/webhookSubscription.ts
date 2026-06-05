import prisma from "@/lib/db";
import { WebhookSubscription } from "@prisma/client";

/**
 * Retrieves all webhook subscriptions for a given user.
 * @param userId The ID of the user.
 * @returns An array of WebhookSubscription objects.
 */
export const getWebhookSubscriptionsByUserId = async (
  userId: string
): Promise<WebhookSubscription[]> => {
  return prisma.webhookSubscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Creates a new webhook subscription for a user.
 * @param data The data for the new subscription.
 * @returns The created WebhookSubscription object.
 */
export const createWebhookSubscription = async (data: {
  userId: string;
  url: string;
  events: string[];
  isActive?: boolean;
}): Promise<WebhookSubscription> => {
  return prisma.webhookSubscription.create({ data: { ...data, events: data.events as any } });
};

/**
 * Deletes a webhook subscription by its ID.
 * @param id The ID of the subscription to delete.
 * @param userId The ID of the user who owns the subscription (for security).
 * @returns The deleted WebhookSubscription object or null if not found/owned by user.
 */
export const deleteWebhookSubscription = async (
  id: string,
  userId: string
): Promise<WebhookSubscription | null> => {
  try {
    return await prisma.webhookSubscription.delete({
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
