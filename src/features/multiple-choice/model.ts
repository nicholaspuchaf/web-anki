export type MultipleChoice = {
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
};
export const optionLetters = ['A', 'B', 'C', 'D'] as const;
export function createMultipleChoice(): MultipleChoice {
  return { options: ['', '', '', ''], correctIndex: -1, explanation: '' };
}
export function parseMultipleChoice(input: unknown): MultipleChoice {
  if (!input || typeof input !== 'object')
    throw new Error('Questão de múltipla escolha inválida.');
  const value = input as MultipleChoice;
  if (
    !Array.isArray(value.options) ||
    value.options.length !== 4 ||
    value.options.some(
      (option) => typeof option !== 'string' || !option.trim(),
    ) ||
    !Number.isInteger(value.correctIndex) ||
    value.correctIndex < 0 ||
    value.correctIndex > 3 ||
    typeof value.explanation !== 'string'
  )
    throw new Error(
      'Preencha as quatro alternativas e marque uma única resposta correta.',
    );
  const options = value.options.map((option) =>
    option.trim(),
  ) as MultipleChoice['options'];
  if (new Set(options.map((option) => option.toLocaleLowerCase())).size !== 4)
    throw new Error('As quatro alternativas devem ser diferentes.');
  return {
    options,
    correctIndex: value.correctIndex,
    explanation: value.explanation.trim(),
  };
}
