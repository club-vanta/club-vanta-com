# Endpoint público de alters (alter-tracker-backend): plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que `alter-tracker-backend` guarde la portada y un extracto de cada alter, y exponga un endpoint público, sin auth y de solo lectura, con los alters de Club Vanta y de ninguna otra organización.

**Architecture:** dos columnas nuevas en `meetups` (`cover_url`, `excerpt`) que se completan desde la misma respuesta de mazmo que hoy da la fecha, al crear el meetup y al sincronizar. Un router nuevo `public` con `GET /public/alters`, sin parámetro de organización: la única organización publicada sale del setting `public_alters_org_slug` (env `PUBLIC_ALTERS_ORG_SLUG`, en producción el slug de Club Vanta). Sin el setting, el endpoint responde 404: está apagado. Así ninguna otra organización del backend multi-organización puede exponerse ni enumerarse por la URL. Devuelve la lista plana de alters, ordenada por fecha descendente, con un nombre corto derivado del título. El sitio decide cuál es el próximo.

**Tech Stack:** FastAPI, SQLModel, Alembic, httpx, pytest con PostgreSQL real, basedpyright, ruff.

**Spec:** `docs/superpowers/specs/2026-11-23-club-vanta-web-design.md` (sección "Datos"). Este plan vive en `club-vanta-com` pero se ejecuta en `../alter-tracker-backend`, en una rama nueva `feat/public-alters` creada desde `main` (no desde `feat/first-time-guests`).

## Global Constraints

- Seguir `../alter-tracker-backend/CLAUDE.md` entero: capas `routers -> schemas -> services -> models`, `async def` en rutas, `summary` y `responses` en cada ruta, errores accionables, logs con structlog después de la acción.
- **Solo ASCII** en strings, comentarios y docs del backend (regla 9 de su CLAUDE.md).
- El endpoint **nunca** devuelve `location_label`, `latitude`, `longitude`, `address`, RSVPs, invitados, pagos, `requires_payment`, `is_finalized` ni nada de staff. Tampoco se guarda `event.address` de mazmo.
- El extracto es el primer párrafo de `event.description` (HTML de mazmo, párrafos `<p>...</p>`), en texto plano, recortado a 280 caracteres como máximo en un límite de palabra, con `...` si se recortó.
- Nombre corto: regla automática, sin campo nuevo (ver Task 2).
- **Solo Club Vanta.** El endpoint no recibe organización: publica únicamente la del setting `public_alters_org_slug`. Habilitar otra organización exige cambiar la config del deploy, nunca un request.
- Antes de dar algo por terminado: `basedpyright`, `lint` y `run-tests` en verde, y `/code-review` sobre el diff.
- Regenerar `openapi.json` (`scripts/generate_openapi.py`) en el mismo PR: el sitio genera sus tipos de ahí.

## Review Focus

- **Setting sin definir, o con un slug que no existe en la base:** 404 con mensaje accionable (dice que el endpoint está apagado o que el slug configurado no existe), nunca 500 ni lista vacía silenciosa.
- **Alguien prueba pasar otra organización** (`/public/alters?org=otra`, `/public/organizations/otra/alters`): se ignora el query string y la segunda ruta no existe (404). Nunca aparece un meetup de otra organización.
- **Organización sin meetups:** 200 con `{"alters": []}`.
- **Meetup creado antes de esta migración sin backfill:** `cover_url` y `excerpt` en `null`; el endpoint responde igual.
- **Descripción de mazmo vacía, sin `<p>`, o con solo `<br>` y espacios:** `excerpt` es `null`, no `""`.
- **Mazmo caído durante la sincronización:** el sync de RSVPs no falla por no poder refrescar portada y extracto; se conserva lo guardado.

---

### Task 1: Portada y extracto en el modelo y desde mazmo

**Files:**
- Modify: `app/models/models.py` (clase `Meetup`)
- Create: `alembic/versions/0026_meetup_cover_excerpt.py`
- Modify: `app/services/mazmo.py` (reemplaza `fetch_meetup_date`)
- Create: `app/services/mazmo_event.py` (parseo puro del evento)
- Modify: `app/routers/meetups.py` (creación de meetup)
- Modify: `app/services/sync.py` (refresco en el sync)
- Test: `tests/test_mazmo_event.py`, `tests/test_meetups.py`, `tests/test_sync_service.py`

