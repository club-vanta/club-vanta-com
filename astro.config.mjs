import { defineConfig, sessionDrivers } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  // The adapter adds a SESSION KV binding and an IMAGES binding by default.
  // The site uses neither sessions nor astro:assets, and every Cloudflare
  // resource must be declared in OpenTofu, so both are switched off.
  session: { driver: sessionDrivers.memory() },
  adapter: cloudflare({ imageService: "passthrough" }),
});
