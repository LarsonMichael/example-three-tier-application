# One-off Cloud Run Job that runs database migrations.
# Execute manually or as part of a CI/CD pipeline before deploying the API:
#   gcloud run jobs execute <job-name> --region <region>

variable "db_image" {
  description = "Container image for the db migration job (e.g. gcr.io/PROJECT/db:TAG)"
  type        = string
}

resource "google_cloud_run_v2_job" "migrate" {
  name     = "${local.name_prefix}-migrate"
  location = var.region

  template {
    template {
      service_account = google_service_account.cloud_run.email

      max_retries = 3

      vpc_access {
        connector = google_vpc_access_connector.main.id
        egress    = "ALL_TRAFFIC"
      }

      containers {
        image = var.db_image

        env {
          name = "DATABASE_URL"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.db_url.secret_id
              version = "latest"
            }
          }
        }

        env {
          name  = "LOG_LEVEL"
          value = var.log_level
        }

        resources {
          limits = {
            cpu    = "1"
            memory = "256Mi"
          }
        }
      }
    }
  }
}
