import {
  User,
  CurrentStatus,
  AvailabilityException,
  AvailabilityState,
  CurrentStatusState,
} from "@prisma/client";
import { PublicStatusResponse, AvailabilityWindow } from "./availability/types";
import { formatUtcToIsoInTimezone } from "./timezones";

/**
 * Filters a User object to include only public-safe fields.
 * @param user The User object from Prisma.
 * @returns A public-safe User object.
 */
export const toPublicUser = (user: User) => {
  return {
    handle: user.handle,
    timezone: user.timezone,
  };
};

/**
 * Filters a CurrentStatus object to include only public-safe fields.
 * @param status The CurrentStatus object from Prisma, or null.
 * @param userTimezone The user's IANA timezone.
 * @returns A public-safe status object. If status is null or expired, returns "offline".
 */
export const toPublicStatus = (
  status: CurrentStatus | null,
  userTimezone: string
): PublicStatusResponse["status"] => {
  const now = new Date();

  if (!status || (status.validUntil && status.validUntil < now)) {
    return {
      state: CurrentStatusState.offline,
      message: null,
      valid_until: null,
    };
  }

  return {
    state: status.state,
    message: status.message,
    valid_until: status.validUntil
      ? formatUtcToIsoInTimezone(status.validUntil, userTimezone)
      : null,
  };
};

/**
 * Transforms an AvailabilityException into a public-safe AvailabilityWindow.
 * @param exception The AvailabilityException object from Prisma.
 * @param userTimezone The user's IANA timezone.
 * @returns A public-safe AvailabilityWindow.
 */
export const toPublicAvailabilityWindowFromException = (
  exception: AvailabilityException,
  userTimezone: string
): AvailabilityWindow => {
  return {
    start: formatUtcToIsoInTimezone(exception.startsAt, userTimezone),
    end: formatUtcToIsoInTimezone(exception.endsAt, userTimezone),
    state: exception.state,
    label: exception.publicLabel || (exception.state === AvailabilityState.unavailable ? "Busy" : null),
  };
};
