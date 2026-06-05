import {
  AvailabilityException,
  AvailabilityRule,
  AvailabilityState,
  CurrentStatusState,
  User,
} from "@prisma/client";

export type AvailabilityWindow = {
  start: string; // ISO 8601 string (UTC)
  end: string; // ISO 8601 string (UTC)
  state: AvailabilityState;
  label: string | null;
};

export type AvailabilityResponse = {
  user: {
    handle: string;
    timezone: string;
  };
  status: PublicStatusResponse["status"];
  windows: AvailabilityWindow[];
  updated_at: string; // ISO 8601 string (UTC)
};

export type PublicStatusResponse = {
  user: {
    handle: string;
    timezone: string;
  };
  status: {
    state: CurrentStatusState;
    message: string | null;
    valid_until: string | null; // ISO 8601 string (UTC)
  };
  updated_at: string; // ISO 8601 string (UTC)
};

// Extend Prisma types for easier use
export type UserWithRules = User & {
  AvailabilityRule: AvailabilityRule[];
};

export type UserWithExceptions = User & {
  AvailabilityException: AvailabilityException[];
};

export type UserWithCurrentStatus = User & {
  CurrentStatus: {
    state: CurrentStatusState;
    message: string | null;
    validUntil: Date | null;
  } | null;
};

export type UserAvailabilityData = User & {
  AvailabilityRule: AvailabilityRule[];
  AvailabilityException: AvailabilityException[];
  CurrentStatus: {
    state: CurrentStatusState;
    message: string | null;
    validUntil: Date | null;
  } | null;
};
