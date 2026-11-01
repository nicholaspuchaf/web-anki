import { expect, test } from 'bun:test';
import type { Library } from '../library/model';
import { emptyLibrary } from '../library/model';
import { createSyncEngine } from './engine';
import { createCloudApi } from './api';
import { cloudFixture, API_URL, START } from '../../../tests/helpers/cloud';
import {
  emptySyncState,
  pendingIds,
  type CardContent,
  type CloudCard,
} from './model';
import type {
  ClientSnapshot,
  SyncRepository,
} from '../../shared/storage/library-repository';

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
  deck: { id: 'd', name: 'LeetCode' },
};
function local(library: Library = structuredClone(emptyLibrary)) {
  let snapshot: ClientSnapshot = {
    library,
    state: emptySyncState(),
    revision: 0,
  };
  const repository: SyncRepository = {
    async read() {
      return structuredClone(snapshot);
    },
    async commit(expected, library, state) {
      if (expected !== snapshot.revision) return false;
      snapshot = structuredClone({ library, state, revision: expected + 1 });
      return true;
    },
  };
  return {
    repository,
    edit(change: (library: Library) => Library) {
      snapshot.library = change(snapshot.library);
      snapshot.revision++;
    },
  };
}
function libraryOf(value = content): Library {
  return { version: 1, cards: [value.card], decks: [value.deck] };
}

test('primeiro envio publica cartões locais; sync seguinte usa checkpoint sem reenviar nada', async () => {
  const cloud = cloudFixture();
  const client = local(libraryOf());
  const engine = createSyncEngine(cloud.api, client.repository, cloud.now);
  expect((await engine.sync()).sent).toBe(1);
  const first = await client.repository.read();
  expect(first.state.last_sync_at).toBe(START);
  expect(first.state.records.c.version).toBe(1);
  expect(pendingIds(first.library, first.state)).toEqual([]);
  cloud.advance();
  expect((await engine.sync()).sent).toBe(0);
  expect(cloud.calls.filter((call) => call.method === 'PUT')).toHaveLength(1);
  expect(
    cloud.calls.filter((call) => call.path === '/sync').at(-1)?.query,
  ).toEqual({ since: START });
});

test('dois aparelhos recebem apenas alterações e exclusões, preservando tombstones localmente', async () => {
  const cloud = cloudFixture();
  const a = local(libraryOf());
  const b = local();
  const ea = createSyncEngine(cloud.api, a.repository, cloud.now);
  const eb = createSyncEngine(cloud.api, b.repository, cloud.now);
  await ea.sync();
  await eb.sync();
  a.edit((library) => ({
    ...library,
    cards: [{ ...library.cards[0], back: 'Hash map' }],
  }));
  cloud.advance();
  await ea.sync();
  await eb.sync();
  expect((await b.repository.read()).library.cards[0].back).toBe('Hash map');
  a.edit((library) => ({ ...library, cards: [] }));
  cloud.advance();
  await ea.sync();
  await eb.sync();
  const deleted = await b.repository.read();
  expect(deleted.library.cards).toEqual([]);
  expect(deleted.state.records.c.deleted_at).not.toBeNull();
  expect(pendingIds(deleted.library, deleted.state)).toEqual([]);
  expect(cloud.calls.filter((call) => call.method === 'DELETE')).toHaveLength(
    1,
  );
});

test('conflito preserva edição offline após reload e permite manter local ou aceitar nuvem', async () => {
  const cloud = cloudFixture();
  await cloud.api.put('c', content, 0);
  const a = local();
  let engine = createSyncEngine(cloud.api, a.repository, cloud.now);
  await engine.sync();
  a.edit((library) => ({
    ...library,
    cards: [{ ...library.cards[0], back: 'Meu raciocínio' }],
  }));
  cloud.advance();
  await cloud.api.put(
    'c',
    { ...content, card: { ...content.card, back: 'Outra resposta' } },
    1,
  );
  await engine.sync();
  let snapshot = await a.repository.read();
  expect(snapshot.library.cards[0].back).toBe('Meu raciocínio');
  expect(snapshot.state.conflicts.c.version).toBe(2);
  engine = createSyncEngine(cloud.api, a.repository, cloud.now);
  await engine.resolve('c', 'local');
  await engine.sync();
  expect(await cloud.api.get('c')).toMatchObject({
    version: 3,
    card: { back: 'Meu raciocínio' },
  });
  a.edit((library) => ({ ...library, cards: [] }));
  cloud.advance();
  await cloud.api.put('c', content, 3);
  await engine.sync();
  snapshot = await a.repository.read();
  expect(snapshot.library.cards).toEqual([]);
  expect(snapshot.state.conflicts.c.version).toBe(4);
  await engine.resolve('c', 'remote');
  expect((await a.repository.read()).library.cards[0].back).toBe('');
});

