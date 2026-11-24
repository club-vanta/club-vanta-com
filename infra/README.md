# Infra de club-vanta.com

Todo lo de Cloudflare que no es código del sitio se declara acá con OpenTofu (`tofu`, nunca `terraform`). Nada se configura a mano en el panel de Cloudflare.

Qué declara:

| Recurso                                 | Para qué                                                                |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `cloudflare_worker.site`                | El Worker `club-vanta-com` (solo el nombre, observability y subdominio) |
| `cloudflare_workers_custom_domain.apex` | `club-vanta.com` apunta al Worker                                       |
| `cloudflare_workers_custom_domain.www`  | `www.club-vanta.com` apunta al Worker (el sitio redirige a apex)        |

El código del Worker no vive acá: lo sube `wrangler deploy` (ver `.github/workflows/deploy.yml`). OpenTofu solo crea el Worker vacío y los dominios.

Provider: `cloudflare/cloudflare` `~> 5`, resuelto a `5.29.0` (ver `.terraform.lock.hcl`, que se commitea). Estado en S3: bucket `alter-tracker-terraform-state`, clave `club-vanta-com.tfstate`, `us-east-1`, con `use_lockfile = true`.

## Credenciales

Un solo token de Cloudflare, llamado `club-vanta-com`, sirve para Wrangler y para OpenTofu. Permisos:

- Account > Workers Scripts > Edit
- Account > Account Settings > Read
- Zone (`club-vanta.com`) > Workers Routes > Edit
- Zone > DNS > Read
- Zone > Zone > Read

Vive en `.envrc.local` (fuera de git, copiado de `.envrc.local.example`) como `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`, más `TF_VAR_cloudflare_api_token` y `TF_VAR_cloudflare_account_id` apuntando a los mismos valores. También hace falta `AWS_PROFILE` con acceso al bucket del estado.

El token que hay hoy en `.envrc.local` es un token de usuario (no de cuenta). Se verifica con la ruta de usuario:

```bash
curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  https://api.cloudflare.com/client/v4/user/tokens/verify
```

Un token de cuenta se verifica con `.../accounts/$CLOUDFLARE_ACCOUNT_ID/tokens/verify`. Si algún día lo cambiás por uno de cuenta, usá esa ruta.

## Qué había en la zona (antes de crear nada)

Registros DNS de `club-vanta.com`, mirados en modo lectura:

- A y AAAA `api-alter-tracker`: el backend, con proxy.
- CNAME `velvet`: apunta a `velvet-f1x.pages.dev`.
- AAAA `docs`: `100::` (Worker `docs`).
- En el apex: MX x2 (Proton), TXT de SPF, TXT `protonmail-verification`, tres CNAME de DKIM de Proton y el TXT `_dmarc`.

No hay A, AAAA ni CNAME en el apex ni en `www`, así que los dos dominios de Workers no chocan con nada. Los MX y TXT del correo no se tocan.

Otros Workers de la cuenta, que no se tocan: `cocktail-worker`, `docs`, `portfolio`.

## Uso

Con direnv cargado (`.envrc.local` completo):

```bash
direnv exec . bash -c 'cd infra && tofu init && tofu validate && tofu plan'
```

El devenv también trae `tf-plan` y `tf-apply`.

El plan inicial crea 3 recursos (Worker y dos dominios) y no cambia ni destruye nada existente.

## Runbook del primer despliegue

Orden pensado para no pelearse con Wrangler: OpenTofu crea el Worker vacío primero, así `wrangler deploy` sube el código a ese mismo Worker y nunca hay que importar nada. Cada paso se corre con confirmación del usuario.

