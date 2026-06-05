import { zonedTimeToUtc, utcToZonedTime, formatInTimeZone } from "date-fns-tz";
import { parseISO, format } from "date-fns";

/**
 * Validates if a given string is a valid IANA timezone.
 * @param timezone The timezone string to validate.
 * @returns True if valid, false otherwise.
 */
export const isValidIanaTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Converts a local time (HH:mm) on a specific date in a given timezone to a UTC Date object.
 * @param date The date string (e.g., "YYYY-MM-DD").
 * @param timeLocal The local time string (e.g., "HH:mm").
 * @param timezone The IANA timezone (e.g., "America/New_York").
 * @returns A Date object in UTC.
 */
export const convertLocalTimeToUtc = (
  date: string,
  timeLocal: string,
  timezone: string
): Date => {
  const localDateTimeString = `${date}T${timeLocal}:00`;
  return zonedTimeToUtc(localDateTimeString, timezone);
};

/**
 * Converts a UTC Date object to a local time string (HH:mm) in a given timezone.
 * @param utcDate The UTC Date object.
 * @param timezone The IANA timezone.
 * @returns A local time string (HH:mm).
 */
export const formatUtcToLocalTime = (utcDate: Date, timezone: string): string => {
  return formatInTimeZone(utcDate, timezone, "HH:mm");
};

/**
 * Converts a UTC Date object to a local date string (YYYY-MM-DD) in a given timezone.
 * @param utcDate The UTC Date object.
 * @param timezone The IANA timezone.
 * @returns A local date string (YYYY-MM-DD).
 */
export const formatUtcToLocalDate = (utcDate: Date, timezone: string): string => {
  return formatInTimeZone(utcDate, timezone, "yyyy-MM-dd");
};

/**
 * Converts a UTC Date object to an ISO 8601 string in the specified timezone.
 * @param utcDate The UTC Date object.
 * @param timezone The IANA timezone.
 * @returns An ISO 8601 string in the specified timezone (e.g., "2026-06-04T18:00:00-04:00").
 */
export const formatUtcToIsoInTimezone = (utcDate: Date, timezone: string): string => {
  return formatInTimeZone(utcDate, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
};

/**
 * Converts an ISO 8601 string to a UTC Date object.
 * @param isoString The ISO 8601 string.
 * @returns A Date object in UTC.
 */
export const parseIsoToUtc = (isoString: string): Date => {
  return parseISO(isoString);
};

/**
 * Gets the current local date string (YYYY-MM-DD) for a given timezone.
 * @param timezone The IANA timezone.
 * @returns The current local date string (YYYY-MM-DD).
 */
export const getCurrentLocalDateInTimezone = (timezone: string): string => {
  const now = new Date();
  return formatInTimeZone(now, timezone, "yyyy-MM-dd");
};
