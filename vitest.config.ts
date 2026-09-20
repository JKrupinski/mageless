import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const resolvePath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@lib': resolvePath('./src/lib'),
      '@ui': resolvePath('./src/components/ui'),
      '@': resolvePath('./src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      /*
       * Coverage is measured over the layer unit tests own: pure logic, view
       * models and interactive components. The modules that only exist to talk
       * to Magento, valkey or the cookie jar (`lib/graphql`, `lib/cache`,
       * `lib/cart/server.ts`, `lib/cart/api.ts`) are covered end to end by the
       * Playwright suite, where they run against a real backend — unit-testing
       * them would mean asserting against mocks of Magento's own behaviour.
       */
      include: [
        'src/lib/format.ts',
        'src/lib/catalog.ts',
        'src/lib/seo/**/*.ts',
        'src/lib/stores/**/*.ts',
        'src/lib/viewmodels/**/*.ts',
        'src/lib/cart/schemas.ts',
        'src/components/product/AddToCartForm.tsx',
        'src/components/ui/*.tsx',
      ],
      exclude: ['**/*.stories.tsx'],
      thresholds: {
        // A floor a little below what the suite currently reaches, so a real
        // regression fails the build without every refactor tripping it.
        statements: 85,
        branches: 65,
        functions: 80,
        lines: 85,
      },
    },
  },
});
