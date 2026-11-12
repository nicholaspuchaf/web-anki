import { expect, test } from 'bun:test';
import {
  DEFAULT_STUDY_PREFERENCES,
  parseStudyPreferences,
  studyMilestones,
} from './study-plan';
import { schedule } from '../review/scheduler';
import { withBundledDecks } from '../bundled-decks/catalog';
import { emptyLibrary } from '../library/model';
import { parseBackup } from '../backup/parse-backup';
import { activeLibrary } from './model';

test('preferências recuperam valores seguros sem descartar campos válidos', () => {
  for (const raw of [null, '{', 'null', '[]', 'false', '{}'])
    expect(parseStudyPreferences(raw)).toEqual(DEFAULT_STUDY_PREFERENCES);
  expect(
    parseStudyPreferences('{"dailyGoal":35,"spacingMultiplier":1.75}'),
  ).toEqual({ dailyGoal: 35, spacingMultiplier: 1.75 });
  for (const dailyGoal of [0, -1, 201, 1.5, '20'])
    expect(
      parseStudyPreferences(
        JSON.stringify({ dailyGoal, spacingMultiplier: 2 }),
      ),
    ).toEqual({ dailyGoal: 20, spacingMultiplier: 2 });
  for (const spacingMultiplier of [0, 5, 1.1, '2', null])
    expect(
      parseStudyPreferences(
        JSON.stringify({ dailyGoal: 10, spacingMultiplier }),
      ),
    ).toEqual({ dailyGoal: 10, spacingMultiplier: 1 });
});

test('projeção arredonda por dias de esforço e respeita baralhos ativos', () => {
  const library = withBundledDecks(emptyLibrary);
  const active = activeLibrary(library, ['builtin-patterns-design']);
  const milestones = studyMilestones(active.cards, 20);
  expect(milestones.map((m) => m.reviews)).toEqual([
    active.cards.length,
    active.cards.length * 2,
    active.cards.length * 3,
  ]);
  expect(milestones.map((m) => m.days)).toEqual(
    [1, 2, 3].map((n) => Math.ceil((active.cards.length * n) / 20)),
  );
  expect(studyMilestones([], 1).map((m) => m.days)).toEqual([0, 0, 0]);
  for (const invalid of [0, NaN, 201, 1.5])
    expect(() => studyMilestones([], invalid)).toThrow();
});

test('backup e atualização de conteúdo mantêm a escala junto do progresso e rejeitam dados inválidos', () => {
  const library = withBundledDecks(emptyLibrary);
  library.cards[0] = schedule(
    { ...library.cards[0], favorite: true },
    'good',
    1000,
    2.25,
  );
  const next = withBundledDecks(parseBackup(JSON.stringify(library)));
  expect(next.cards.find((c) => c.id === library.cards[0].id)).toEqual(
    library.cards[0],
  );
  for (const invalid of [0, 5, 1.1, '2', null]) {
    const bad = structuredClone(library);
    Object.assign(bad.cards[0], { spacingMultiplier: invalid });
    expect(() => parseBackup(JSON.stringify(bad))).toThrow('Cartão inválido');
  }
});
