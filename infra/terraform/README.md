# Backend AWS com Terraform; frontend via GitHub + Cloudflare Pages

Biblioteca **pública e compartilhada**, sem Cognito e sem login. Qualquer pessoa
pode consultar, criar, editar e excluir cartões. O backend usa um item por flashcard
e sincronização incremental por data, com verificação de versão por cartão.

O frontend usa `/sync` e `/flashcards/:id`. O protocolo antigo `/library` retorna 410. Depois de aplicar o backend, configure `VITE_API_URL`, publique o frontend e
clique em **Sincronizar** para o primeiro envio dos cartões locais.

Nenhum recurso foi aplicado a uma conta durante o desenvolvimento.

## Recursos gerenciados pelo Terraform

- Uma tabela DynamoDB Standard provisionada: 5 unidades de leitura e 5 de escrita.
- Índice global `library-updated-at`: mais 5 unidades de leitura e 5 de escrita,
  com projeção ALL para retornar o conteúdo sem leituras extras por cartão.
- Lambda Node.js 22 ARM64, 128 MB, timeout de 15 segundos, concorrência reservada 2.
- Function URL pública HTTPS, com CORS explícito para as origens informadas em `frontend_origins`.
- IAM limitado a GetItem/PutItem na tabela, Query no índice de sincronização e logs.
- CORS permite GET, PUT e DELETE; os pedidos de escrita usam If-Match.
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
O estado Terraform e as credenciais AWS permanecem fora do ambiente de build do
frontend. Somente a URL pública é necessária no Pages.

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

Para build e preview local com sincronização, cadastre a mesma URL pública em
`.env.production.local` como `VITE_API_URL=https://sua-api.lambda-url.us-east-1.on.aws`,
execute `bun run build` e depois `bun run preview`. O arquivo de ambiente local não
é versionado. A origem HTTPS do preview também precisa estar em `frontend_origins`.

## API e sincronização incremental

O contrato completo, exemplos e responsabilidades do cliente estão em
[docs/backend-sync.md](../../docs/backend-sync.md). Rotas disponíveis:

- `PUT /flashcards/:id`: cria ou atualiza um cartão com seu baralho.
- `GET /flashcards/:id`: leitura consistente de um cartão, inclusive tombstone.
- `DELETE /flashcards/:id`: exclusão lógica com versão e nova data.
- `GET /sync?since=<last_sync_at>`: alterações com sobreposição de dois minutos.
- `GET /sync`: leitura completa paginada para início e reconciliação periódica.

Não existe mais gravação da biblioteca inteira. O cliente deve enviar cada cartão
com sua versão; `If-Match: 0` cria, as próximas escritas usam a versão recebida.
O limite é 250 KB de JSON UTF-8 por pedido de cartão, não por biblioteca.

O índice é eventualmente consistente. A sobreposição reduz o risco de perder
alterações atrasadas, mas não garante ausência de perdas: o cliente deve realizar
reconciliação completa ocasional. A interface faz isso no primeiro sync e na
primeira sincronização após 24 horas. Não há polling: consultas e envios são
iniciados pelos botões **Sincronizar** e **Reconciliar biblioteca**.

A capacidade da tabela e do índice pode produzir 429 em picos. A reserva de
concorrência reduz paralelismo, **não define um teto de gasto**. O índice consome
capacidade e armazenamento próprios. A franquia gratuita é compartilhada com outros
recursos elegíveis da conta/região; tráfego público, logs e outros usos podem gerar
cobrança. Não há provisioned concurrency na Lambda.

CORS limita origens em navegadores; ele **não autentica ninguém**. O endpoint é
público por decisão do projeto e pode ser usado por clientes HTTP externos.

## Transição de dados existentes

A chave primária `pk`, o nome e as proteções da tabela foram preservados. O plano
esperado adiciona o índice à tabela existente; confirme isso no seu próprio plan.
O item antigo `PUBLIC_LIBRARY`, se existir, permanece intacto e fica fora do índice
por não possuir `library_id` e `last_updated_at`. Não há migração automática nem
exclusão desse snapshot. Ele não aparece na API nova.

Antes de atualizar uma instalação com dados remotos, exporte a biblioteca usando
a versão antiga do aplicativo. Para migrar, envie cada cartão do backup com o
respectivo baralho para `PUT /flashcards/:id`, usando `If-Match: 0`. Um conflito
409 precisa ser resolvido individualmente; não sobrescreva com uma versão inventada.
Baralhos vazios não são sincronizados neste modelo, pois só existem itens de cartões.
Alternativamente, importe o backup JSON na interface nova e clique em
**Sincronizar**. Os cartões serão enviados individualmente; conflitos exigirão sua
escolha. Não há migração automática do item remoto antigo.

## Estado e dados

O estado Terraform fica local inicialmente e está ignorado pelo Git. Guarde uma
cópia segura; perder o estado dificulta gerenciar os recursos existentes. Para
colaboração de infraestrutura, configure depois um backend remoto com bloqueio.
A tabela tem proteção de exclusão e `prevent_destroy`. Um destroy comum será
bloqueado enquanto a proteção existir; remover a biblioteca da nuvem exige uma
mudança explícita dessas proteções. Exporte backups JSON regularmente, pois o
público pode alterar ou excluir o conteúdo da biblioteca pela aplicação.

### Pedidos para refazer flashcards

As rotas `PUT /flashcards/:id/rework` e `GET /rework-requests` usam a mesma tabela e o mesmo índice (`library_id = REWORK`, separado de `PUBLIC`). Não exigem novos recursos, índices ou permissões: `PutItem` condicional e `Query` já são permitidos, assim como GET/PUT no CORS. Atualize o pacote da Lambda e o frontend para ativar o recurso. Veja [documentação e script local](../../docs/flashcard-rework.md).
