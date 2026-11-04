# Baralho AWS incluído no site

Catálogo revisado em **2026-11-04**: **326 cartões**, em **20 categorias**, incluindo **45 recursos de Bedrock e AgentCore**.

O conteúdo está em [src/content/aws-services.json](../src/content/aws-services.json). Cada entrada tem nome, categoria, definição curta, caso de uso, comentários de nível pleno (`intermediateComment`) e sênior (`seniorComment`) e fonte oficial. As definições têm até 150 caracteres e no máximo quatro linhas; o teste de navegador também verifica o limite visual no layout de celular.

O catálogo reúne serviços, funcionalidades importantes e ferramentas da AWS. Não é uma enumeração de todas as APIs, modelos de IA, SKUs ou combinações de recursos. Os exemplos são didáticos e originais, não instruções para provisionar infraestrutura.

O verso **Visão de pleno** aprofunda cada serviço com decisões de arquitetura, limitações, segurança e operação. Os comentários são específicos de cada cartão e podem ser revelados separadamente, depois da definição e do caso de uso.

O quarto verso, **Visão de sênior**, contém um comentário original por serviço, sem substituir o de pleno. Cada comentário apresenta um cenário ou limite de garantia, suas consequências e uma forma de avaliar ou mitigar o risco. O foco inclui falhas correlacionadas, resultados ambíguos, restauração, mudanças compatíveis, segurança e custo por resultado útil. São orientações de engenharia para estudo, não relatos de experiência pessoal nem garantias universais do produto.

## Como funciona

- O baralho aparece automaticamente, sem confirmação, em bibliotecas novas e existentes.
- Cada cartão tem quatro versos: **O que é**, **Quando usar**, **Visão de pleno** e **Visão de sênior**.
- Conteúdo e IDs pertencem ao repositório; a interface permite estudar e favoritar. Alterações de conteúdo são feitas no JSON.
- Ao atualizar o site, o conteúdo é atualizado por ID sem perder datas, revisões ou favoritos locais. Preserve o ID ao renomear um serviço.
- `syncEnabled: false` existe no baralho e nos cartões. Os IDs `builtin-aws-*` também são bloqueados pelo cliente e pelo backend.
- Não há envio de conteúdo, progresso ou favoritos desse baralho ao DynamoDB, nem tombstones de exclusão.
- O catálogo está no build e no cache da PWA. Não há consultas externas ao abrir ou estudar; a fonte só é acessada se você abrir o link.
- Backups JSON preservam o conteúdo, o progresso e a indicação de armazenamento local. Restaurar um backup antigo também repõe o catálogo do site.
- A lista exibe 50 cartões por vez; pesquisa e filtros consideram o catálogo inteiro.

## Leituras para aprofundar os comentários

Referências oficiais consultadas para os limites técnicos e padrões usados nos versos de sênior:

