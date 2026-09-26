import { expect, type Locator, type Page } from '@playwright/test';

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

/**
 * Wait until an image has loaded, then check the browser took it from the
 * image endpoint. Chromium supports AVIF, so it must pick the first `<source>`
 * rather than the JPEG fallback or Magento's original.
 */
export async function expectReencodedImage(image: Locator): Promise<void> {
  await expect
    .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBeGreaterThan(0);

  const chosen = await image.evaluate((element: HTMLImageElement) => element.currentSrc);
  expect(chosen).toContain('/_image?');
  expect(chosen).toContain('f=avif');
}
