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

  attribute {
    name = "library_id"
    type = "S"
  }

  attribute {
    name = "last_updated_at"
    type = "S"
  }

  # The legacy snapshot lacks these attributes and is excluded from this index.
  global_secondary_index {
    name            = "library-updated-at"
    hash_key        = "library_id"
    range_key       = "last_updated_at"
    projection_type = "ALL"
    read_capacity   = 5
    write_capacity  = 5
  }

  # Terraform must not delete the library as a side effect of an ordinary destroy.
  lifecycle {
    prevent_destroy = true
  }
}
