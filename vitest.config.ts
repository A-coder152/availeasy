import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true, // Use global APIs like describe, it, expect
    env: {
      DATABASE_URL: 'file:./test.db',
    },
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/src/app/**', // Exclude Next.js pages/routes from coverage for now
        '**/src/lib/auth.ts', // NextAuth config, not unit testable directly
        '**/src/lib/db.ts', // Prisma client, not unit testable directly
      ],
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