test('paginação interrompida não grava cartões nem checkpoint; retry mescla todas as páginas', async () => {
  const cloud = cloudFixture();
  for (let i = 0; i < 26; i++)
    await cloud.api.put(
      `c${i}`,
      { ...content, card: { ...content.card, id: `c${i}` } },
      0,
    );
  const client = local();
  let fail = true;
  const api = createCloudApi(API_URL, async (input, options) => {
    if (String(input).includes('cursor=') && fail) throw new Error('Offline');
    return cloud.request(input, options);
  });
  const engine = createSyncEngine(api, client.repository, cloud.now);
  await expect(engine.sync()).rejects.toThrow('Offline');
  expect((await client.repository.read()).state.last_sync_at).toBeNull();
  expect((await client.repository.read()).library.cards).toHaveLength(0);
  fail = false;
  await engine.sync();
  expect((await client.repository.read()).library.cards).toHaveLength(26);
  expect((await client.repository.read()).state.last_sync_at).toBe(START);
});

test('escrita aceita seguida de timeout é recuperada sem duplicação ou reenvio', async () => {
  const cloud = cloudFixture();
  const client = local(libraryOf());
  let fail = true;
  const api = createCloudApi(API_URL, async (input, options) => {
    const response = await cloud.request(input, options);
    if (options?.method === 'PUT' && fail) {
      fail = false;
      throw new Error('Timeout');
    }
    return response;
  });
  const engine = createSyncEngine(api, client.repository, cloud.now);
  await expect(engine.sync()).rejects.toThrow('Timeout');
  expect((await client.repository.read()).state.records.c).toBeUndefined();
  await engine.sync();
  expect(cloud.records.get('c')?.version).toBe(1);
  expect(
    pendingIds(
      (await client.repository.read()).library,
      (await client.repository.read()).state,
    ),
  ).toEqual([]);
});

test('409 entre leitura e escrita consulta versão atual sem sobrescrever cartão remoto', async () => {
  const cloud = cloudFixture();
  const client = local(libraryOf());
  let race = true;
  const api = createCloudApi(API_URL, async (input, options) => {
    if (options?.method === 'PUT' && race) {
      race = false;
      await cloud.api.put(
        'c',
        { ...content, card: { ...content.card, front: 'Outro cartão' } },
        0,
      );
    }
    return cloud.request(input, options);
  });
  await createSyncEngine(api, client.repository, cloud.now).sync();
  const snapshot = await client.repository.read();
  expect(snapshot.state.conflicts.c.version).toBe(1);
  expect(snapshot.library.cards[0].front).toBe('Two Sum');
  expect(cloud.records.get('c')).toMatchObject({
    version: 1,
    card: { front: 'Outro cartão' },
  });
});

test('ack preserva edições feitas durante request e não avança checkpoint com data do cartão', async () => {
  const cloud = cloudFixture();
  const client = local(libraryOf());
  const api = createCloudApi(API_URL, async (input, options) => {
    if (options?.method === 'PUT') {
      cloud.advance(60_000);
      client.edit((library) => ({
        ...library,
        cards: [{ ...library.cards[0], back: 'Editado durante envio' }],
      }));
    }
    return cloud.request(input, options);
  });
  await createSyncEngine(api, client.repository, cloud.now).sync();
  const snapshot = await client.repository.read();
  expect(snapshot.library.cards[0].back).toBe('Editado durante envio');
  expect(snapshot.state.last_sync_at).toBe(START);
  expect(snapshot.state.records.c.last_updated_at).toBe(
    '2026-11-01T10:01:00.000Z',
  );
  expect(pendingIds(snapshot.library, snapshot.state)).toEqual(['c']);
});

test('reconciliação diária recupera item atrasado além da janela e ausência não implica exclusão', async () => {
  const cloud = cloudFixture();
  await cloud.api.put('c', content, 0);
  const changes = cloud.store.changes;
  let hidden = true;
  cloud.store.changes = async (query) => {
    const result = await changes(query);
    return { ...result, items: hidden ? [] : result.items };
  };
  const client = local();
  const engine = createSyncEngine(cloud.api, client.repository, cloud.now);
  await engine.sync();
  cloud.advance(10 * 60_000);
  await engine.sync();
  hidden = false;
  cloud.advance();
  await engine.sync();
  expect((await client.repository.read()).library.cards).toHaveLength(0);
  cloud.advance(24 * 60 * 60_000);
  await engine.sync();
  expect(
    cloud.calls.filter((call) => call.path === '/sync').at(-1)?.query,
  ).toEqual({});
  expect((await client.repository.read()).library.cards).toHaveLength(1);
  hidden = true;
  await engine.sync(true);
  expect((await client.repository.read()).library.cards).toHaveLength(1);
});

