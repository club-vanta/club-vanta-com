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

Orden pensado para no pelearse con Wrangler. Cada paso se corre con confirmación del usuario.

1. **Aplicar.** `tofu apply` crea el Worker y los dos dominios. Si Cloudflare no deja asociar el dominio a un Worker que todavía no tiene deployment, hacé primero el paso 2 y volvé a aplicar.
2. **Primer deploy.** `npm ci && npm run build && npx wrangler deploy` con `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` cargados. Desde acá, cada push a `main` con CI en verde despliega solo.
3. **Secrets de GitHub.** Se cargan desde `.envrc.local`, sin pegar el valor en ningún lado:

   ```bash
   gh secret set CLOUDFLARE_API_TOKEN --body "$CLOUDFLARE_API_TOKEN"
   gh secret set CLOUDFLARE_ACCOUNT_ID --body "$CLOUDFLARE_ACCOUNT_ID"
   ```

4. **Plan de nuevo** después del primer `wrangler deploy`. Tiene que dar sin cambios. Si muestra diferencias en atributos que maneja Wrangler, sumalos a `lifecycle` en `cloudflare_worker.site`:

   ```hcl
   lifecycle {
     ignore_changes = [observability, subdomain]
   }
   ```

   Hoy el recurso ya fija `observability.enabled = true` y `subdomain.enabled = false`, que es lo que dice `wrangler.jsonc` (`observability.enabled`, `workers_dev: false`, `preview_urls: false`), así que el `ignore_changes` es solo el plan B.

5. **Verificar en producción:**

   ```bash
   curl -sI https://www.club-vanta.com/reglas   # 301 a https://club-vanta.com/reglas
   curl -sI https://club-vanta.com/             # 200, con el próximo alter o "Todavía no hay fecha"
   curl -sI https://club-vanta.com/reglas       # 200
   ```
