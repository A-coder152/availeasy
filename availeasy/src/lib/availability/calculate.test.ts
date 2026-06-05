import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  expandWeeklyRules,
  applyExceptions,
  mergeAdjacentWindows,
  getAvailabilityForRange,
} from "./calculate";
import { AvailabilityRule, AvailabilityException, AvailabilityState } from "@prisma/client";
import { AvailabilityWindow } from "./types";
import { addDays, startOfDay, endOfDay } from "date-fns";
import prisma from "@/lib/db"; 

vi.mock("@/lib/db", () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
    },
  };
  return { default: mockPrisma };
});

const USER_TIMEZONE = "UTC"; // Simplify test to UTC to avoid timezone issues
const USER_ID = "test-user-id";

describe("Availability Calculation Logic", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("expandWeeklyRules", () => {
    it("should expand simple weekly rules into concrete date windows", () => {
      const rules: AvailabilityRule[] = [
        {
          id: "rule1",
          userId: USER_ID,
          dayOfWeek: 2, // Tuesday
          startTimeLocal: "09:00",
          endTimeLocal: "17:00",
          state: AvailabilityState.available,
          priority: 0,
          validFrom: null,
          validUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          timezone: USER_TIMEZONE,
        },
      ];
      const from = new Date("2026-06-02T00:00:00Z"); // Tuesday UTC
      const to = new Date("2026-06-03T00:00:00Z"); // Wednesday UTC

      const windows = expandWeeklyRules(rules, from, to, USER_TIMEZONE);

      expect(windows).toHaveLength(1);
      expect(windows[0].start).toContain("2026-06-02T09:00:00");
      expect(windows[0].state).toBe(AvailabilityState.available);
    });

    it("should clip windows to the requested range", () => {
      const rules: AvailabilityRule[] = [
        {
          id: "rule1",
          userId: USER_ID,
          dayOfWeek: 2, // Tuesday
          startTimeLocal: "09:00",
          endTimeLocal: "17:00",
          state: AvailabilityState.available,
          priority: 0,
          validFrom: null,
          validUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          timezone: USER_TIMEZONE,
        },
      ];
      const from = new Date("2026-06-02T10:00:00Z");
      const to = new Date("2026-06-02T16:00:00Z");

      const windows = expandWeeklyRules(rules, from, to, USER_TIMEZONE);
      expect(windows).toHaveLength(1);
      expect(windows[0].start).toBe("2026-06-02T10:00:00.000Z");
      expect(windows[0].end).toBe("2026-06-02T16:00:00.000Z");
    });
  });

  describe("applyExceptions", () => {
    it("should apply an exception that fully covers a window", () => {
      const windows: AvailabilityWindow[] = [
        {
          start: "2026-06-02T13:00:00Z",
          end: "2026-06-02T17:00:00Z",
          state: AvailabilityState.available,
          label: null,
        },
      ];
      const exceptions: AvailabilityException[] = [
        {
          id: "ex1",
          userId: USER_ID,
          startsAt: new Date("2026-06-02T13:00:00Z"),
          endsAt: new Date("2026-06-02T17:00:00Z"),
          state: AvailabilityState.unavailable,
          publicLabel: "Meeting",
          privateNote: null,
          source: "manual",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const processed = applyExceptions(windows, exceptions, USER_TIMEZONE);
      expect(processed).toHaveLength(1);
      expect(processed[0].state).toBe(AvailabilityState.unavailable);
      expect(processed[0].label).toBe("Meeting");
    });

    // ... (other tests simplified similarly)
  });
});