test('metadados remotos mais antigos não ressuscitam cartão excluído', async () => {
  const cloud = cloudFixture();
  const client = local(libraryOf());
  const engine = createSyncEngine(cloud.api, client.repository, cloud.now);
  await engine.sync();
  const old = structuredClone(cloud.records.get('c')!);
  client.edit((library) => ({ ...library, cards: [] }));
  cloud.advance();
  await engine.sync();
  cloud.records.set('c', old);
  await engine.sync(true);
  expect((await client.repository.read()).library.cards).toEqual([]);
  expect((await client.repository.read()).state.records.c.version).toBe(2);
});

test('IDs especiais não alteram protótipos nem criam pendências fictícias', async () => {
  const cloud = cloudFixture();
  const id = '__proto__';
  const client = local(
    libraryOf({ ...content, card: { ...content.card, id } }),
  );
  await createSyncEngine(cloud.api, client.repository, cloud.now).sync();
  const snapshot = await client.repository.read();
  expect(Object.hasOwn(snapshot.state.records, id)).toBe(true);
  expect(pendingIds(snapshot.library, snapshot.state)).toEqual([]);
  expect((snapshot.state.records[id] as CloudCard).version).toBe(1);
});

test('renomear baralho remoto não cria conflitos falsos entre cartões da mesma página', async () => {
  const cloud = cloudFixture();
  await cloud.api.put('c', content, 0);
  await cloud.api.put(
    'other',
    { ...content, card: { ...content.card, id: 'other' } },
    0,
  );
  const client = local();
  const engine = createSyncEngine(cloud.api, client.repository, cloud.now);
  await engine.sync();
  cloud.advance();
  await cloud.api.put(
    'c',
    { ...content, deck: { ...content.deck, name: 'Novo nome' } },
    1,
  );
  await cloud.api.put(
    'other',
    {
      card: { ...content.card, id: 'other' },
      deck: { ...content.deck, name: 'Novo nome' },
    },
    1,
  );
  await engine.sync();
  const snapshot = await client.repository.read();
  expect(snapshot.library.decks[0].name).toBe('Novo nome');
  expect(Object.keys(snapshot.state.conflicts)).toHaveLength(0);
  expect(pendingIds(snapshot.library, snapshot.state)).toHaveLength(0);
});

test('confirmações parciais persistem e uma falha posterior só deixa os cartões restantes pendentes', async () => {
  const cloud = cloudFixture();
  const library = libraryOf();
  library.cards.push({ ...content.card, id: 'second' });
  const client = local(library);
  let fail = true;
  const api = createCloudApi(API_URL, async (input, options) => {
    if (String(input).endsWith('/second') && options?.method === 'PUT' && fail)
      throw new Error('Offline');
    return cloud.request(input, options);
  });
  const engine = createSyncEngine(api, client.repository, cloud.now);
  await expect(engine.sync()).rejects.toThrow('Offline');
  const snapshot = await client.repository.read();
  expect(pendingIds(snapshot.library, snapshot.state)).toEqual(['second']);
  fail = false;
  await engine.sync();
  expect(cloud.records.get('c')?.version).toBe(1);
  expect(cloud.records.get('second')?.version).toBe(1);
});

test('versão remota sem mudança de conteúdo não bloqueia uma edição local', async () => {
  const cloud = cloudFixture();
  await cloud.api.put('c', content, 0);
  const client = local();
  const engine = createSyncEngine(cloud.api, client.repository, cloud.now);
  await engine.sync();
  client.edit((library) => ({
    ...library,
    cards: [{ ...library.cards[0], back: 'Editado localmente' }],
  }));
  cloud.advance();
  await cloud.api.put('c', content, 1);
  await engine.sync();
  expect(Object.keys((await client.repository.read()).state.conflicts)).toEqual(
    [],
  );
  expect(cloud.records.get('c')).toMatchObject({
    version: 3,
    card: { back: 'Editado localmente' },
  });
});

test('uma mudança entre leitura e commit causa nova mesclagem sem perder os dados da outra aba', async () => {
  const cloud = cloudFixture();
  await cloud.api.put('c', content, 0);
  const client = local();
  const commit = client.repository.commit;
  let race = true;
  client.repository.commit = async (revision, library, state) => {
    if (race) {
      race = false;
      client.edit(() =>
        libraryOf({ ...content, card: { ...content.card, id: 'other' } }),
      );
    }
    return commit(revision, library, state);
  };
  await createSyncEngine(cloud.api, client.repository, cloud.now).sync();
  const snapshot = await client.repository.read();
  expect(snapshot.library.cards.map((card) => card.id).sort()).toEqual([
    'c',
    'other',
  ]);
  expect(cloud.records.size).toBe(2);
});
