# CLAUDE.md - club-vanta.com

Public website of Club Vanta, served at `club-vanta.com`. The project is in the design phase: there is no code yet.

## Rule: keep the context in this repo

Everything we decide, build, or learn that gives context goes into this file or into `docs/`:

- `docs/contexto.md`: who Club Vanta is, what an alter is, the club's voice, and sources.
- `docs/decisiones.md`: decision log, newest last, with the reason for each decision.
- `docs/reglas-v0.2.md`: the rules document, transcribed from the source PDF.
- `docs/heredado-de-velvet.md`: setup, tooling, CI and practices taken from `../velvet`, and what does not apply.
- `docs/superpowers/specs/2026-11-23-club-vanta-web-design.md`: the approved design.

When a conversation settles something, update the matching file in the same turn.

## What Club Vanta is

A small, non-profit social club that organizes alters (social meetups in bars) for people on mazmo.net, a Spanish-language BDSM social network. Profile on mazmo: `@ClubVanta`. The same team builds Velvet (`velvet.club-vanta.com`, repo `../velvet`), an internal, open-source staff tool for alters used by several mazmo organizations. Velvet is not public; the site may mention it but must not present it as something visitors can use.

## Hard rules for the site

- **Privacy first.** Never show attendee names, attendee counts tied to people, or photos of attendees. The rules ban doxxing and photos, and there is a discreet attendee list for people who must not be exposed.
- **No em dashes** in copy, code, or docs.
- **Avoid the generic AI look.** See "Design direction" in `docs/decisiones.md`.
- **All Cloudflare infrastructure is declared in OpenTofu** (`tofu`, not `terraform`) under `infra/`. Never configure anything by hand in the Cloudflare UI. Follow the pattern in `../velvet/infra/`.
- Copy is in Rioplatense Spanish (voseo), in the club's own voice. See `docs/contexto.md`.
