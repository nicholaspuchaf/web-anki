# Backend AWS com Terraform; frontend via GitHub + Cloudflare Pages

Biblioteca **pública e compartilhada**, sem Cognito e sem login. Qualquer pessoa
pode baixar, editar e substituir os cartões. A sincronização inicial é manual e
usa verificação de versão para impedir sobrescritas silenciosas entre aparelhos.

Nenhum recurso foi aplicado a uma conta durante o desenvolvimento.

## Recursos gerenciados pelo Terraform

- Tabela DynamoDB Standard provisionada: 5 unidades de leitura e 5 de escrita.
- Lambda Node.js 22 ARM64, 128 MB, timeout de 15 segundos, concorrência reservada 2.
- Function URL pública HTTPS, com CORS explícito para as origens informadas em `frontend_origins`.
- IAM limitado a GetItem/PutItem na tabela e escrita no grupo de logs.
- Grupo CloudWatch com retenção de sete dias.

Não há Cognito, API Gateway, domínio próprio, VPC ou NAT Gateway.
O Terraform gerencia somente a AWS. O Cloudflare Pages é criado no painel e conectado ao GitHub. Não é necessário token ou Account ID Cloudflare para executar o Terraform.
As credenciais de infraestrutura nunca entram no frontend.

## Preparação

Requisitos: Terraform 1.10+, Bun 1.4+ e Node 22.12+.
Configure suas credenciais AWS por perfil/SSO ou variáveis de ambiente.

Na raiz do repositório:

```sh
bun install --frozen-lockfile
bun run build:backend
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars
```

Edite `terraform.tfvars` com o prefixo dos recursos e a URL HTTPS do seu frontend:

```hcl
project_name     = "folha-leetcode-seu-nome"
aws_region       = "us-east-1"
frontend_origins = ["https://seu-projeto.pages.dev"]
```

Crie primeiro o projeto Pages pela integração GitHub para obter essa URL. O primeiro
build pode funcionar sem `VITE_API_URL`, em modo local, até o backend ser publicado.
Use a URL exata, sem caminho ou barra final. Para domínio próprio, acrescente sua
origem à lista. O arquivo local está ignorado pelo Git.

```sh
terraform -chdir=infra/terraform init
terraform -chdir=infra/terraform fmt -check
terraform -chdir=infra/terraform validate
terraform -chdir=infra/terraform plan -out=review.tfplan
```

Revise o plano antes de executar:

```sh
terraform -chdir=infra/terraform apply review.tfplan
```

Contas com quota de concorrência Lambda muito baixa podem recusar reserva de
concorrência. Nesse caso, defina `api_concurrency = -1`, revise o novo plano e
entenda que a função usará a concorrência não reservada da conta.

## Publicar o frontend pela integração com GitHub

No painel Cloudflare Pages, conecte este repositório GitHub e configure:

| Configuração       | Valor                                              |
| ------------------ | -------------------------------------------------- |
| Branch de produção | `master` (ou a branch que você escolher no GitHub) |
| Diretório raiz     | raiz do repositório                                |
| Comando de build   | `bun install --frozen-lockfile && bun run build`   |
| Diretório de saída | `dist`                                             |
| `BUN_VERSION`      | `1.4.0`                                            |
| `NODE_VERSION`     | `22.12.0` ou versão 22 mais recente compatível     |

Depois de aplicar o backend, obtenha o endpoint:

```sh
terraform -chdir=infra/terraform output -raw api_url
```

Cadastre o resultado como variável de ambiente **`VITE_API_URL`** no ambiente de
produção do Pages e execute um novo deploy. Essa URL é pública, não uma credencial.
O Vite incorpora o valor durante o build; mudar a variável exige reconstruir o site.
Não execute `cloud:config` no build do Cloudflare: o estado Terraform e as credenciais
AWS permanecem fora do ambiente de build do frontend.

Depois dessa configuração, pushes para a branch de produção acionam o deploy no
Cloudflare. O frontend não exige Wrangler, upload manual ou apply Terraform.

