import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";

export default [
  {
    ignores: [
      "src/api/types.ts",
      "dist/",
      ".astro/",
      ".wrangler/",
      "node_modules/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs["jsx-a11y-strict"],
  {
    // The fake backend for e2e tests runs on Node.
    files: ["e2e/**/*.mjs"],
    languageOptions: {
      globals: {
        URL: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
  },
  {
    // Pages run on Workers, where the Cache API is a global.
    files: ["src/**/*.astro"],
    languageOptions: { globals: { caches: "readonly" } },
  },
];
