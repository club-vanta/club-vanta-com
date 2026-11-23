# club-vanta.com

Sitio público de Club Vanta, un club social sin fines de lucro que organiza alters (encuentros en bares de San Telmo, Buenos Aires) para la comunidad de mazmo.net. Tiene la home, con el próximo alter y los pasados, y la página `/reglas`.

Está hecho con Astro 6 y corre en Cloudflare Workers. Lee la lista de alters de `GET /public/alters` del backend (`https://api-alter-tracker.club-vanta.com`) y, si el backend falla, usa la última copia guardada en la caché del Worker. Es un mejor esfuerzo: la Cache API de Workers es por centro de datos, así que una copia guardada en uno no está en los otros.

## Correrlo

Hace falta [devenv](https://devenv.sh) y direnv. Al entrar a la carpeta, direnv carga Node 24, OpenTofu y el Chromium de Playwright.

```bash
direnv allow
npm ci
npm run dev
```

Sin el endpoint publicado, la home muestra "Todavía no hay fecha".

## Scripts

| Comando                | Qué hace                                                            |
| ---------------------- | ------------------------------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo                                              |
| `npm run build`        | Build de producción para Workers                                    |
| `npm run preview`      | Sirve el build con workerd, igual que producción                    |
| `npm run deploy`       | Build de producción y `wrangler deploy`                             |
| `npm run check`        | Typecheck, formato y lint                                           |
| `npm run test:run`     | Tests unitarios (Vitest), incluido el filtro anti look de IA        |
| `npm run test:e2e`     | Build contra un backend falso y tests de Playwright a 1280 y 375 px |
| `npm run generate:api` | Regenera `src/api/types.ts` desde el `openapi.json` del backend     |

## Tests

Antes de abrir un PR: `npm run check`, `npm run test:run`, `npm run build` y `npm run test:e2e`. El e2e levanta `e2e/fake-backend.mjs` (un backend falso con escenarios: con fecha, sin fecha, caído, lento) y revisa accesibilidad con axe.

## Desplegar

Cada push a `main` pasa por CI y, si todo pasa, `.github/workflows/deploy.yml` corre `npm run deploy`. La infraestructura de Cloudflare (el Worker y los dominios `club-vanta.com` y `www.club-vanta.com`) se declara con OpenTofu en `infra/`; nunca se configura a mano en el panel. El runbook del primer despliegue, las credenciales y el rollback están en [`infra/README.md`](infra/README.md).

## Más contexto

Las decisiones y el porqué de cada una están en `docs/decisiones.md`. Quiénes son el club y su voz, en `docs/contexto.md`. El diseño aprobado, en `docs/superpowers/specs/`.
