import { defineConfig } from 'prisma';

export default defineConfig({
  datasource: {
    url: 'file:./dev.db',
  },
});
