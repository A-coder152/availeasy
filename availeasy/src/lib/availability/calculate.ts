import prisma from "@/lib/db";
import {
  AvailabilityRule,
  AvailabilityException,
  AvailabilityState,
} from "@prisma/client";
import {
  AvailabilityWindow,
  UserAvailabilityData,
} from "@/lib/availability/types";
import {
  formatUtcToIsoInTimezone,
  convertLocalTimeToUtc,
  formatUtcToLocalDate,
} from "@/lib/timezones";
import { addDays, startOfDay, endOfDay, isBefore, isAfter, max, min } from "date-fns";

type GetAvailabilityForRangeParams = {
  userId: string;
  from: Date; // UTC Date
  to: Date; // UTC Date
  timezone: string; // IANA timezone
};

/**
 * Expands weekly availability rules into concrete AvailabilityWindow objects for a given date range.
 * @param rules The user's weekly availability rules.
 * @param from The start of the requested range (UTC Date).
 * @param to The end of the requested range (UTC Date).
 * @param userTimezone The user's IANA timezone.
 * @returns An array of AvailabilityWindow objects.
 */
export const expandWeeklyRules = (
  rules: AvailabilityRule[],
  from: Date,
  to: Date,
  userTimezone: string
): AvailabilityWindow[] => {
  const windows: AvailabilityWindow[] = [];
  let currentDate = startOfDay(from);

  while (isBefore(currentDate, to)) {
    const dayOfWeek = currentDate.getDay(); // 0 for Sunday, 6 for Saturday
    const localDateString = formatUtcToLocalDate(currentDate, userTimezone);

    const matchingRules = rules.filter(
      (rule) =>
        rule.dayOfWeek === dayOfWeek &&
        (!rule.validFrom || isAfter(currentDate, rule.validFrom) || currentDate.toDateString() === rule.validFrom.toDateString()) &&
        (!rule.validUntil || isBefore(currentDate, rule.validUntil) || currentDate.toDateString() === rule.validUntil.toDateString())
    );

    for (const rule of matchingRules) {
      const windowStartUtc = convertLocalTimeToUtc(
        localDateString,
        rule.startTimeLocal,
        userTimezone
      );
      const windowEndUtc = convertLocalTimeToUtc(
        localDateString,
        rule.endTimeLocal,
        userTimezone
      );

      // Clip the window to the requested 'from' and 'to' range
      const clippedStart = max([windowStartUtc, from]);
      const clippedEnd = min([windowEndUtc, to]);

      if (isBefore(clippedStart, clippedEnd)) {
        windows.push({
          start: formatUtcToIsoInTimezone(clippedStart, userTimezone),
          end: formatUtcToIsoInTimezone(clippedEnd, userTimezone),
          state: rule.state,
          label: null, // Rules don't have labels
        });
      }
    }
    currentDate = addDays(currentDate, 1);
  }

  return windows;
};

/**
 * Applies availability exceptions over a list of existing availability windows.
 * Exceptions override the state of overlapping windows.
 * @param windows An array of existing AvailabilityWindow objects.
 * @param exceptions An array of AvailabilityException objects.
 * @param userTimezone The user's IANA timezone.
 * @returns A new array of AvailabilityWindow objects with exceptions applied.
 */
