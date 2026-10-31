import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  createHandler,
  type SnapshotStore,
  type StoredSnapshot,
} from './service';

const table = process.env.TABLE_NAME!;
const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ maxAttempts: 3 }),
);
const store: SnapshotStore = {
  async get() {
    const result = await client.send(
      new GetCommand({
        TableName: table,
        Key: { pk: 'PUBLIC_LIBRARY' },
        ConsistentRead: true,
      }),
    );
    return (result.Item as StoredSnapshot | undefined) ?? null;
  },
  async put(snapshot, expected) {
    try {
      await client.send(
        new PutCommand({
          TableName: table,
          Item: { pk: 'PUBLIC_LIBRARY', ...snapshot },
          ConditionExpression:
            expected === '0'
              ? 'attribute_not_exists(pk)'
              : 'revision = :expected',
          ...(expected === '0'
            ? {}
            : { ExpressionAttributeValues: { ':expected': expected } }),
        }),
      );
      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'ConditionalCheckFailedException'
      )
        return false;
      throw error;
    }
  },
};
export const handler = createHandler(
  store,
  JSON.parse(process.env.ALLOWED_ORIGINS ?? '[]'),
);