**Interfaces:**
- Produces: `Meetup.cover_url: str | None` (max 512), `Meetup.excerpt: str | None` (max 320).
- Produces: `class MazmoEventDetails(NamedTuple): date: datetime; cover_url: str | None; excerpt: str | None` en `app/services/mazmo_event.py`.
- Produces: `def parse_event_details(event: RawEventData) -> MazmoEventDetails` y `def excerpt_from_description(html: str | None, max_len: int = 280) -> str | None`.
- Produces: `MazmoClient.fetch_event_details(mazmo_url: str) -> MazmoEventDetails` (mismos errores que hoy: `MazmoNetworkError`, `MazmoAPIError`). Se borra `fetch_meetup_date`: no queda código muerto.
- `RawEventData` (TypedDict en `mazmo.py`) suma `cover: NotRequired[str]` y `description: NotRequired[str]`.

- [ ] **Step 1: Tests de parseo**

En `tests/test_mazmo_event.py`:
- `test_excerpt_takes_first_paragraph_as_plain_text`: `"<p>Recuperaremos las raíces, un Alter para venir a charlar. </p><p>Otro.</p>"` -> `"Recuperaremos las raíces, un Alter para venir a charlar."` (sin espacios al final, entidades HTML decodificadas: `&amp;` -> `&`).
- `test_excerpt_strips_inline_tags`: `"<p>Hola <strong>bellos</strong><br>vengan</p>"` -> `"Hola bellos vengan"`.
- `test_excerpt_truncates_at_word_boundary`: párrafo de 400 caracteres -> largo <= 283, termina en `"..."`, no corta una palabra.
- `test_excerpt_skips_empty_paragraphs`: `"<p> </p><p><br></p><p>Texto</p>"` -> `"Texto"`.
- `test_excerpt_returns_none_for_empty_or_missing`: `None`, `""`, `"<p></p>"` -> `None`.
- `test_excerpt_without_paragraph_tags_uses_text_up_to_first_newline`: `"Linea uno\nLinea dos"` -> `"Linea uno"`.
- `test_parse_event_details_reads_date_cover_and_excerpt`: `{"date": "2026-11-19T23:30:00.000Z", "cover": "https://prod.mazmocdn.com/events/covers/wWYdwivkD.jpeg", "description": "<p>Hola</p>"}` -> `date == datetime(2026, 11, 19, 23, 30, tzinfo=UTC)`, `cover_url` igual, `excerpt == "Hola"`.
- `test_parse_event_details_tolerates_missing_cover`: sin `cover` -> `cover_url is None`.

- [ ] **Step 2: Correr y ver que fallan**

Run: `pytest tests/test_mazmo_event.py -v`
Expected: FAIL, `ModuleNotFoundError: No module named 'app.services.mazmo_event'`.

- [ ] **Step 3: Implementar `app/services/mazmo_event.py`**

Parseo con `html.parser.HTMLParser` de la stdlib (sin dependencias nuevas): juntar texto por párrafo `<p>`, tratar `<br>` como espacio, colapsar espacios, quedarse con el primero no vacío. Si no hay `<p>`, usar el texto hasta el primer salto de línea. `html.unescape` ya lo hace `HTMLParser` con `convert_charrefs=True`.

- [ ] **Step 4: Correr y ver que pasan**

Run: `pytest tests/test_mazmo_event.py -v`
Expected: PASS.

- [ ] **Step 5: Columnas y migración**

Sumar a `Meetup`: `cover_url: str | None = Field(default=None, max_length=512)` y `excerpt: str | None = Field(default=None, max_length=320)`. Migración `0026_meetup_cover_excerpt.py` a mano (no autogenerate a ciegas), `down_revision` = la revisión de `0025_meetup_weather_before.py`, `downgrade` que borra las dos columnas. Sin backfill en la migración: la red no se toca desde Alembic (el backfill es la Task 4).

- [ ] **Step 6: Tests de creación y sync**

