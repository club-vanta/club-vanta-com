data "cloudflare_zone" "club_vanta" {
  filter = {
    account_id = var.cloudflare_account_id
    name       = var.cloudflare_domain
  }
}

# The Worker itself: only the name. The code, bindings, vars and compatibility
# settings come from wrangler.jsonc and are deployed with `wrangler deploy`
# (see .github/workflows/deploy.yml), so OpenTofu must not manage them.
resource "cloudflare_worker" "site" {
  account_id = var.cloudflare_account_id
  name       = "club-vanta-com"

  # Mirror wrangler.jsonc (observability.enabled = true, workers_dev = false,
  # preview_urls = false) so that `wrangler deploy` and OpenTofu agree.
  observability = {
    enabled = true
  }
  subdomain = {
    enabled          = false
    previews_enabled = false
  }
}

# `service` takes the Worker name, which must match `name` in wrangler.jsonc.
resource "cloudflare_workers_custom_domain" "apex" {
  account_id = var.cloudflare_account_id
  zone_id    = data.cloudflare_zone.club_vanta.id
  hostname   = var.cloudflare_domain
  service    = cloudflare_worker.site.name
}

resource "cloudflare_workers_custom_domain" "www" {
  account_id = var.cloudflare_account_id
  zone_id    = data.cloudflare_zone.club_vanta.id
  hostname   = "www.${var.cloudflare_domain}"
  service    = cloudflare_worker.site.name
}
