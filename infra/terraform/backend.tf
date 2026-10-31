locals {
  allowed_origins = sort(tolist(var.frontend_origins))
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${var.project_name}-api"
  retention_in_days = 7
}

resource "aws_iam_role" "api" {
  name = "${var.project_name}-api"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "api" {
  name = "library-access"
  role = aws_iam_role.api.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem"]
        Resource = aws_dynamodb_table.library.arn
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.api.arn}:*"
      }
    ]
  })
}

data "archive_file" "api" {
  type        = "zip"
  source_dir  = "${path.module}/../../build/lambda"
  output_path = "${path.module}/../../build/lambda.zip"
}

resource "aws_lambda_function" "api" {
  function_name                  = "${var.project_name}-api"
  role                           = aws_iam_role.api.arn
  runtime                        = "nodejs22.x"
  architectures                  = ["arm64"]
  handler                        = "index.handler"
  filename                       = data.archive_file.api.output_path
  source_code_hash               = data.archive_file.api.output_base64sha256
  memory_size                    = 128
  timeout                        = 15
  reserved_concurrent_executions = var.api_concurrency

  environment {
    variables = {
      TABLE_NAME      = aws_dynamodb_table.library.name
      ALLOWED_ORIGINS = jsonencode(local.allowed_origins)
    }
  }

  depends_on = [aws_iam_role_policy.api, aws_cloudwatch_log_group.api]
}

resource "aws_lambda_function_url" "api" {
  function_name      = aws_lambda_function.api.function_name
  authorization_type = "NONE"

  cors {
    allow_origins = local.allowed_origins
    allow_methods = ["GET", "PUT"]
    allow_headers = ["content-type", "if-match"]
    max_age       = 3600
  }
}

# Public access is intentional: everyone reads/edits the same library.
# Both permissions are required for current Lambda Function URL policies.
resource "aws_lambda_permission" "url" {
  statement_id           = "PublicFunctionURL"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.api.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

resource "aws_lambda_permission" "invoke" {
  statement_id             = "PublicInvokeViaFunctionURL"
  action                   = "lambda:InvokeFunction"
  function_name            = aws_lambda_function.api.function_name
  principal                = "*"
  invoked_via_function_url = true
}
