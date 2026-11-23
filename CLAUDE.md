# CLAUDE.md - club-vanta.com

Public website of Club Vanta, served at `club-vanta.com`. The site is built (Astro 6 on Cloudflare Workers) and waits for its first deploy.

## Rule: keep the context in this repo

Everything we decide, build, or learn that gives context goes into this file or into `docs/`:

- `docs/contexto.md`: who Club Vanta is, what an alter is, the club's voice, and sources.
- `docs/decisiones.md`: decision log, newest last, with the reason for each decision.
- `docs/reglas-v0.2.md`: the rules document, transcribed from the source PDF.
- `docs/heredado-de-velvet.md`: setup, tooling, CI and practices taken from `../velvet`, and what does not apply.
- `docs/superpowers/specs/2026-11-23-club-vanta-web-design.md`: the approved design.
- `docs/superpowers/plans/2026-11-23-backend-endpoint-publico.md`: plan for the public alters endpoint, executed in `../alter-tracker-backend`. Runs first.
- `docs/superpowers/plans/2026-11-23-sitio.md`: plan for the site and its infra in this repo.

When a conversation settles something, update the matching file in the same turn.

## What Club Vanta is

A small, non-profit social club that organizes alters (social meetups in bars) for people on mazmo.net, a Spanish-language BDSM social network. Profile on mazmo: `@ClubVanta`. The same team builds Velvet (`velvet.club-vanta.com`, repo `../velvet`), an internal, open-source staff tool for alters used by several mazmo organizations. Velvet is not public; the site may mention it but must not present it as something visitors can use.

## Hard rules for the site

- **Privacy first.** Never show attendee names, attendee counts tied to people, or photos of attendees. The rules ban doxxing and photos, and there is a discreet attendee list for people who must not be exposed.
- **No em dashes** in copy, code, or docs.
- **Avoid the generic AI look.** See "Design direction" in `docs/decisiones.md`.
- **All Cloudflare infrastructure is declared in OpenTofu** (`tofu`, not `terraform`) under `infra/`. Never configure anything by hand in the Cloudflare UI. Follow the pattern in `../velvet/infra/`.
- Copy is in Rioplatense Spanish (voseo), in the club's own voice. See `docs/contexto.md`.

## Running it

Everything runs through devenv + direnv (Node 24, OpenTofu, Nix-built Chromium for Playwright). Prefix commands with `direnv exec .` outside an interactive shell. `.envrc.local` holds the Cloudflare token and AWS profile: never print or commit it.

- `npm run dev`: dev server. `npm run build` + `npm run preview`: production build served by workerd.
- `npm run check` (typecheck, prettier, eslint), `npm run test:run` (Vitest), `npm run test:e2e` (builds with `CLOUDFLARE_ENV=e2e`, then Playwright at 1280 and 375 px with axe). Run all four plus `npm run build` before committing.
- `npm run generate:api`: regenerates `src/api/types.ts` from the backend `openapi.json`. Do not edit that file by hand.

## Where things live

- `src/pages/index.astro` (home, server-rendered, reads alters) and `src/pages/reglas.astro` (also server-rendered because of `output: "server"`; static text of `docs/reglas-v0.2.md`).
- `src/components/`: one file per section. `src/layouts/Base.astro`: head, fonts, the script that removes broken cover images.
- `src/lib/`: `alters.ts` (pick next and past alters, format dates), `get-alters.ts` and `snapshot-cache.ts` (fetch with timeout, cache fallback), `www-redirect.ts` (used by `src/middleware.ts`).
- `src/styles/tokens.css`: the only place where colors and scale values are written. `tests/anti-ai-look.test.ts` enforces it.
- `e2e/`: specs, `fake-backend.mjs` and `fixtures.mjs` (scenarios: with-next, no-next, down, slow, and more).
- `public/`: logo SVGs, favicon, `robots.txt` (indexing allowed).
- `wrangler.jsonc`: Worker config. `ALTERS_API_URL` points to the real backend; the `e2e` environment points to the fake one.
- `infra/`: OpenTofu for the Worker and domains. Runbook, credentials and rollback in `infra/README.md`. `.github/workflows/`: `ci.yml` and `deploy.yml` (deploys after CI passes on `main`).
- `README.md`: the Spanish overview for the team.
