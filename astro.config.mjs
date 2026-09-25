// @ts-check
import { defineConfig, envField, sharpImageService } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

// `.env` is not in `process.env` while this file is evaluated; read it the way
// Vite will, so the config sees the same values the app does. `astro dev` is
// the only command that runs in development mode.
const mode = process.env.NODE_ENV ?? (process.argv.includes('dev') ? 'development' : 'production');
const env = loadEnv(mode, process.cwd(), '');
const magentoHost = env.PUBLIC_MAGENTO_BASE_URL && new URL(env.PUBLIC_MAGENTO_BASE_URL).hostname;

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
    /*
     * Catalogue images are re-encoded through `/_image` (see src/lib/images.ts),
     * which fetches whatever `href` it is given from the hosts allowed here.
     * Allowing only Magento's own host keeps the endpoint from being an open
     * image proxy for the rest of the internet. Without a base URL nothing is
     * allowed, rather than a guessed host.
     */
    domains: magentoHost ? [magentoHost] : [],
    /*
     * The endpoint encodes on request, so encoder speed is on the LCP path of
     * an uncached image. At sharp's default AVIF effort (4) a 720px product
     * photo took ~1.1s; effort 2 takes ~0.24s for a file ~10% larger.
     */
    service: sharpImageService({ avif: { effort: 2 } }),
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
