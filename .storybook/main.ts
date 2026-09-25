import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const resolvePath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/**
 * `<Picture>` points at Astro's `/_image` endpoint, which Storybook does not
 * have. In development, redirect each request to the untransformed original so
 * stories still show their images — at full size and in the source format.
 */
const imageEndpointPassthrough: Plugin = {
  name: 'image-endpoint-passthrough',
  configureServer(server) {
    server.middlewares.use('/_image', (request, response) => {
      const href = new URL(request.url ?? '', 'http://storybook').searchParams.get('href');
      response.writeHead(href ? 302 : 400, href ? { Location: href } : {});
      response.end();
    });
  },
};

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  // Storybook runs its own Vite server, so the Tailwind plugin and the path
  // aliases from tsconfig have to be repeated here.
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    plugins: [...(viteConfig.plugins ?? []), tailwindcss(), imageEndpointPassthrough],
    resolve: {
      ...viteConfig.resolve,
      alias: {
        ...viteConfig.resolve?.alias,
        '@lib': resolvePath('../src/lib'),
        '@ui': resolvePath('../src/components/ui'),
        '@': resolvePath('../src'),
      },
    },
  }),
};

export default config;
