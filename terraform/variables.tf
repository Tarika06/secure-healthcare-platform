# ============================================================
#  Terraform: Variables
# ============================================================

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-south-1" # Mumbai — closest to India
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "securecare"
}

# ── ECS Task Sizing ─────────────────────────────────────────────
variable "backend_cpu" {
  description = "CPU units for backend task (1024 = 1 vCPU)"
  type        = string
  default     = "256"
}

variable "backend_memory" {
  description = "Memory (MB) for backend task"
  type        = string
  default     = "512"
}

variable "frontend_cpu" {
  description = "CPU units for frontend task"
  type        = string
  default     = "256"
}

variable "frontend_memory" {
  description = "Memory (MB) for frontend task"
  type        = string
  default     = "512"
}

# ── Scaling ─────────────────────────────────────────────────────
variable "backend_desired_count" {
  description = "Number of backend task instances"
  type        = number
  default     = 1
}

variable "frontend_desired_count" {
  description = "Number of frontend task instances"
  type        = number
  default     = 1
}
