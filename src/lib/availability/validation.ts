import { z } from "zod";
import {
  AvailabilityState,
  CurrentStatusState,
  ExceptionSource,
} from "@prisma/client";

// Helper for time format HH:mm
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// General ID schema
export const idSchema = z.string().uuid();

// Public API Query Parameters
export const availabilityQueryParamsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

// PUT /api/v1/me/status
export const updateStatusSchema = z.object({
  state: z.nativeEnum(CurrentStatusState),
  message: z.string().max(140).nullable().optional(),
  valid_until: z.string().datetime().nullable().optional(),
});

// POST /api/v1/me/blocks
export const createBlockSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  state: z.nativeEnum(AvailabilityState),
  public_label: z.string().max(80).nullable().optional(),
  private_note: z.string().max(500).nullable().optional(),
  source: z.nativeEnum(ExceptionSource).default(ExceptionSource.manual),
});

// PUT /api/v1/me/rules
export const availabilityRuleSchema = z.object({
  day_of_week: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
  start_time: z.string().regex(timeRegex, "Invalid time format (HH:mm)"),
  end_time: z.string().regex(timeRegex, "Invalid time format (HH:mm)"),
  state: z.nativeEnum(AvailabilityState),
});

export const updateRulesSchema = z.object({
  timezone: z.string().refine((val) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: val });
      return true;
    } catch (e) {
      return false;
    }
  }, "Invalid IANA timezone"),
  rules: z.array(availabilityRuleSchema),
});

// POST /api/v1/me/api-tokens
export const createApiTokenSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).min(1),
});