# AD-17: Terraform for K8s Service — static validation only.
# This module provisions a container registry repository and the CD role.
# Run: terraform init -backend=false && terraform validate
# LIMIT: This is static validation only. Nothing is deployed.
# A real deployment (Evidence E9) requires AWS credentials and a backend block.

provider "aws" {
  region = var.aws_region
}

# Container registry repository (GHCR is used by default; ECR is the AWS path).
resource "aws_ecr_repository" "service" {
  name                 = var.service_name
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Service         = var.service_name
    ManagedBy       = "terraform"
    TemplateVersion = "${{ values.templateVersion }}"
  }
}

# IAM role for CD (GitHub Actions OIDC).
resource "aws_iam_role" "cd_role" {
  name = "${var.service_name}-cd-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:santiagovj22/${{ values.serviceName }}:*"
        }
      }
    }]
  })

  tags = {
    Service   = var.service_name
    ManagedBy = "terraform"
  }
}

resource "aws_iam_role_policy" "ecr_push" {
  name = "ecr-push"
  role = aws_iam_role.cd_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ]
      Resource = aws_ecr_repository.service.arn
    }]
  })
}
