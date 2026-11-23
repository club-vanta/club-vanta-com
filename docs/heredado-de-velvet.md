# Qué tomamos de Velvet

Revisión de `../velvet` (CLAUDE.md, README, `cypress/README.md`, CI, devenv, hooks, infra) hecha el 2026-11-23. Separa lo que se copia, lo que se adapta y lo que no aplica a un sitio de dos páginas en Astro.

## Se copia tal cual

| Qué | De dónde en Velvet | Nota |
|---|---|---|
| Entorno con devenv + direnv | `devenv.nix`, `devenv.yaml`, `.envrc` | `nodejs_24`, `pre-commit`, `languages.opentofu`, y los scripts `tf-plan` / `tf-apply` (`cd infra && tofu ...`). Coincide con la regla de no instalar herramientas a mano. |
| Prettier | `.prettierrc` | `semi`, comillas dobles, `trailingComma: all`, 80 columnas, 2 espacios. Para `.astro` hace falta `prettier-plugin-astro`. |
| Hooks de pre-commit | `.pre-commit-config.yaml` | Typecheck, Prettier y ESLint en cada commit; build y tests en el push (`default_install_hook_types: [pre-commit, pre-push]`, `language: system`). |
| Nombres de scripts npm | `package.json` | `dev`, `build`, `preview`, `typecheck`, `lint`, `format`, `format:check`, `check` (typecheck + prettier + eslint), `test`, `test:run`. Mismos nombres, así el equipo no piensa. |
| Job `check` de CI | `.github/workflows/ci.yml` | Node 24 con caché de npm, `npm ci`, typecheck, lint, format check, build y tests unitarios. |
| Layout de `infra/` | `infra/providers.tf`, `variables.tf`, `cloudflare.tf`, `terraform.tfvars.example` | Provider `cloudflare ~> 5`, zona como `data "cloudflare_zone"`, registros `proxied = true`. Ignorar en git `infra/terraform.tfvars`, `infra/.terraform/`, `infra/*.tfstate*`. |
| Regla "senior-PR quality bar" | `CLAUDE.md` | Seguir patrones, modular, sin código muerto, tests para la lógica nueva, correr todo lo de CI antes de decir "listo", y `/code-review` antes del PR. |
| Specs y planes | `docs/superpowers/specs/`, `docs/superpowers/plans/` | Misma convención de nombres con fecha. Ya la usamos. |
| Plugins de Claude | `.claude/settings.json` | Mismo grupo frontend. Ya está. |

## Se adapta

- **Tipos de la API generados, nunca a mano.** Velvet corre `openapi-typescript` contra el `openapi.json` del backend en GitHub (`npm run generate:api`). Acá igual, pero solo hace falta el endpoint público.
- **Smoke contra el backend real, con la misma rama.** El job `smoke` de Velvet clona `alter-tracker-backend` en la rama con el mismo nombre (o `main`), levanta Postgres y uvicorn, y corre las pruebas. Sirve acá porque el sitio depende de un endpoint nuevo del backend: un cambio que toca los dos repos se prueba junto.
- **Tests de punta a punta con la API simulada.** Velvet usa `cy.intercept`, que intercepta pedidos del navegador. En este sitio el pedido al backend lo hace el servidor (Astro en Cloudflare), así que `cy.intercept` no lo ve: hace falta un backend falso (un servidor chico con fixtures) al que apunte el sitio en modo test. Herramienta: Cypress como Velvet o Playwright; a decidir en el plan.
- **Vitest para lógica pura.** Elegir el próximo alter, el margen para "ya pasó" y formatear la fecha van en funciones con tests unitarios.
- **Zona horaria.** Velvet corre los tests con `TZ=UTC` porque sus fixtures están en UTC. Acá además el servidor corre en UTC (Cloudflare) y las fechas se muestran en Buenos Aires: formatear siempre con `timeZone: "America/Argentina/Buenos_Aires"` y testear con `TZ=UTC`, si no un alter del jueves 20.30 puede aparecer como viernes.
- **Accesibilidad.** Velvet usa `eslint-plugin-jsx-a11y` y `cypress-axe`, y pide jerarquía de títulos correcta, anillos `focus-visible` y contraste 4.5:1 en texto chico. Para Astro: `eslint-plugin-astro` con sus reglas de a11y, y axe en los tests de punta a punta.
- **Celulares primero.** Velvet revisa todo a 375 px. Acá igual: los mocks son de escritorio y el responsive se diseña en el plan.
- **Estado de OpenTofu.** Velvet no declara backend remoto (estado local). Este repo usa el bucket S3 del backend con una key propia (ver el diseño).

## No aplica

- React, React Compiler, TanStack Query, shadcn/ui y su tema (es el tema por defecto, justo lo que evitamos).
- Las capas `app → features → domain` con `no-restricted-imports`: sobran para dos páginas.
- i18n en inglés y español: el sitio es solo en español.
- Cypress partido en varios jobs, `cypress-split`, merge de coverage: sobra para este tamaño.
- `searchText`, `sortNames`, factories de invitados: no hay listas de personas.

## Dato a tener en cuenta

El README de Velvet enlaza `docs.club-vanta.com` (documentación de usuario). Antes de tocar DNS del apex `club-vanta.com`, ver qué registros existen, incluido ese subdominio y el correo `infra-alerts@club-vanta.com`.
