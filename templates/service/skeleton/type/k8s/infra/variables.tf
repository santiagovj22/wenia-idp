variable "service_name" {
  description = "Name of the service"
  type        = string
  default     = "${{ values.serviceName }}"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}
