import { defineConfig } from 'vitest/config';

// Vitest tests only the real store/actions; E2E tests belong to Playwright.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./tests/unit/setup.ts'],
    clearMocks: true,
    isolate: true,
    reporters: ['default', 'junit'],
    outputFile: { junit: 'test-results/vitest-results.xml' },
  },
});
