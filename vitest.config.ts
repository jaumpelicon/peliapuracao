import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['server/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
