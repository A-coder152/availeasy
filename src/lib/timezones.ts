import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { parseISO, format } from "date-fns";

/**
 * Validates if a given string is a valid IANA timezone.
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
 */
export const convertLocalTimeToUtc = (
  date: string,
  timeLocal: string,
  timezone: string
): Date => {
  const localDateTimeString = `${date}T${timeLocal}:00`;
  // In date-fns-tz v3, fromZonedTime replaces zonedTimeToUtc
  return fromZonedTime(localDateTimeString, timezone);
};

/**
 * Converts a UTC Date object to a local time string (HH:mm) in a given timezone.
 */
export const formatUtcToLocalTime = (utcDate: Date, timezone: string): string => {
  return formatInTimeZone(utcDate, timezone, "HH:mm");
};

/**
 * Converts a UTC Date object to a local date string (YYYY-MM-DD) in a given timezone.
 */
export const formatUtcToLocalDate = (utcDate: Date, timezone: string): string => {
  return formatInTimeZone(utcDate, timezone, "yyyy-MM-dd");
};

/**
 * Converts a UTC Date object to an ISO 8601 string in the specified timezone.
 */
export const formatUtcToIsoInTimezone = (utcDate: Date, timezone: string): string => {
  return formatInTimeZone(utcDate, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
};

/**
 * Converts an ISO 8601 string to a UTC Date object.
 */
export const parseIsoToUtc = (isoString: string): Date => {
  return parseISO(isoString);
};

/**
 * Gets the current local date string (YYYY-MM-DD) for a given timezone.
 */
export const getCurrentLocalDateInTimezone = (timezone: string): string => {
  const now = new Date();
  return formatInTimeZone(now, timezone, "yyyy-MM-dd");
};
