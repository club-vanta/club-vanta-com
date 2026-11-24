terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5"
    }
  }

  backend "s3" {
    bucket = "alter-tracker-terraform-state"
    key    = "club-vanta-com.tfstate"
    region = "us-east-1"

    # Lock file in S3, no DynamoDB table needed.
    use_lockfile = true
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