- [Timeouts, retries e backoff com jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/): resultados ambíguos e amplificação de carga por retentativas.
- [Transactional outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html): publicação de eventos junto a alterações de dados.
- [Modelo de consistência do S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html): garantias por chave e limites entre objetos.
- [Pinning no RDS Proxy](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy-pinning.html): estado de sessão e reaproveitamento de conexões.
- [Concorrência no Aurora DSQL](https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with-concurrency-control.html): conflitos e repetição de transações.
- [Global Tables do DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html): escolha do modo de consistência entre Regiões.
- [Avaliação de políticas IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html): composição de permissões e limites.
- [Garantias do Managed Service for Apache Flink](https://aws.amazon.com/managed-service-apache-flink/faqs/): dependência dos conectores para a garantia de processamento.
- [Sincronização de Knowledge Bases](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-data-source-sync-ingest.html): atualização dos dados derivados.
- [Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html): escopo dos filtros.
- [Políticas temporais do AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-temporal.html): histórico, sessão e condições de autorização.

## Disponibilidade e verificação

As páginas oficiais de todos os itens foram consultadas para verificar links e descrições. Links inválidos ou redirecionados para páginas genéricas foram substituídos. Dezesseis cartões incluem notas sobre restrições, encerramentos ou mudanças de uma funcionalidade específica; essas notas aparecem no segundo verso e na tag “verificar disponibilidade”.

Um aviso sobre uma funcionalidade não implica o encerramento de todo o serviço. Por exemplo, o encerramento de Greengrass v1 não significa que Greengrass v2 terminou. Revalide disponibilidade e suporte na fonte antes de usar um serviço em um projeto novo.

Referências de cobertura: [visão geral dos serviços AWS](https://docs.aws.amazon.com/whitepapers/latest/aws-overview/amazon-web-services-cloud-platform.html), [Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html) e [Amazon Bedrock AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html).

## Índice completo

### Computação (17)

- [Amazon EC2](https://aws.amazon.com/ec2/)
- [AWS Lambda](https://aws.amazon.com/lambda/)
- [Amazon Lightsail](https://aws.amazon.com/lightsail/)
- [AWS Elastic Beanstalk](https://aws.amazon.com/elasticbeanstalk/)
- [AWS Batch](https://aws.amazon.com/batch/)
- [Amazon EC2 Auto Scaling](https://aws.amazon.com/ec2/autoscaling/)
- [Amazon EC2 — Spot Instances](https://aws.amazon.com/ec2/spot/)
- [Amazon EC2 — Dedicated Hosts](https://aws.amazon.com/ec2/dedicated-hosts/)
- [EC2 Image Builder](https://aws.amazon.com/image-builder/)
- [AWS Outposts](https://aws.amazon.com/outposts/)
- [AWS Local Zones](https://aws.amazon.com/about-aws/global-infrastructure/localzones/)
- [AWS Wavelength](https://aws.amazon.com/wavelength/)
- [AWS Parallel Computing Service](https://aws.amazon.com/pcs/)
- [AWS ParallelCluster](https://aws.amazon.com/hpc/parallelcluster/)
- [AWS Graviton](https://aws.amazon.com/ec2/graviton/)
- [AWS Nitro Enclaves](https://aws.amazon.com/ec2/nitro/nitro-enclaves/)
- [AWS Launch Wizard](https://aws.amazon.com/launchwizard/)

### Contêineres (9)

- [Amazon ECS](https://aws.amazon.com/ecs/)
- [Amazon EKS](https://aws.amazon.com/eks/)
- [AWS Fargate](https://aws.amazon.com/fargate/)
- [Amazon ECR](https://aws.amazon.com/ecr/)
- [Amazon ECS Anywhere](https://aws.amazon.com/ecs/anywhere/)
- [Amazon EKS Anywhere](https://aws.amazon.com/eks/eks-anywhere/)
- [Amazon EKS — Auto Mode](https://aws.amazon.com/eks/auto-mode/)
- [Red Hat OpenShift Service on AWS](https://aws.amazon.com/rosa/)
- [AWS App Runner](https://aws.amazon.com/apprunner/) — verificar disponibilidade

### Armazenamento (22)

- [Amazon S3](https://aws.amazon.com/s3/)
- [Amazon EBS](https://aws.amazon.com/ebs/)
- [Amazon EFS](https://aws.amazon.com/efs/)
- [Amazon FSx for Windows File Server](https://aws.amazon.com/fsx/windows/)
- [Amazon FSx for Lustre](https://aws.amazon.com/fsx/lustre/)
- [Amazon FSx for NetApp ONTAP](https://aws.amazon.com/fsx/netapp-ontap/)
- [Amazon FSx for OpenZFS](https://aws.amazon.com/fsx/openzfs/)
- [AWS Storage Gateway](https://aws.amazon.com/storagegateway/)
- [AWS Backup](https://aws.amazon.com/backup/)
- [AWS DataSync](https://aws.amazon.com/datasync/)
- [AWS Transfer Family](https://aws.amazon.com/aws-transfer-family/)
- [Amazon S3 Glacier](https://aws.amazon.com/s3/storage-classes/glacier/)
- [Amazon S3 — Intelligent-Tiering](https://aws.amazon.com/s3/storage-classes/intelligent-tiering/)
- [Amazon S3 — Express One Zone](https://aws.amazon.com/s3/storage-classes/express-one-zone/)
- [Amazon S3 Tables](https://aws.amazon.com/s3/features/tables/)
- [Amazon S3 Vectors](https://aws.amazon.com/s3/features/vectors/)
- [Amazon S3 Files](https://aws.amazon.com/s3/features/files/)
- [Amazon S3 — Object Lock](https://aws.amazon.com/s3/features/object-lock/)
- [Amazon S3 — Access Grants](https://aws.amazon.com/s3/features/access-grants/)
- [Amazon S3 — Batch Operations](https://aws.amazon.com/s3/features/batch-operations/)
- [Amazon S3 — Storage Lens](https://aws.amazon.com/s3/storage-lens/)
- [Amazon EBS — Snapshots](https://aws.amazon.com/ebs/snapshots/)

### Bancos de dados (13)

- [Amazon RDS](https://aws.amazon.com/rds/)
- [Amazon Aurora](https://aws.amazon.com/rds/aurora/)
- [Amazon Aurora Serverless](https://aws.amazon.com/rds/aurora/serverless/)
- [Amazon Aurora DSQL](https://aws.amazon.com/rds/aurora/dsql/)
- [Amazon DynamoDB](https://aws.amazon.com/dynamodb/)
- [Amazon ElastiCache](https://aws.amazon.com/elasticache/)
- [Amazon MemoryDB](https://aws.amazon.com/memorydb/)
- [Amazon DocumentDB](https://aws.amazon.com/documentdb/)
- [Amazon Keyspaces](https://aws.amazon.com/keyspaces/)
- [Amazon Neptune](https://aws.amazon.com/neptune/)
- [Amazon Neptune Analytics](https://docs.aws.amazon.com/neptune-analytics/latest/userguide/what-is-neptune-analytics.html)
- [Amazon Timestream for InfluxDB](https://docs.aws.amazon.com/timestream/latest/developerguide/timestream-for-influxdb.html)
- [Amazon RDS Proxy](https://aws.amazon.com/rds/proxy/)

### Redes e entrega (26)

- [Amazon VPC](https://aws.amazon.com/vpc/)
- [Amazon CloudFront](https://aws.amazon.com/cloudfront/)
- [Amazon Route 53](https://aws.amazon.com/route53/)
- [Amazon API Gateway](https://aws.amazon.com/api-gateway/)
- [Elastic Load Balancing](https://aws.amazon.com/elasticloadbalancing/)
- [Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html)
- [Network Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html)
- [Gateway Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/introduction.html)
- [AWS Direct Connect](https://aws.amazon.com/directconnect/)
- [AWS Site-to-Site VPN](https://aws.amazon.com/vpn/site-to-site-vpn/)
- [AWS Client VPN](https://aws.amazon.com/vpn/client-vpn/)
- [AWS PrivateLink](https://aws.amazon.com/privatelink/)
- [AWS Transit Gateway](https://aws.amazon.com/transit-gateway/)
- [AWS Cloud WAN](https://aws.amazon.com/cloud-wan/)
- [AWS Global Accelerator](https://aws.amazon.com/global-accelerator/)
- [Amazon VPC Lattice](https://aws.amazon.com/vpc/lattice/)
- [AWS Cloud Map](https://aws.amazon.com/cloud-map/)
- [Amazon Route 53 Resolver](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver.html)
- [Amazon Application Recovery Controller](https://aws.amazon.com/application-recovery-controller/)
- [Amazon VPC — IPAM](https://docs.aws.amazon.com/vpc/latest/ipam/what-it-is-ipam.html)
- [Amazon VPC — NAT Gateway](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
- [Amazon VPC — Security Groups](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html)
- [Amazon VPC — Network ACLs](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html)
- [Amazon VPC — Reachability Analyzer](https://docs.aws.amazon.com/vpc/latest/reachability/what-is-reachability-analyzer.html)
- [Amazon CloudFront Functions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html)
- [AWS Lambda@Edge](https://aws.amazon.com/lambda/edge/)

### Segurança e identidade (28)

- [AWS IAM](https://aws.amazon.com/iam/)
- [AWS IAM Identity Center](https://aws.amazon.com/iam/identity-center/)
- [Amazon Cognito](https://aws.amazon.com/cognito/)
- [Amazon Verified Permissions](https://aws.amazon.com/verified-permissions/)
- [AWS KMS](https://aws.amazon.com/kms/)
- [AWS CloudHSM](https://aws.amazon.com/cloudhsm/)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [AWS Certificate Manager](https://aws.amazon.com/certificate-manager/)
- [AWS Private CA](https://aws.amazon.com/private-ca/)
- [AWS WAF](https://aws.amazon.com/waf/)
- [AWS Shield](https://aws.amazon.com/shield/)
- [AWS Firewall Manager](https://aws.amazon.com/firewall-manager/)
- [Amazon GuardDuty](https://aws.amazon.com/guardduty/)
- [Amazon Inspector](https://aws.amazon.com/inspector/)
- [Amazon Macie](https://aws.amazon.com/macie/)
- [AWS Security Hub](https://aws.amazon.com/security-hub/)
- [Amazon Detective](https://aws.amazon.com/detective/)
- [Amazon Security Lake](https://aws.amazon.com/security-lake/)
- [AWS Audit Manager](https://aws.amazon.com/audit-manager/) — verificar disponibilidade
- [AWS Artifact](https://aws.amazon.com/artifact/)
- [AWS IAM Access Analyzer](https://aws.amazon.com/iam/access-analyzer/)
- [AWS Network Firewall](https://aws.amazon.com/network-firewall/)
- [AWS Verified Access](https://aws.amazon.com/verified-access/)
- [AWS Resource Access Manager](https://aws.amazon.com/ram/)
- [AWS Directory Service](https://aws.amazon.com/directoryservice/) — verificar disponibilidade
- [AWS Signer](https://docs.aws.amazon.com/signer/latest/developerguide/Welcome.html)
- [AWS Payment Cryptography](https://aws.amazon.com/payment-cryptography/)
- [AWS Security Incident Response](https://aws.amazon.com/security-incident-response/)

### Gestão e observabilidade (31)

- [AWS CloudFormation](https://aws.amazon.com/cloudformation/)
- [AWS Cloud Development Kit](https://aws.amazon.com/cdk/)
- [AWS Cloud Control API](https://aws.amazon.com/cloudcontrolapi/)
- [AWS CloudTrail](https://aws.amazon.com/cloudtrail/)
- [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/)
- [AWS Config](https://aws.amazon.com/config/)
- [AWS Systems Manager](https://aws.amazon.com/systems-manager/)
- [AWS Systems Manager — Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [AWS Systems Manager — Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
- [AWS AppConfig](https://aws.amazon.com/systems-manager/features/appconfig/)
- [AWS Control Tower](https://aws.amazon.com/controltower/)
- [AWS Organizations](https://aws.amazon.com/organizations/)
- [AWS Service Catalog](https://aws.amazon.com/servicecatalog/)
- [AWS Trusted Advisor](https://aws.amazon.com/premiumsupport/technology/trusted-advisor/)
- [AWS Health](https://aws.amazon.com/premiumsupport/technology/aws-health/)
- [AWS Resilience Hub](https://aws.amazon.com/resilience-hub/)
- [AWS Fault Injection Service](https://aws.amazon.com/fis/)
- [AWS Well-Architected Tool](https://aws.amazon.com/well-architected-tool/)
- [AWS Resource Explorer](https://aws.amazon.com/resourceexplorer/)
- [AWS License Manager](https://aws.amazon.com/license-manager/)
- [Amazon Managed Grafana](https://aws.amazon.com/grafana/)
- [Amazon Managed Service for Prometheus](https://aws.amazon.com/prometheus/)
- [AWS X-Ray](https://aws.amazon.com/cloudwatch/features/application-observability-apm/)
- [Amazon CloudWatch — Application Signals](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Application-Monitoring-Intro.html)
- [Amazon CloudWatch — Synthetics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Canaries.html)
- [Amazon CloudWatch — RUM](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-RUM.html)
- [AWS CloudTrail Lake](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-lake.html) — verificar disponibilidade
- [AWS User Notifications](https://aws.amazon.com/notifications/)
- [AWS Managed Services](https://aws.amazon.com/managed-services/)
- [AWS Support](https://aws.amazon.com/premiumsupport/)
- [AWS re:Post Private](https://aws.amazon.com/repost-private/) — verificar disponibilidade

### Custos (7)

- [AWS Cost Explorer](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/)
- [AWS Budgets](https://aws.amazon.com/aws-cost-management/aws-budgets/)
- [AWS Data Exports](https://aws.amazon.com/aws-cost-management/aws-data-exports/)
- [AWS Cost Optimization Hub](https://aws.amazon.com/aws-cost-management/cost-optimization-hub/)
- [AWS Billing Conductor](https://aws.amazon.com/aws-cost-management/aws-billing-conductor/)
- [AWS Savings Plans](https://aws.amazon.com/savingsplans/)
- [AWS Marketplace](https://aws.amazon.com/marketplace/)

### Integração e mensagens (12)

- [Amazon SQS](https://aws.amazon.com/sqs/)
- [Amazon SNS](https://aws.amazon.com/sns/)
- [Amazon EventBridge](https://aws.amazon.com/eventbridge/)
- [Amazon EventBridge — Scheduler](https://docs.aws.amazon.com/scheduler/latest/UserGuide/what-is-scheduler.html)
- [Amazon EventBridge — Pipes](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-pipes.html)
- [AWS Step Functions](https://aws.amazon.com/step-functions/)
- [AWS AppSync](https://aws.amazon.com/appsync/)
- [Amazon MQ](https://aws.amazon.com/amazon-mq/)
- [Amazon AppFlow](https://aws.amazon.com/appflow/)
- [Amazon Managed Workflows for Apache Airflow](https://aws.amazon.com/managed-workflows-for-apache-airflow/)
- [AWS B2B Data Interchange](https://aws.amazon.com/b2b-data-interchange/)
- [Amazon Simple Workflow Service](https://aws.amazon.com/swf/)

### Análise de dados (22)

- [Amazon Athena](https://aws.amazon.com/athena/)
- [AWS Glue](https://aws.amazon.com/glue/)
- [AWS Glue — Data Catalog](https://docs.aws.amazon.com/glue/latest/dg/catalog-and-crawler.html)
- [AWS Glue — Data Quality](https://aws.amazon.com/glue/features/data-quality/)
- [AWS Lake Formation](https://aws.amazon.com/lake-formation/)
- [Amazon EMR](https://aws.amazon.com/emr/)
- [Amazon EMR Serverless](https://aws.amazon.com/emr/serverless/)
- [Amazon Redshift](https://aws.amazon.com/redshift/)
- [Amazon Redshift Serverless](https://aws.amazon.com/redshift/redshift-serverless/)
- [Amazon OpenSearch Service](https://aws.amazon.com/opensearch-service/)
- [Amazon OpenSearch Serverless](https://aws.amazon.com/opensearch-service/features/serverless/)
- [Amazon Kinesis Data Streams](https://aws.amazon.com/kinesis/data-streams/)
- [Amazon Data Firehose](https://aws.amazon.com/firehose/)
- [Amazon Managed Service for Apache Flink](https://aws.amazon.com/managed-service-apache-flink/)
- [Amazon MSK](https://aws.amazon.com/msk/)
- [Amazon MSK — Connect](https://aws.amazon.com/msk/features/msk-connect/)
- [Amazon DataZone](https://aws.amazon.com/datazone/)
- [AWS Data Exchange](https://aws.amazon.com/data-exchange/)
- [AWS Clean Rooms](https://aws.amazon.com/clean-rooms/)
- [AWS Entity Resolution](https://aws.amazon.com/entity-resolution/)
- [Amazon Quick](https://docs.aws.amazon.com/quick/latest/userguide/what-is.html)
- [Amazon Quick Sight](https://aws.amazon.com/quick/quicksight/)

### IA e aprendizado de máquina (34)

- [Amazon Bedrock](https://aws.amazon.com/bedrock/)
- [Amazon SageMaker AI](https://aws.amazon.com/sagemaker/ai/)
- [Amazon SageMaker Unified Studio](https://aws.amazon.com/sagemaker/unified-studio/)
- [Amazon SageMaker Lakehouse](https://aws.amazon.com/sagemaker/lakehouse/)
- [Amazon SageMaker — Feature Store](https://aws.amazon.com/sagemaker/ai/feature-store/)
- [Amazon SageMaker Canvas](https://aws.amazon.com/sagemaker/ai/canvas/)
- [Amazon SageMaker JumpStart](https://aws.amazon.com/sagemaker/ai/jumpstart/)
- [Amazon SageMaker Pipelines](https://aws.amazon.com/sagemaker/ai/pipelines/)
- [Amazon SageMaker Autopilot](https://aws.amazon.com/sagemaker/ai/autopilot/)
- [Amazon SageMaker Clarify](https://aws.amazon.com/sagemaker/ai/clarify/)
- [Amazon SageMaker — Model Monitor](https://docs.aws.amazon.com/sagemaker/latest/dg/model-monitor.html)
- [Amazon SageMaker Ground Truth](https://aws.amazon.com/sagemaker/data-labeling/)
- [Amazon SageMaker HyperPod](https://aws.amazon.com/sagemaker/ai/hyperpod/)
- [Amazon Augmented AI](https://aws.amazon.com/augmented-ai/)
- [Amazon Comprehend](https://aws.amazon.com/comprehend/)
- [Amazon Comprehend Medical](https://aws.amazon.com/comprehend/medical/)
- [Amazon Rekognition](https://aws.amazon.com/rekognition/)
- [Amazon Textract](https://aws.amazon.com/textract/)
- [Amazon Transcribe](https://aws.amazon.com/transcribe/)
- [Amazon Translate](https://aws.amazon.com/translate/)
- [Amazon Polly](https://aws.amazon.com/polly/)
- [Amazon Lex](https://aws.amazon.com/lex/)
- [Amazon Kendra](https://aws.amazon.com/kendra/) — verificar disponibilidade
- [Amazon Personalize](https://aws.amazon.com/personalize/)
- [Amazon Q Developer](https://aws.amazon.com/q/developer/) — verificar disponibilidade
- [Amazon Q Business](https://aws.amazon.com/q/business/) — verificar disponibilidade
- [Amazon Nova](https://aws.amazon.com/nova/)
- [AWS Trainium](https://aws.amazon.com/ai/machine-learning/trainium/)
- [AWS Inferentia](https://aws.amazon.com/ai/machine-learning/inferentia/)
- [AWS Neuron](https://aws.amazon.com/ai/machine-learning/neuron/)
- [AWS HealthLake](https://aws.amazon.com/healthlake/)
- [AWS HealthScribe](https://aws.amazon.com/healthscribe/)
- [AWS HealthImaging](https://aws.amazon.com/healthimaging/)
- [AWS HealthOmics](https://aws.amazon.com/healthomics/)

### Desenvolvimento (15)

- [AWS CodeBuild](https://aws.amazon.com/codebuild/)
- [AWS CodePipeline](https://aws.amazon.com/codepipeline/)
- [AWS CodeDeploy](https://aws.amazon.com/codedeploy/)
- [AWS CodeArtifact](https://aws.amazon.com/codeartifact/)
- [AWS CodeCommit](https://aws.amazon.com/codecommit/)
- [AWS CloudShell](https://aws.amazon.com/cloudshell/)
- [AWS CLI](https://aws.amazon.com/cli/)
- [AWS SDKs](https://builder.aws.com/build/tools)
- [AWS SAM](https://aws.amazon.com/serverless/sam/)
- [AWS Infrastructure Composer](https://aws.amazon.com/infrastructure-composer/) — verificar disponibilidade
- [AWS Amplify](https://aws.amazon.com/amplify/)
- [AWS App Studio](https://aws.amazon.com/appstudio/)
- [AWS Device Farm](https://aws.amazon.com/device-farm/)
- [Amazon Corretto](https://aws.amazon.com/corretto/)
- [Kiro](https://kiro.dev/)

### Migração e recuperação (7)

- [AWS Application Migration Service](https://aws.amazon.com/application-migration-service/)
- [AWS Database Migration Service](https://aws.amazon.com/dms/)
- [AWS Schema Conversion Tool](https://aws.amazon.com/dms/features/)
- [AWS Elastic Disaster Recovery](https://aws.amazon.com/disaster-recovery/)
- [AWS Mainframe Modernization](https://aws.amazon.com/mainframe-modernization/) — verificar disponibilidade
- [AWS Transform](https://aws.amazon.com/transform/)
- [AWS Migration Evaluator](https://aws.amazon.com/migration-evaluator/)

### IoT (9)

- [AWS IoT Core](https://aws.amazon.com/iot-core/)
- [AWS IoT Greengrass](https://aws.amazon.com/greengrass/) — verificar disponibilidade
- [AWS IoT Device Management](https://aws.amazon.com/iot-device-management/)
- [AWS IoT Device Defender](https://aws.amazon.com/iot-device-defender/) — verificar disponibilidade
- [AWS IoT SiteWise](https://aws.amazon.com/iot-sitewise/)
- [AWS IoT TwinMaker](https://aws.amazon.com/iot-twinmaker/)
- [FreeRTOS](https://aws.amazon.com/freertos/)
- [AWS IoT ExpressLink](https://aws.amazon.com/iot-expresslink/)
- [Amazon Kinesis Video Streams](https://aws.amazon.com/kinesis/video-streams/)

### Aplicações e comunicação (13)

- [Amazon Connect](https://aws.amazon.com/products/connect/customer/)
- [Amazon Connect — Customer Profiles](https://docs.aws.amazon.com/connect/latest/adminguide/customer-profiles.html)
- [Amazon Connect — Cases](https://docs.aws.amazon.com/connect/latest/adminguide/cases.html)
- [Amazon Connect — Contact Lens](https://aws.amazon.com/products/connect/customer/conversational-analytics/)
- [Amazon SES](https://aws.amazon.com/ses/)
- [AWS End User Messaging](https://aws.amazon.com/end-user-messaging/)
- [Amazon Chime SDK](https://aws.amazon.com/chime/chime-sdk/) — verificar disponibilidade
- [Amazon WorkSpaces Personal](https://docs.aws.amazon.com/workspaces/latest/adminguide/amazon-workspaces.html)
- [Amazon WorkSpaces Pools](https://docs.aws.amazon.com/workspaces/latest/adminguide/set-up-pools-create.html)
- [Amazon WorkSpaces Core](https://aws.amazon.com/workspaces/vdi-partners/)
- [Amazon WorkSpaces Applications](https://aws.amazon.com/workspaces/applications/)
- [Amazon WorkSpaces Secure Browser](https://aws.amazon.com/workspaces/secure-browser/) — verificar disponibilidade
- [Amazon WorkSpaces Thin Client](https://aws.amazon.com/workspaces/thin-client/) — verificar disponibilidade

### Audiovisual (9)

- [AWS Elemental MediaConvert](https://aws.amazon.com/mediaconvert/)
- [AWS Elemental MediaLive](https://aws.amazon.com/medialive/)
- [AWS Elemental MediaPackage](https://aws.amazon.com/mediapackage/)
- [AWS Elemental MediaConnect](https://aws.amazon.com/mediaconnect/)
- [AWS Elemental MediaTailor](https://aws.amazon.com/mediatailor/)
- [Amazon IVS](https://aws.amazon.com/ivs/)
- [Amazon IVS — Real-Time Streaming](https://docs.aws.amazon.com/ivs/latest/RealTimeUserGuide/what-is.html)
- [AWS Deadline Cloud](https://aws.amazon.com/deadline-cloud/)
- [AWS Elemental Link](https://aws.amazon.com/elemental-link/)

### Serviços especializados (7)

- [Amazon Braket](https://aws.amazon.com/braket/)
- [AWS Ground Station](https://aws.amazon.com/ground-station/)
- [Amazon Managed Blockchain](https://aws.amazon.com/managed-blockchain/) — verificar disponibilidade
- [Amazon GameLift Servers](https://aws.amazon.com/gamelift/)
- [Amazon GameLift Streams](https://aws.amazon.com/gamelift/streams/)
- [Amazon Location Service](https://aws.amazon.com/location/)
- [Amazon Connect Decisions (antes AWS Supply Chain)](https://aws.amazon.com/products/connect/decisions/)

### Bedrock — aplicações e proteção (22)

- [Amazon Bedrock — Knowledge Bases](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html)
- [Amazon Bedrock — Agents](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [Amazon Bedrock — Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
- [Amazon Bedrock — Flows](https://docs.aws.amazon.com/bedrock/latest/userguide/flows.html)
- [Amazon Bedrock — Prompt Management](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-management.html)
- [Amazon Bedrock — Prompt Caching](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html)
- [Amazon Bedrock — Prompt Optimization](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-management-optimize.html)
- [Amazon Bedrock — Intelligent Prompt Routing](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-routing.html)
- [Amazon Bedrock — Cross-Region Inference](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html)
- [Amazon Bedrock — Inference Profiles](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html)
- [Amazon Bedrock — Provisioned Throughput](https://docs.aws.amazon.com/bedrock/latest/userguide/prov-throughput.html)
- [Amazon Bedrock — Batch Inference](https://docs.aws.amazon.com/bedrock/latest/userguide/batch-inference.html)
- [Amazon Bedrock — Model Evaluation](https://aws.amazon.com/bedrock/evaluations/)
- [Amazon Bedrock — RAG Evaluation](https://docs.aws.amazon.com/bedrock/latest/userguide/evaluation-kb.html)
- [Amazon Bedrock — Automated Reasoning Checks](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-automated-reasoning-checks.html)
- [Amazon Bedrock — Contextual Grounding Checks](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-contextual-grounding-check.html)
- [Amazon Bedrock — Converse API](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html)
- [Amazon Bedrock — Tool Use](https://docs.aws.amazon.com/bedrock/latest/userguide/tool-use.html)
- [Amazon Bedrock — Structured Outputs](https://docs.aws.amazon.com/bedrock/latest/userguide/structured-output.html)
- [Amazon Bedrock — Web Search](https://docs.aws.amazon.com/bedrock/latest/userguide/web-search.html)
- [Amazon Bedrock — Marketplace](https://docs.aws.amazon.com/bedrock/latest/userguide/amazon-bedrock-marketplace.html)
- [Amazon Bedrock — Rerank](https://docs.aws.amazon.com/bedrock/latest/userguide/rerank.html)

### Bedrock — dados e personalização (10)

- [Amazon Bedrock — Data Automation](https://docs.aws.amazon.com/bedrock/latest/userguide/bda.html)
- [Amazon Bedrock Data Automation — Blueprints](https://docs.aws.amazon.com/bedrock/latest/userguide/bda-idp.html)
- [Amazon Bedrock — Fine-tuning](https://docs.aws.amazon.com/bedrock/latest/userguide/custom-model-fine-tuning.html)
- [Amazon Bedrock — Continued Pre-training](https://aws.amazon.com/bedrock/faqs/)
- [Amazon Bedrock — Model Distillation](https://docs.aws.amazon.com/bedrock/latest/userguide/model-distillation.html)
- [Amazon Bedrock — Custom Model Import](https://docs.aws.amazon.com/bedrock/latest/userguide/model-customization-import-model.html)
- [Amazon Bedrock — Reinforcement Fine-tuning](https://docs.aws.amazon.com/bedrock/latest/userguide/reinforcement-fine-tuning.html)
- [Amazon Bedrock Knowledge Bases — GraphRAG](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-build-graphs.html)
- [Amazon Bedrock Knowledge Bases — Structured Data](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-build-structured.html)
- [Amazon Bedrock Knowledge Bases — Multimodal Retrieval](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-multimodal-prerequisites.html)

### Bedrock — AgentCore (13)

- [Amazon Bedrock AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html)
- [Amazon Bedrock AgentCore — Runtime](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agents-tools-runtime.html)
- [Amazon Bedrock AgentCore — Memory](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory.html)
- [Amazon Bedrock AgentCore — Gateway](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway.html)
- [Amazon Bedrock AgentCore — Identity](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/identity.html)
- [Amazon Bedrock AgentCore — Code Interpreter](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/code-interpreter-tool.html)
- [Amazon Bedrock AgentCore — Browser](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-tool.html)
- [Amazon Bedrock AgentCore — Observability](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/observability.html)
- [Amazon Bedrock AgentCore — Evaluations](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/evaluations.html)
- [Amazon Bedrock AgentCore — Policy](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy.html)
- [Amazon Bedrock AgentCore — Harness](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness.html)
- [Amazon Bedrock AgentCore — Payments](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/payments.html)
- [Amazon Bedrock AgentCore — Temporal Policies](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-temporal.html)
