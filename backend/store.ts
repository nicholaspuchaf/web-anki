import {
  GetCommand,
  PutCommand,
  QueryCommand,
  type DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import {
  LIBRARY_ID,
  SYNC_INDEX,
  cardKey,
  type FlashcardStore,
  type PageKey,
  type StoredFlashcard,
} from './model';

export function createDynamoStore(
  client: Pick<DynamoDBDocumentClient, 'send'>,
  table: string,
): FlashcardStore {
  return {
    async get(id) {
      const result = await client.send(
        new GetCommand({
          TableName: table,
          Key: { pk: cardKey(id) },
          ConsistentRead: true,
        }),
      );
      return (result.Item as StoredFlashcard | undefined) ?? null;
    },
    async put(item, expectedVersion) {
      try {
        await client.send(
          new PutCommand({
            TableName: table,
            Item: item,
            ConditionExpression:
              expectedVersion === 0
                ? 'attribute_not_exists(pk)'
                : '#version = :expected',
            ...(expectedVersion === 0
              ? {}
              : {
                  ExpressionAttributeNames: { '#version': 'version' },
                  ExpressionAttributeValues: { ':expected': expectedVersion },
                }),
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
    async changes(query) {
      const result = await client.send(
        new QueryCommand({
          TableName: table,
          IndexName: SYNC_INDEX,
          KeyConditionExpression:
            'library_id = :library AND last_updated_at BETWEEN :from AND :until',
          ExpressionAttributeValues: {
            ':library': LIBRARY_ID,
            ':from': query.from,
            ':until': query.until,
          },
          Limit: query.limit,
          ScanIndexForward: true,
          ...(query.after ? { ExclusiveStartKey: query.after } : {}),
        }),
      );
      return {
        items: (result.Items ?? []) as StoredFlashcard[],
        ...(result.LastEvaluatedKey
          ? { next: result.LastEvaluatedKey as PageKey }
          : {}),
      };
    },
  };
}
