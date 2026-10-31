variable "project_name" {
  description = "Prefixo dos recursos do backend na AWS."
  type        = string
  default     = "folha-leetcode"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,40}$", var.project_name))
    error_message = "Use de 3 a 41 caracteres: letras minúsculas, números e hífens."
  }
}

variable "aws_region" {
  description = "Região AWS para Lambda e DynamoDB."
  type        = string
  default     = "us-east-1"
}

variable "frontend_origins" {
  description = "Origens HTTPS do frontend permitidas na API, incluindo a URL do Pages e, se houver, domínio próprio."
  type        = set(string)
  validation {
    condition     = length(var.frontend_origins) > 0 && alltrue([for origin in var.frontend_origins : can(regex("^https://[a-zA-Z0-9][a-zA-Z0-9.-]*(:[0-9]+)?$", origin))])
    error_message = "Informe ao menos uma origem HTTPS, sem caminho, barra final ou curinga."
  }
}

variable "api_concurrency" {
  description = "Concorrência reservada da API; -1 desativa a reserva se a quota da conta não permitir. Não é um teto de gasto."
  type        = number
  default     = 2
  validation {
    condition     = var.api_concurrency == -1 || (var.api_concurrency >= 1 && var.api_concurrency <= 5 && floor(var.api_concurrency) == var.api_concurrency)
    error_message = "Use -1 ou um inteiro entre 1 e 5."
  }
}