En `tests/test_meetups.py`, siguiendo cómo hoy se parchea `app.routers.meetups.MazmoClient`:
- `test_create_meetup_stores_cover_and_excerpt_from_mazmo`: el mock de `fetch_event_details` devuelve `MazmoEventDetails(date, "https://prod.mazmocdn.com/events/covers/x.jpeg", "Hola")`; la respuesta 201 y la fila en DB tienen esos valores.
- Ajustar los tests existentes que mockean `fetch_meetup_date` para que mockeen `fetch_event_details`.

En `tests/test_sync_service.py`:
- `test_sync_refreshes_cover_and_excerpt`: meetup con `cover_url=None`; tras el sync quedan los valores del mock.
- `test_sync_keeps_cover_when_event_details_fail`: `fetch_event_details` lanza `MazmoNetworkError`; el sync de RSVPs termina bien y `cover_url` queda como estaba.

- [ ] **Step 7: Correr y ver que fallan**

Run: `pytest tests/test_meetups.py tests/test_sync_service.py -v`
Expected: FAIL en los tests nuevos (`AttributeError` o valores `None`).

- [ ] **Step 8: Implementar**

`MazmoClient.fetch_event_details` hace el mismo GET que hacía `fetch_meetup_date` y delega en `parse_event_details`. En `create_meetup`, setear `date`, `cover_url` y `excerpt` desde el resultado. En `SyncService.sync`, después del upsert de RSVPs, pedir `fetch_event_details` y actualizar `cover_url`, `excerpt` y `date` (la fecha puede cambiar en mazmo) en el mismo commit; si falla con `MazmoNetworkError` o `MazmoAPIError`, loguear `warning` y seguir. Mantener el error de sync original para fallas de RSVPs.

- [ ] **Step 9: Correr todo**

Run: `basedpyright && lint && run-tests`
Expected: sin errores, todos los tests en verde.

- [ ] **Step 10: Commit**

```bash
git add app alembic tests
git commit -m "feat: store mazmo cover and excerpt on meetups"
```

### Task 2: Nombre corto derivado del título

**Files:**
- Create: `app/services/short_name.py`
- Test: `tests/test_short_name.py`

**Interfaces:**
- Produces: `def short_name(title: str) -> str`.

- [ ] **Step 1: Tests con los títulos reales**

`test_short_name_examples`, parametrizado:

| Título | Nombre corto |
|---|---|
| `Alter San Telmo - D I S C R E E T` | `Discreet` |
| `Alter Tan Selmo - Spring Break` | `Spring Break` |
| `Alter Tan Selmo "Secret Face"` | `Secret Face` |
| `Alter Tan Selmo “Secret Face”` | `Secret Face` |
| `Alter a la Vuelta - San Telmo` | `A la Vuelta` |
| `Alter a la Vuelta, San Telmo.` | `A la Vuelta` |
| `Alter a la Vuelta: Full Contact` | `Full Contact` |
| `Alter a la Vuelta: Nación BDSM` | `Nación BDSM` |
| `Alter Tan Selmo: Spring Break` | `Spring Break` |
| `Alter Tan Selmo` | `Tan Selmo` |
| `Open Group, Microcentro` | `Open Group` |
| `  Alter San Telmo  ` | `San Telmo` |

Y `test_short_name_never_empty`: `short_name("Alter") == "Alter"`.

- [ ] **Step 2: Correr y ver que fallan**

Run: `pytest tests/test_short_name.py -v`
Expected: FAIL, módulo inexistente.

- [ ] **Step 3: Implementar `short_name`**

Regla, en este orden:
1. `strip()` y quitar un `.` final.
2. Si hay un segmento entre comillas (`"..."` o `“...”`), ese es el nombre.
3. Partir en el primer separador entre `" - "`, `": "` y `", "`: `head` y `tail`.
4. `head` sin el prefijo `Alter ` (sin distinguir mayúsculas). Lugares conocidos: `san telmo`, `tan selmo`, `microcentro`.
5. Si hay `tail` y no es un lugar, el nombre es `tail`; si no, es `head` (sin `Alter `); si eso queda vacío, el título original.
6. Si el nombre son letras sueltas separadas por espacios (`D I S C R E E T`), juntarlas y pasar a `Title Case`.
7. Primera letra en mayúscula, el resto como venía.

