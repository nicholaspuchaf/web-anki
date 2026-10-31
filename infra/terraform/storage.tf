resource "aws_dynamodb_table" "library" {
  name                        = "${var.project_name}-library"
  billing_mode                = "PROVISIONED"
  read_capacity               = 5
  write_capacity              = 5
  hash_key                    = "pk"
  deletion_protection_enabled = true

  attribute {
    name = "pk"
    type = "S"
  }

  # Terraform must not delete the library as a side effect of an ordinary destroy.
  lifecycle {
    prevent_destroy = true
  }
}
