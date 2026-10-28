terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  # AD-17: no backend block — state is local only for static validation.
  # Add a backend block here when deploying to AWS.
}
