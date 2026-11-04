export type StudyFace = { id: string; title: string; content: string };
export function createStudyFaces(): StudyFace[] {
  return [
    { id: crypto.randomUUID(), title: 'Resposta', content: '' },
    { id: crypto.randomUUID(), title: 'Exemplo de uso', content: '' },
  ];
}
export function parseStudyFaces(value: unknown): StudyFace[] {
  if (!Array.isArray(value)) throw new Error('Versos inválidos.');
  const ids = new Set<string>();
  return value.map((face: unknown, index) => {
    if (!face || typeof face !== 'object') throw new Error('Verso inválido.');
    const x = face as StudyFace;
    if (
      typeof x.id !== 'string' ||
      !x.id ||
      ids.has(x.id) ||
      typeof x.title !== 'string' ||
      typeof x.content !== 'string'
    )
      throw new Error('Verso inválido ou duplicado.');
    ids.add(x.id);
    return {
      id: x.id,
      title: x.title.trim() || `Verso ${index + 1}`,
      content: x.content,
    };
  });
}
export function filledFaces(faces: StudyFace[]): StudyFace[] {
  return faces.filter((face) => face.content.trim());
}
