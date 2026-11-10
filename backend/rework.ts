import {
  PutCommand,
  QueryCommand,
  type DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import { SYNC_INDEX } from './model';

export const REWORK_PARTITION = 'REWORK';
export type ReworkRequest = {
  flashcard_id: string;
  deck_id: string;
  question: string;
  source_url?: string;
  requested_at: string;
  status: 'pending';
};
export type ReworkKey = {
  pk: string;
  library_id: typeof REWORK_PARTITION;
  last_updated_at: string;
};
export type StoredRework = ReworkRequest & ReworkKey;
export interface ReworkStore {
  mark(item: StoredRework): Promise<boolean>;
  list(
    limit: number,
    after?: ReworkKey,
  ): Promise<{ items: ReworkRequest[]; next?: ReworkKey }>;
}
export const reworkKey = (id: string) => `REWORK#${id}`;
export function createReworkStore(
  client: Pick<DynamoDBDocumentClient, 'send'>,
  table: string,
): ReworkStore {
  return {
    async mark(item) {
      try {
        await client.send(
          new PutCommand({
            TableName: table,
            Item: item,
            ConditionExpression: 'attribute_not_exists(pk)',
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
    async list(limit, after) {
      const result = await client.send(
        new QueryCommand({
          TableName: table,
          IndexName: SYNC_INDEX,
          KeyConditionExpression: 'library_id = :partition',
          ExpressionAttributeValues: { ':partition': REWORK_PARTITION },
          Limit: limit,
          ScanIndexForward: true,
          ...(after ? { ExclusiveStartKey: after } : {}),
        }),
      );
      // Select public fields explicitly: the sync keys are not part of this API.
      const items = ((result.Items ?? []) as StoredRework[]).map((item) => ({
        flashcard_id: item.flashcard_id,
        deck_id: item.deck_id,
        question: item.question,
        ...(item.source_url ? { source_url: item.source_url } : {}),
        requested_at: item.requested_at,
        status: item.status,
      }));
      return {
        items,
        ...(result.LastEvaluatedKey
          ? { next: result.LastEvaluatedKey as ReworkKey }
          : {}),
      };
    },
  };
}