export const applyExceptions = (
  windows: AvailabilityWindow[],
  exceptions: AvailabilityException[],
  userTimezone: string
): AvailabilityWindow[] => {
  let processedWindows = [...windows];

  for (const exception of exceptions) {
    const exceptionStart = exception.startsAt;
    const exceptionEnd = exception.endsAt;
    const newWindows: AvailabilityWindow[] = [];

    for (const window of processedWindows) {
      const windowStart = new Date(window.start);
      const windowEnd = new Date(window.end);

      // Case 1: No overlap
      if (isAfter(windowStart, exceptionEnd) || isBefore(windowEnd, exceptionStart)) {
        newWindows.push(window);
        continue;
      }

      // Case 2: Exception fully covers the window
      if (isBefore(exceptionStart, windowStart) && isAfter(exceptionEnd, windowEnd)) {
        // Window is completely replaced by the exception
        newWindows.push({
          start: formatUtcToIsoInTimezone(windowStart, userTimezone),
          end: formatUtcToIsoInTimezone(windowEnd, userTimezone),
          state: exception.state,
          label: exception.publicLabel || (exception.state === AvailabilityState.unavailable ? "Busy" : null),
        });
        continue;
      }

      // Case 3: Exception is within the window, splitting it
      if (isAfter(exceptionStart, windowStart) && isBefore(exceptionEnd, windowEnd)) {
        // Left part
        newWindows.push({
          start: formatUtcToIsoInTimezone(windowStart, userTimezone),
          end: formatUtcToIsoInTimezone(exceptionStart, userTimezone),
          state: window.state,
          label: window.label,
        });
        // Middle part (exception)
        newWindows.push({
          start: formatUtcToIsoInTimezone(exceptionStart, userTimezone),
          end: formatUtcToIsoInTimezone(exceptionEnd, userTimezone),
          state: exception.state,
          label: exception.publicLabel || (exception.state === AvailabilityState.unavailable ? "Busy" : null),
        });
        // Right part
        newWindows.push({
          start: formatUtcToIsoInTimezone(exceptionEnd, userTimezone),
          end: formatUtcToIsoInTimezone(windowEnd, userTimezone),
          state: window.state,
          label: window.label,
        });
        continue;
      }

      // Case 4: Exception overlaps left side of window
      if (isBefore(exceptionStart, windowStart) && isBefore(exceptionEnd, windowEnd)) {
        // Overlap part (exception)
        newWindows.push({
          start: formatUtcToIsoInTimezone(windowStart, userTimezone),
          end: formatUtcToIsoInTimezone(exceptionEnd, userTimezone),
          state: exception.state,
          label: exception.publicLabel || (exception.state === AvailabilityState.unavailable ? "Busy" : null),
        });
        // Right non-overlap part
        newWindows.push({
          start: formatUtcToIsoInTimezone(exceptionEnd, userTimezone),
          end: formatUtcToIsoInTimezone(windowEnd, userTimezone),
          state: window.state,
          label: window.label,
        });
        continue;
      }

      // Case 5: Exception overlaps right side of window
      if (isAfter(exceptionStart, windowStart) && isAfter(exceptionEnd, windowEnd)) {
        // Left non-overlap part
        newWindows.push({
          start: formatUtcToIsoInTimezone(windowStart, userTimezone),
          end: formatUtcToIsoInTimezone(exceptionStart, userTimezone),
          state: window.state,
          label: window.label,
        });
        // Overlap part (exception)
        newWindows.push({
          start: formatUtcToIsoInTimezone(exceptionStart, userTimezone),
          end: formatUtcToIsoInTimezone(windowEnd, userTimezone),
          state: exception.state,
          label: exception.publicLabel || (exception.state === AvailabilityState.unavailable ? "Busy" : null),
        });
        continue;
      }

      // Case 6: Exception exactly matches the window
      if (
        (exceptionStart.getTime() === windowStart.getTime()) &&
        (exceptionEnd.getTime() === windowEnd.getTime())
      ) {
        newWindows.push({
          start: formatUtcToIsoInTimezone(windowStart, userTimezone),
          end: formatUtcToIsoInTimezone(windowEnd, userTimezone),
          state: exception.state,
          label: exception.publicLabel || (exception.state === AvailabilityState.unavailable ? "Busy" : null),
        });
        continue;
      }
    }
    processedWindows = newWindows;
  }

  // Sort and merge any adjacent windows that might have been created by splitting
  return mergeAdjacentWindows(processedWindows);
};


/**
 * Merges adjacent availability windows that have the same state and label.
 * @param windows An array of AvailabilityWindow objects.
 * @returns A new array of merged AvailabilityWindow objects.
 */
export const mergeAdjacentWindows = (
  windows: AvailabilityWindow[]
): AvailabilityWindow[] => {
  if (windows.length === 0) {
    return [];
  }

  // Sort windows by start time first
  const sortedWindows = [...windows].sort((a, b) =>
    new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const merged: AvailabilityWindow[] = [];
  let currentMergedWindow = { ...sortedWindows[0] };

  for (let i = 1; i < sortedWindows.length; i++) {
    const nextWindow = sortedWindows[i];
    // Check if current merged window ends exactly when the next window starts
    // and if they have the same state and label
    if (
      currentMergedWindow.state === nextWindow.state &&
      currentMergedWindow.label === nextWindow.label &&
      new Date(currentMergedWindow.end).getTime() === new Date(nextWindow.start).getTime()
    ) {
      // Merge by extending the end time of the current merged window
      currentMergedWindow.end = nextWindow.end;
    } else {
      // Cannot merge, push the current merged window and start a new one
      merged.push(currentMergedWindow);
      currentMergedWindow = { ...nextWindow };
    }
  }

  // Push the last merged window
  merged.push(currentMergedWindow);

  return merged;
};

/**
 * Calculates the availability windows for a user within a specified range,
 * applying weekly rules and exceptions.
 * @param params The parameters for availability calculation.
 * @returns A Promise resolving to an array of AvailabilityWindow objects.
 */
export const getAvailabilityForRange = async ({
  userId,
  from,
  to,
  timezone,
}: GetAvailabilityForRangeParams): Promise<AvailabilityWindow[]> => {
  // Load user data including rules and exceptions
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      AvailabilityRule: true,
      AvailabilityException: true,
    },
  });

  if (!userData) {
    return [];
  }

  // 1. Expand weekly rules into concrete windows
  let windows = expandWeeklyRules(
    userData.AvailabilityRule,
    from,
    to,
    timezone
  );

  // 2. Apply exceptions over the expanded rule windows
  windows = applyExceptions(windows, userData.AvailabilityException, timezone);

  // 3. Merge adjacent windows with the same state
  windows = mergeAdjacentWindows(windows);

  // 4. Default to unavailable where no explicit available window exists
  // This step is implicitly handled by starting with only 'available' windows from rules
  // and then overriding with 'unavailable' exceptions. Any gaps will be 'unavailable' by absence.
  // However, to explicitly represent unavailable blocks from gaps, we might need a more
  // sophisticated "fill gaps" logic, which for MVP, is simplified by assuming
  // only 'available' times are shown if no rule/exception.

  // Filter out any windows that are outside the requested range after processing
  const finalWindows = windows.filter(
    (window) =>
      isBefore(new Date(window.start), to) && isAfter(new Date(window.end), from)
  ).map(window => ({
    ...window,
    start: max([new Date(window.start), from]).toISOString(),
    end: min([new Date(window.end), to]).toISOString(),
  }));


  return finalWindows;
};