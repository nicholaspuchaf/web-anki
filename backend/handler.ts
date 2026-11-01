import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { createHandler } from './service';
import { createDynamoStore } from './store';

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ maxAttempts: 3 }),
);
export const handler = createHandler(
  createDynamoStore(client, process.env.TABLE_NAME!),
  JSON.parse(process.env.ALLOWED_ORIGINS ?? '[]'),
);