- [ ] **Step 4: Correr y ver que pasan**

Run: `pytest tests/test_short_name.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/services/short_name.py tests/test_short_name.py
git commit -m "feat: derive short alter names from meetup titles"
```

### Task 3: Endpoint `GET /public/alters` (solo Club Vanta)

**Files:**
- Modify: `app/core/config.py` (setting nuevo)
- Modify: `.env.example` si existe, y la config de producción que lee `scripts/deploy.sh` / `infra/` (donde hoy se definen las otras env vars del contenedor)
- Create: `app/schemas/public.py` (y re-export en `app/schemas/__init__.py`)
- Create: `app/services/public_alters.py`
- Create: `app/routers/public.py`
- Create: `app/openapi_examples/public_examples.py`
- Modify: `app/main.py` (`include_router`)
- Modify: `openapi.json` (regenerado)
- Test: `tests/test_public_alters.py`

**Interfaces:**
- Consumes: `short_name(title)` (Task 2), `Meetup.cover_url`, `Meetup.excerpt` (Task 1).
- Produces (contrato con el sitio, no cambiar nombres):

```python
class PublicAlter(SQLModel):
    model_config = ConfigDict(from_attributes=True)
    short_name: str
    title: str
    date: datetime
    mazmo_url: str
    cover_url: str | None
    excerpt: str | None

class PublicAltersResponse(SQLModel):
    alters: list[PublicAlter]
```

- Produces: `Settings.public_alters_org_slug: str | None = None` (env `PUBLIC_ALTERS_ORG_SLUG`).
- Produces: `def list_public_alters(session: Session, org: Organization) -> list[PublicAlter]` en el service, ordenado por `date` descendente.
- Ruta: `GET /public/alters`, sin parámetros, sin dependencia de auth, `settings: Settings = Depends(get_settings)` (overrideable en tests), `tags=["public"]`, `response_model=PublicAltersResponse`, respuesta con header `Cache-Control: public, max-age=300`.

- [ ] **Step 1: Tests**

En `tests/test_public_alters.py`, con `make_org` y `make_meetup` (sumar `cover_url` y `excerpt` como kwargs opcionales a `make_meetup`). Un fixture `public_settings` hace `app.dependency_overrides[get_settings]` con `public_alters_org_slug="club-vanta"` y crea esa org.
- `test_public_alters_returns_200_without_auth`: sin headers, 200.
- `test_public_alters_lists_only_configured_org`: org configurada y otra org, un meetup cada una; solo aparece el de la configurada.
- `test_public_alters_ignores_org_in_query_string`: `GET /public/alters?org=otra-org&slug=otra-org` devuelve lo mismo que sin query (solo la configurada).
- `test_public_alters_has_no_per_org_route`: `GET /public/organizations/otra-org/alters` -> 404.
- `test_public_alters_returns_404_when_setting_unset`: `public_alters_org_slug=None` -> 404, detail empieza con `"Cannot list alters:"` y dice que `PUBLIC_ALTERS_ORG_SLUG` no está definido.
- `test_public_alters_orders_by_date_desc`: tres meetups; fechas en orden descendente.
- `test_public_alters_shape_has_exactly_public_fields`: el set de claves de cada alter es exactamente `{"short_name", "title", "date", "mazmo_url", "cover_url", "excerpt"}`; un meetup con `location_label="Chile 419"`, `latitude` y `longitude` no filtra esos valores en ningún lado del body (`"Chile 419" not in resp.text`).
- `test_public_alters_short_name_from_title`: meetup `"Alter San Telmo - D I S C R E E T"` -> `short_name == "Discreet"`, `title` intacto.
- `test_public_alters_returns_404_when_configured_slug_missing`: setting `"no-existe"` sin org en la base -> 404, detail empieza con `"Cannot list alters:"` y nombra el slug configurado.
- `test_public_alters_returns_empty_list_for_org_without_meetups`: `{"alters": []}`.
- `test_public_alters_null_cover_and_excerpt`: meetup sin portada ni extracto -> ambos `null`.
- `test_public_alters_sets_cache_control`: header `cache-control == "public, max-age=300"`.

