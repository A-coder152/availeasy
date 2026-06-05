// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock date-fns-tz to behave as identity functions for tests
vi.mock('date-fns-tz', () => {
  return {
    zonedTimeToUtc: (date: string | Date) => {
        return new Date(date);
    },
    utcToZonedTime: (date: Date) => date,
    formatInTimeZone: (date: Date, _timezone: string, formatStr: string) => {
      // Very basic formatting: just return the ISO string
      return date.toISOString();
    },
  };
});
