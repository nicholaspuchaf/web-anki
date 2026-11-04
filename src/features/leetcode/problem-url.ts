export function problemLink(input: string): { slug: string; url: string } {
  try {
    if (input.length > 2048) throw new Error();
    const url = new URL(input.trim());
    const match = /^\/problems\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/|$)/.exec(
      url.pathname,
    );
    if (
      url.protocol !== 'https:' ||
      !['leetcode.com', 'www.leetcode.com'].includes(url.hostname) ||
      url.username ||
      url.password ||
      url.port ||
      !match ||
      match[1].length > 150
    )
      throw new Error();
    return {
      slug: match[1],
      url: `https://leetcode.com/problems/${match[1]}/`,
    };
  } catch {
    throw new Error(
      'Use um link HTTPS de problema do leetcode.com, como https://leetcode.com/problems/two-sum/.',
    );
  }
}
export type ImportedProblem = {
  slug: string;
  url: string;
  title: string;
  number: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  content_html: string;
};
// Shared by the upstream adapter and the browser; unknown fields are discarded.
export function parseImportedProblem(
  input: unknown,
  slug: string,
): ImportedProblem {
  if (!input || typeof input !== 'object')
    throw new Error('Resposta inválida do LeetCode.');
  const x = input as ImportedProblem;
  if (
    x.slug !== slug ||
    x.url !== `https://leetcode.com/problems/${slug}/` ||
    typeof x.title !== 'string' ||
    !x.title.trim() ||
    x.title.length > 300 ||
    typeof x.number !== 'string' ||
    !x.number.trim() ||
    x.number.length > 20 ||
    !['easy', 'medium', 'hard'].includes(x.difficulty) ||
    !Array.isArray(x.tags) ||
    x.tags.length > 100 ||
    x.tags.some(
      (tag) => typeof tag !== 'string' || !tag.trim() || tag.length > 80,
    ) ||
    typeof x.content_html !== 'string' ||
    !x.content_html.trim() ||
    x.content_html.length > 100_000
  )
    throw new Error('Resposta inválida do LeetCode.');
  return {
    slug,
    url: x.url,
    title: x.title.trim(),
    number: x.number.trim(),
    difficulty: x.difficulty,
    tags: [...new Set(x.tags.map((tag) => tag.trim().toLowerCase()))],
    content_html: x.content_html,
  };
}
