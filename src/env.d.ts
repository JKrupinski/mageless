/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Resolved once per request in middleware, reused by layouts. */
    storeCode: string;
    /** Set by routes whose response must never be cached by a proxy. */
    noStore?: boolean;
  }
}
