provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"
}

variable "budget_limit" {
  description = "Monthly budget limit"
  type        = string
  default     = "100.0"
}

variable "alert_email" {
  description = "Email to send budget alerts to"
  type        = string
  default     = "admin@example.com"
}

# Tagging Strategy Module
locals {
  common_tags = {
    Environment = "production"
    Project     = "NexaSphere"
    ManagedBy   = "Terraform"
    CostCenter  = "DevOps"
  }
}

# AWS Budget Setup
resource "aws_budgets_budget" "cost_optimization_budget" {
  name              = "nexasphere-monthly-budget"
  budget_type       = "COST"
  limit_amount      = var.budget_limit
  limit_unit        = "USD"
  time_unit         = "MONTHLY"
  time_period_start = "2024-01-01_00:00"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.alert_email]
  }
}

# Cost Explorer Anomaly Monitor
resource "aws_ce_anomaly_monitor" "cost_anomaly_monitor" {
  name              = "NexaSphereCostAnomalyMonitor"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
}

resource "aws_ce_anomaly_subscription" "cost_anomaly_subscription" {
  name             = "NexaSphereCostAnomalySubscription"
  monitor_arn_list = [aws_ce_anomaly_monitor.cost_anomaly_monitor.arn]
  threshold        = 10
  frequency        = "DAILY"

  subscriber {
    type    = "EMAIL"
    address = var.alert_email
  }
}
