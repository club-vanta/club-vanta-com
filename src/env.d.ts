// Types for the parts of the Workers runtime the site uses. The full runtime
// types (`wrangler types`) clash with the DOM types Astro components need.

declare module "cloudflare:workers" {
  /** Vars from wrangler.jsonc (top level, or `env.e2e` in e2e builds). */
  export const env: {
    ALTERS_API_URL: string;
    ALTERS_FRESH_SECONDS: string;
  };
}

interface CacheStorage {
  /** The Workers default cache. */
  readonly default: Cache;
}
