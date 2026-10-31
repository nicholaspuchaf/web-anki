import { expect, test } from 'bun:test';
import { parseDescription } from './parse-description';

test('normaliza linhas vazias e organiza o texto colado do LeetCode sem alterar a origem', () => {
  const source =
    '\nTwo Sum\r\nYou are given an array.\r\n\r\n\r\n\u00a0\r\nYou can return any order.\r\n\r\nExample 1:\r\n\r\nInput: nums = [2,7], target = 9\r\n\r\nOutput: [0,1]\r\n\r\nExplanation:\r\n\r\nThe sum is 9.\r\n\r\nConstraints:\r\n\r\n    2 <= nums.length <= 104\r\n    Only one answer exists.\r\n\r\nFollow-up: Can you do better?';
  const parsed = parseDescription(source);
  expect(parsed.title).toBe('Two Sum');
  expect(parsed.blocks).toEqual([
    { kind: 'paragraph', text: 'You are given an array.' },
    { kind: 'paragraph', text: 'You can return any order.' },
    {
      kind: 'example',
      title: 'Exemplo 1',
      text: [],
      fields: [
        { label: 'Entrada', text: 'nums = [2,7], target = 9' },
        { label: 'Saída', text: '[0,1]' },
        { label: 'Explicação', text: 'The sum is 9.' },
      ],
    },
    {
      kind: 'constraints',
      items: ['2 <= nums.length <= 104', 'Only one answer exists.'],
    },
    { kind: 'followup', text: 'Can you do better?' },
  ]);
  expect(source).toContain('\r\n');
});

test('aceita português, exemplos em linha e enunciados livres', () => {
  expect(parseDescription('Título\nTexto\ncom quebra manual.').blocks).toEqual([
    { kind: 'paragraph', text: 'Texto com quebra manual.' },
  ]);
  expect(
    parseDescription(
      'Soma\nExemplo 2:\nEntrada: [3,3] Saída: [0,1]\nExplicação: soma 6\nRestrições:\n• Uma resposta\nDesafio adicional: Menos memória',
    ).blocks,
  ).toEqual([
    {
      kind: 'example',
      title: 'Exemplo 2',
      text: [],
      fields: [
        { label: 'Entrada', text: '[3,3]' },
        { label: 'Saída', text: '[0,1]' },
        { label: 'Explicação', text: 'soma 6' },
      ],
    },
    { kind: 'constraints', items: ['Uma resposta'] },
    { kind: 'followup', text: 'Menos memória' },
  ]);
  expect(parseDescription('Somente título')).toEqual({
    title: 'Somente título',
    blocks: [],
  });
});
