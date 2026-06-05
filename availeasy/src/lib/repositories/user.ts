import prisma from "@/lib/db";
import { User } from "@prisma/client";

/**
 * Finds a user by their handle.
 * @param handle The user's unique handle.
 * @returns The User object or null if not found.
 */
export const findUserByHandle = async (handle: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { handle },
  });
};

/**
 * Finds a user by their ID.
 * @param id The user's ID.
 * @returns The User object or null if not found.
 */
export const findUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id },
  });
};

/**
 * Finds a user by their email.
 * @param email The user's email.
 * @returns The User object or null if not found.
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email },
  });
};

/**
 * Creates a new user.
 * @param data The data for the new user.
 * @returns The created User object.
 */
export const createUser = async (data: {
  email: string;
  handle: string;
  name?: string;
  timezone?: string;
}): Promise<User> => {
  return prisma.user.create({ data });
};

/**
 * Updates an existing user.
 * @param id The ID of the user to update.
 * @param data The data to update.
 * @returns The updated User object.
 */
export const updateUser = async (
  id: string,
  data: Partial<User>
): Promise<User> => {
  return prisma.user.update({
    where: { id },
    data,
  });
};
