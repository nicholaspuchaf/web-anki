import mc714 from '../../content/decks/mc714/deck.json' with { type: 'json' };
import mc714Revisao from '../../content/decks/mc714-revisao/deck.json' with { type: 'json' };

export function deckTagPolicy(deckId?: string) {
  return [mc714, mc714Revisao].find((deck) => deck.id === deckId)?.tagPolicy;
}
/** Required tags cannot be removed; assessment selection must be unambiguous. */
export function enforceDeckTags(
  deckId: string | undefined,
  tags: readonly string[] = [],
): string[] {
  const normalized = [
    ...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)),
  ];
  const policy = deckTagPolicy(deckId);
  if (!policy) return normalized;
  const assessments = policy.oneOf.filter((tag) => normalized.includes(tag));
  if (assessments.length > 1)
    throw new Error('Escolha exatamente uma avaliação: p1, p2 ou p3.');
  return [
    ...new Set([
      ...policy.required,
      ...normalized,
      assessments[0] ?? policy.default,
    ]),
  ];
}
