export type FaceKind = 'hint' | 'solution' | 'answer' | 'notes' | 'complexity';
export type CardFace = {
  id: string;
  kind: FaceKind;
  title: string;
  content: string;
  language: string;
};
export type LeetCode = {
  difficulty: 'easy' | 'medium' | 'hard';
  url: string;
  number: string;
  tags: string[];
  constraints: string;
  accent: 'forest' | 'indigo' | 'amber';
  faces: CardFace[];
};
export const faceLabels: Record<FaceKind, string> = {
  hint: 'Dica',
  solution: 'Código da solução',
  answer: 'Minha resposta',
  notes: 'Notas extras',
  complexity: 'Complexidade',
};
export const difficultyLabels = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil',
};
export function createFace(kind: FaceKind): CardFace {
  return {
    id: crypto.randomUUID(),
    kind,
    title: faceLabels[kind],
    content: '',
    language: kind === 'solution' ? 'python' : '',
  };
}
export function createLeetCode(): LeetCode {
  return {
    difficulty: 'medium',
    url: '',
    number: '',
    tags: [],
    constraints: '',
    accent: 'forest',
    faces: [
      createFace('hint'),
      createFace('answer'),
      createFace('solution'),
      createFace('complexity'),
    ],
  };
}
export function normalizeTags(text: string): string[] {
  return [
    ...new Set(
      text
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}
export function safeProblemUrl(text: string): boolean {
  if (!text) return true;
  try {
    const url = new URL(text);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

// Strictly validate external data; never spread unknown backup properties.
export function parseLeetCode(value: unknown): LeetCode {
  if (!value || typeof value !== 'object')
    throw new Error('Template LeetCode inválido.');
  const x = value as Record<string, unknown>;
  const stringFields = ['url', 'number', 'constraints'] as const;
  if (
    stringFields.some((key) => typeof x[key] !== 'string') ||
    ['examples', 'timeComplexity', 'spaceComplexity'].some(
      (key) => x[key] !== undefined && typeof x[key] !== 'string',
    ) ||
    !['easy', 'medium', 'hard'].includes(String(x.difficulty)) ||
    !['forest', 'indigo', 'amber'].includes(String(x.accent)) ||
    !Array.isArray(x.tags) ||
    x.tags.some((t) => typeof t !== 'string' || !t.trim()) ||
    !Array.isArray(x.faces) ||
    !safeProblemUrl(x.url as string)
  )
    throw new Error('Campos do template LeetCode inválidos.');
  const ids = new Set<string>();
  const faces = x.faces.map((raw: unknown) => {
    if (!raw || typeof raw !== 'object') throw new Error('Verso inválido.');
    const f = raw as Record<string, unknown>;
    if (
      typeof f.id !== 'string' ||
      !f.id ||
      ids.has(f.id) ||
      !Object.hasOwn(faceLabels, String(f.kind)) ||
      typeof f.title !== 'string' ||
      typeof f.content !== 'string' ||
      typeof f.language !== 'string'
    )
      throw new Error('Verso inválido.');
    ids.add(f.id);
    return {
      id: f.id,
      kind: f.kind as FaceKind,
      title: f.title.trim() || faceLabels[f.kind as FaceKind],
      content: f.content,
      language: f.language,
    };
  });
  // Move the previous metadata fields into a dedicated, revealable face.
  if (x.timeComplexity || x.spaceComplexity) {
    let id = 'legacy-complexity';
    while (ids.has(id)) id += '-';
    faces.push({
      id,
      kind: 'complexity',
      title: faceLabels.complexity,
      language: '',
      content: [
        x.timeComplexity ? `Tempo: ${x.timeComplexity}` : '',
        x.spaceComplexity ? `Espaço: ${x.spaceComplexity}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    });
  }
  return {
    difficulty: x.difficulty as LeetCode['difficulty'],
    accent: x.accent as LeetCode['accent'],
    url: x.url as string,
    number: x.number as string,
    constraints: x.constraints as string,
    tags: [...new Set((x.tags as string[]).map((t) => t.trim().toLowerCase()))],
    faces,
  };
}

export function getAvailableFaces(data: LeetCode): CardFace[] {
  return data.faces.filter((face) => face.content.trim().length > 0);
}
