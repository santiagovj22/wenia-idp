output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.service.repository_url
}

output "cd_role_arn" {
  description = "IAM role ARN for GitHub Actions CD"
  value       = aws_iam_role.cd_role.arn
}
