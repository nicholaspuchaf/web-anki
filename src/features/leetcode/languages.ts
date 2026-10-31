export const solutionLanguages = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'dart', label: 'Dart' },
  { value: 'scala', label: 'Scala' },
  { value: 'sql', label: 'SQL' },
] as const;
export function languageOptions(current: string) {
  // Preserve custom language names from earlier cards without offering free text.
  return solutionLanguages.some((option) => option.value === current)
    ? solutionLanguages
    : [
        ...solutionLanguages,
        {
          value: current,
          label: current
            ? `${current} (salvo anteriormente)`
            : 'Selecionar linguagem',
        },
      ];
}
