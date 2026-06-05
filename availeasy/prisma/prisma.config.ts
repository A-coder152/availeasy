import { defineConfig } from 'prisma';
import 'dotenv/config';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