- [ ] **Step 2: Correr y ver que fallan**

Run: `pytest tests/test_public_alters.py -v`
Expected: FAIL con 404 en todas las rutas (router inexistente).

- [ ] **Step 3: Implementar setting, schema, service, router y ejemplos**

El router resuelve la org con `select(Organization).where(Organization.slug == settings.public_alters_org_slug)`; la búsqueda por slug vive en un helper privado del router, como `_get_thing_or_404`. Docstring del router con la línea de ruta, como el resto. El 404 usa el helper de errores de `_error_responses.py` y `merge_error_responses` si hay más de uno. Ejemplo de respuesta en `public_examples.py` con los datos de Discreet.

- [ ] **Step 4: Correr y ver que pasan**

Run: `pytest tests/test_public_alters.py -v`
Expected: PASS.

- [ ] **Step 5: Regenerar OpenAPI y correr todo**

Run: `python scripts/generate_openapi.py && basedpyright && lint && run-tests`
Expected: `openapi.json` incluye `/public/alters` y `PublicAltersResponse`; todo en verde.

- [ ] **Step 6: Commit**

```bash
git add app tests openapi.json
git commit -m "feat: add public read-only alters endpoint"
```

### Task 4: Backfill de portadas y extractos

**Files:**
- Create: `scripts/backfill_meetup_event_details.py`
- Test: `tests/test_backfill_meetup_event_details.py`
- Modify: `README.md` (cómo correrlo en producción)

**Interfaces:**
- Consumes: `MazmoClient.fetch_event_details` (Task 1).
- Produces: `async def backfill(session: Session, settings: Settings) -> BackfillResult` con `class BackfillResult(NamedTuple): updated: int; failed: int`, y un `main()` que lo corre con la sesión real, igual que `scripts/seed_admin.py`.

- [ ] **Step 1: Tests**

- `test_backfill_fills_missing_cover_and_excerpt`: dos meetups sin portada; mock de `MazmoClient` (parcheado en `scripts.backfill_meetup_event_details.MazmoClient`); quedan completos, `updated == 2`.
- `test_backfill_skips_meetups_that_already_have_cover`: no llama a mazmo para esos.
- `test_backfill_counts_failures_and_continues`: un meetup falla con `MazmoAPIError`, el otro se completa; `failed == 1`, `updated == 1`.

- [ ] **Step 2: Correr y ver que fallan**

Run: `pytest tests/test_backfill_meetup_event_details.py -v`
Expected: FAIL, módulo inexistente.

- [ ] **Step 3: Implementar**

Un commit por meetup actualizado (si uno falla, los anteriores quedan). Log de cada fallo con `meetup_id` y el error.

- [ ] **Step 4: Correr todo**

Run: `basedpyright && lint && run-tests`
Expected: todo en verde.

- [ ] **Step 5: Documentar y commit**

En `README.md`, una sección corta: correrlo una vez después del deploy de esta versión, con el mismo mecanismo que `seed_admin`, y qué significa `failed > 0` (volver a correrlo; es idempotente).

```bash
git add scripts tests README.md
git commit -m "feat: add backfill script for meetup cover and excerpt"
```

### Task 5: Cierre

- [ ] **Step 1:** Confirmar en la base de producción el `slug` real de Club Vanta (`SELECT name, slug FROM organizations;`, de solo lectura), definir `PUBLIC_ALTERS_ORG_SLUG` con ese valor en la config de producción del backend, y anotarlo en `club-vanta-com/docs/decisiones.md`.
- [ ] **Step 2:** Correr `/code-review` sobre el diff, corregir hallazgos reales, y abrir el PR contra `main` en `club-vanta/alter-tracker-backend` (con confirmación del usuario antes de pushear).
- [ ] **Step 3:** Después del merge y el deploy: correr el backfill y verificar con `curl https://api-alter-tracker.club-vanta.com/public/alters` que Discreet trae `cover_url` y `excerpt`, y que no aparece ningún meetup de otra organización.
