// @ts-check
import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

/**
 * SSR-first configuration.
 *
 * Every catalogue route is rendered on the server so that the HTML Magento
 * data produces is crawlable and fast on first paint; interactivity is added
 * back through React islands (see `client:*` directives in the .astro files).
 */
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  site: process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      /*
       * Every bare dependency an island can reach, pre-bundled at startup.
       *
       * `node_modules/.vite/deps` is shared by every Vite instance in the
       * project, and `astro sync` — which the editor extension and `astro
       * check` both run — rewrites it from an SSR-only scan. Without this list
       * the running dev server has already discovered the island-only packages
       * on demand, so the sync deletes files it is still serving URLs for and
       * every island dies on a 504 "Outdated Optimize Dep". Naming them here
       * makes both scans produce the same set, so the rewrite is a no-op.
       */
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        '@nanostores/react',
        'nanostores',
        'react-hook-form',
        '@hookform/resolvers/zod',
        'zod',
        'lucide-react',
        'radix-ui',
      ],
    },
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
        '@ui': new URL('./src/components/ui', import.meta.url).pathname,
        '@lib': new URL('./src/lib', import.meta.url).pathname,
      },
    },
    build: {
      // Keep island bundles small and cacheable.
      cssCodeSplit: true,
    },
  },
  build: {
    inlineStylesheets: 'auto',
  },
  image: {
    // Magento serves catalogue media from its own domain.
    domains: ['magento.test'],
    remotePatterns: [{ protocol: 'https' }],
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  env: {
    schema: {
      PUBLIC_MAGENTO_GRAPHQL_ENDPOINT: envField.string({ context: 'client', access: 'public' }),
      PUBLIC_MAGENTO_BASE_URL: envField.string({ context: 'client', access: 'public' }),
      PUBLIC_MAGENTO_STORE_CODE: envField.string({
        context: 'client',
        access: 'public',
        default: 'default',
      }),
      PUBLIC_DEFAULT_CURRENCY: envField.string({
        context: 'client',
        access: 'public',
        default: 'USD',
      }),
      PUBLIC_SITE_URL: envField.string({
        context: 'client',
        access: 'public',
        default: 'http://localhost:4321',
      }),
      REDIS_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      REDIS_DB: envField.string({ context: 'server', access: 'secret', default: '5' }),
      GRAPHQL_CACHE_TTL: envField.string({ context: 'server', access: 'secret', default: '300' }),
      GRAPHQL_CACHE_ENABLED: envField.string({
        context: 'server',
        access: 'secret',
        default: 'true',
      }),
    },
  },
});