A origem do site precisa estar em `frontend_origins`; alterar o domínio exige novo
plan/apply do backend para atualizar CORS. URLs de preview do Pages não são liberadas
automaticamente. Se quiser sincronização em um preview, configure a URL da API
nesse ambiente e permita explicitamente sua origem no backend.

Documentação oficial: [integração GitHub](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/)
e [configuração de build](https://developers.cloudflare.com/pages/configuration/build-configuration/).

## Atualizações e desenvolvimento local

- Backend: `bun run build:backend`, novo plan, revisão e apply.
- Frontend: push para o GitHub; o Cloudflare executa o build e a publicação.
- Desenvolvimento local: `bun run dev`. Sem API configurada, os dados ficam locais.

O comando opcional `bun run cloud:config` apenas copia o output `api_url` do estado
Terraform local para `.env.production.local`, útil para `bun run build` e preview
local. Ele não publica o frontend. Se o Terraform estiver fora do PATH, forneça
seu caminho em `TERRAFORM_BIN`.

## Usar em aparelhos diferentes

1. Abra o site no computador ou iPhone.
2. Na página de baralhos, clique em **Verificar nuvem**.
3. **Baixar biblioteca** substitui os dados locais após confirmação quando necessário.
4. Faça suas edições/revisões normalmente; continuam salvas no IndexedDB offline.
5. Clique em **Enviar biblioteca** para publicar a versão local para todos.
6. Em outro aparelho, verifique e baixe novamente para ver as alterações.

Se outra pessoa publicar entre verificar e enviar, a API retorna conflito (409).
Os dados locais são preservados. Verifique de novo, compare os dados/backup e
escolha qual versão manter. Não há mesclagem automática nesta versão.

Sem `VITE_API_URL`, o aplicativo funciona somente com armazenamento local.
Para desenvolvimento local com API real, use um endereço HTTPS e inclua sua origem
em `frontend_origins`. A configuração atual aceita somente origens HTTPS explícitas;
ela não libera `localhost` HTTP nem previews automaticamente.

## Modelo e limites iniciais

A tabela mantém um snapshot gzip da biblioteca sob `PUBLIC_LIBRARY`, acompanhado
de `revision` e `updatedAt`. O GET usa leitura consistente; o PUT aplica condição
atômica de revisão. Exclusões de cartões são publicadas pelo próximo envio da
biblioteca, inclusive uma biblioteca vazia.

Limites por biblioteca sincronizada: 2 MB de JSON e 300 KB compactados. Esses
limites mantêm o snapshot abaixo do limite de item do DynamoDB. Bibliotecas maiores
continuam exportáveis localmente; a API recusa o envio com 413, sem apagar nada.
Para crescer além disso ou colaborar simultaneamente, o próximo passo é migrar
para registros por entidade e resolução de conflitos por cartão.

A capacidade fixa pode produzir 429 em picos ou snapshots grandes. Aguarde antes
de repetir o envio. A reserva de concorrência reduz paralelismo, **não define um
teto de gasto**. A franquia gratuita é compartilhada com outros recursos elegíveis
da conta/região; tráfego público, logs e outros usos podem gerar cobrança.

CORS limita origens em navegadores; ele **não autentica ninguém**. O endpoint é
público por decisão do projeto e também pode ser usado por clientes HTTP externos.

## Estado e dados

O estado Terraform fica local inicialmente e está ignorado pelo Git. Guarde uma
cópia segura; perder o estado dificulta gerenciar os recursos existentes. Para
colaboração de infraestrutura, configure depois um backend remoto com bloqueio.
A tabela tem proteção de exclusão e `prevent_destroy`. Um destroy comum será
bloqueado enquanto a proteção existir; remover a biblioteca da nuvem exige uma
mudança explícita dessas proteções. Exporte backups JSON regularmente, pois o
público pode alterar ou excluir o conteúdo da biblioteca pela aplicação.
