import { expect, test } from 'bun:test';
import { CloudError, createCloudApi, type HttpRequest } from './api';
import { cloudFixture, START } from '../../../tests/helpers/cloud';
import type { CardContent } from './model';

const content: CardContent = {
  card: {
    id: 'c',
    deckId: 'd',
    front: 'Two Sum',
    back: '',
    due: 0,
    reviews: 0,
    interval: 0,
  },
  deck: { id: 'd', name: 'Algoritmos' },
};
test('cliente usa o contrato real do backend para criar, atualizar, paginar e excluir', async () => {
  const { api, advance, calls } = cloudFixture();
  expect((await api.put('c', content, 0)).version).toBe(1);
  expect((await api.get('c')).flashcard_id).toBe('c');
  advance();
  expect((await api.put('c', content, 1)).version).toBe(2);
  expect((await api.changes({ since: START })).changes).toHaveLength(1);
  expect(calls.at(-1)?.query.since).toBe(START);
  expect((await api.delete('c', 2)).deleted_at).not.toBeNull();
  expect(calls.map((call) => call.path)).not.toContain('/library');
});
test('cliente preserva conflito e rejeita respostas de sincronização ou cartões inválidos', async () => {
  const { api } = cloudFixture();
  await api.put('c', content, 0);
  await expect(api.put('c', content, 0)).rejects.toMatchObject({ status: 409 });
  expect(new CloudError('erro', 409)).toBeInstanceOf(Error);
  for (const invalid of [
    {},
    { changes: [], next_cursor: null, last_sync_at: null },
    { changes: [], next_cursor: 'next', last_sync_at: START },
    {
      changes: [{ flashcard_id: 'c', version: 1 }],
      next_cursor: null,
      last_sync_at: START,
    },
  ]) {
    const request: HttpRequest = async () => Response.json(invalid);
    await expect(
      createCloudApi('https://api.example', request).changes(),
    ).rejects.toThrow();
  }
  const mismatched: HttpRequest = async () =>
    Response.json({
      flashcard_id: 'other',
      last_updated_at: START,
      deleted_at: START,
      version: 1,
    });
  await expect(
    createCloudApi('https://api.example', mismatched).get('c'),
  ).rejects.toThrow();
});
