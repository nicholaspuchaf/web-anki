output "api_url" {
  value       = trimsuffix(aws_lambda_function_url.api.function_url, "/")
  description = "Endpoint público da biblioteca compartilhada."
}
