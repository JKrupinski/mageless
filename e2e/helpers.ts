import type { Page } from '@playwright/test';

/**
 * Wait until a named React island has hydrated.
 *
 * Astro marks a server-rendered island with an `ssr` attribute and removes it
 * once hydration finishes. Playwright's auto-waiting only knows about DOM
 * visibility, so without this a click can land on markup whose event handlers
 * are not attached yet — the exact race a real shopper on a slow connection
 * hits, and the reason the forms below stay usable without JavaScript.
 */
export async function waitForIsland(page: Page, componentName: string): Promise<void> {
  await page.waitForFunction(
    (name) =>
      Array.from(document.querySelectorAll('astro-island')).some(
        (island) =>
          island.getAttribute('opts')?.includes(`"${name}"`) && !island.hasAttribute('ssr'),
      ),
    componentName,
    { timeout: 15_000 },
  );
}