1. **Secrets de GitHub, antes del primer push a `main`.** El repo es `club-vanta/club-vanta-com`. El `gh` de esta máquina elige la cuenta según el dueño del repo, así que pasá siempre `-R`. Los valores salen de `.envrc.local`, sin pegarlos en ningún lado:

   ```bash
   direnv exec . bash -c 'test -n "$CLOUDFLARE_API_TOKEN" && test -n "$CLOUDFLARE_ACCOUNT_ID"'
   direnv exec . bash -c 'gh secret set CLOUDFLARE_API_TOKEN --body "$CLOUDFLARE_API_TOKEN" -R club-vanta/club-vanta-com'
   direnv exec . bash -c 'gh secret set CLOUDFLARE_ACCOUNT_ID --body "$CLOUDFLARE_ACCOUNT_ID" -R club-vanta/club-vanta-com'
   ```

   La primera línea falla si alguna variable está vacía; no sigas si falla, porque `gh secret set` con una variable vacía guarda un secret vacío.

2. **Crear el Worker vacío bajo OpenTofu:**

   ```bash
   direnv exec . bash -c 'cd infra && tofu apply -target=cloudflare_worker.site'
   ```

3. **Subir el código a ese mismo Worker:**

   ```bash
   direnv exec . bash -c 'npm ci && npm run deploy'
   ```

4. **Crear los dos dominios:**

   ```bash
   direnv exec . bash -c 'cd infra && tofu apply'
   ```

   Si devuelve 403 al crear un dominio personalizado, el token probablemente necesita también Zone > DNS > Edit (Workers crea el registro DNS del dominio).

5. **El plan tiene que dar sin cambios:**

   ```bash
   direnv exec . bash -c 'cd infra && tofu plan'
   ```

   Si muestra diferencias en atributos que maneja Wrangler, sumalos a `lifecycle` en `cloudflare_worker.site`:

   ```hcl
   lifecycle {
     ignore_changes = [observability, subdomain]
   }
   ```

   Hoy el recurso ya fija `observability.enabled = true` y `subdomain.enabled = false`, que es lo que dice `wrangler.jsonc` (`observability.enabled`, `workers_dev: false`, `preview_urls: false`), y ya ignora `tags`: cada `wrangler deploy` agrega el tag `cf:service=club-vanta-com` (visto en el primer despliegue, 2026-11-24).

6. **Verificar en producción:**

   ```bash
   curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://www.club-vanta.com/reglas   # 301 https://club-vanta.com/reglas
   curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://club-vanta.com/             # 200, con el próximo alter o "Todavía no hay fecha"
   curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://club-vanta.com/reglas       # 200
   ```

   Los assets estáticos (`/robots.txt`, `/_astro/*`) responden 200 también en `www`: es a propósito, solo las páginas HTML redirigen.

Desde acá, cada push a `main` con CI en verde despliega solo.

### Si el Worker se creó afuera de OpenTofu

Si el Worker ya existe (por ejemplo, alguien corrió `wrangler deploy` antes del paso 2), `tofu apply` falla porque `cloudflare_worker.site` ya existe. Importalo al estado. El formato del ID es `<account_id>/<worker_id>`, según la doc del recurso (`docs/resources/worker.md` del provider, versión v5.28.1, la más cercana a la 5.29.0 que usamos):

```bash
direnv exec . bash -c 'cd infra && tofu import cloudflare_worker.site "$CLOUDFLARE_ACCOUNT_ID/<worker_id>"'
```

El `<worker_id>` es el `id` del Worker, que puede no ser igual al nombre. Buscalo con `GET /accounts/$CLOUDFLARE_ACCOUNT_ID/workers/workers` (el campo `id` del Worker `club-vanta-com`). Después seguí con el paso 4.

## Rollback

- **Código malo en producción.** Volvé a la versión anterior con `npx wrangler rollback` (con las credenciales cargadas), o redesplegá un SHA anterior: `git checkout <sha> && npm ci && npm run deploy`. Para que un push posterior no lo pise, revertí el commit en `main`.
- **Sacar el sitio del aire.** Desatá los dos dominios sin tocar el Worker:

  ```bash
  direnv exec . bash -c 'cd infra && tofu destroy -target=cloudflare_workers_custom_domain.apex -target=cloudflare_workers_custom_domain.www'
  ```

  Para volver a ponerlo, `tofu apply`. Los MX y TXT del correo no se ven afectados.
