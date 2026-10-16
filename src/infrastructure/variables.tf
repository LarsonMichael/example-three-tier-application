variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for all resources"
  type        = string
  default     = "us-central1"
}

variable "app_name" {
  description = "Application name used as a prefix for resource names"
  type        = string
  default     = "todo"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod"
  }
}

variable "log_level" {
  description = "Log level for all services (debug, info, warn, error)"
  type        = string
  default     = "info"

  validation {
    condition     = contains(["debug", "info", "warn", "error"], var.log_level)
    error_message = "log_level must be one of: debug, info, warn, error"
  }
}

variable "subnet_cidr" {
  description = "CIDR range for the main subnet"
  type        = string
  default     = "10.0.0.0/24"
}

variable "connector_cidr" {
  description = "CIDR range for the VPC Access Connector (must be /28, not overlapping subnet_cidr)"
  type        = string
  default     = "10.0.1.0/28"
}

variable "db_tier" {
  description = "Cloud SQL machine tier"
  type        = string
  default     = "db-f1-micro"
}

variable "api_image" {
  description = "Container image for the API service (e.g. gcr.io/PROJECT/api:TAG)"
  type        = string
}

variable "web_image" {
  description = "Container image for the web service (e.g. gcr.io/PROJECT/web:TAG)"
  type        = string
}

variable "api_max_instances" {
  description = "Maximum number of Cloud Run instances for the API"
  type        = number
  default     = 10
}

variable "web_max_instances" {
  description = "Maximum number of Cloud Run instances for the web frontend"
  type        = number
  default     = 10
}
