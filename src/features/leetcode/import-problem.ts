import { parseImportedProblem, problemLink } from './problem-url';

/** Parse in an inert template, extract only text, and never insert upstream HTML into the page. */
export function descriptionFromHtml(
  title: string,
  html: string,
): { text: string; hasImages: boolean } {
  const template = document.createElement('template');
  template.innerHTML = html;
  let hasImages = false;
  function text(node: Node, pre = false): string {
    if (node.nodeType === Node.TEXT_NODE)
      return pre
        ? (node.textContent ?? '')
        : (node.textContent ?? '').replace(/\s+/g, ' ');
    if (
      node.nodeType !== Node.ELEMENT_NODE &&
      node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE
    )
      return '';
    const tag =
      node.nodeType === Node.ELEMENT_NODE
        ? (node as Element).tagName.toLowerCase()
        : '';
    if (
      [
        'script',
        'style',
        'iframe',
        'object',
        'embed',
        'svg',
        'math',
        'template',
        'noscript',
      ].includes(tag)
    )
      return '';
    if (tag === 'img') {
      hasImages = true;
      return '\n[Imagem no enunciado original]\n';
    }
    if (tag === 'br') return '\n';
    const content = Array.from(node.childNodes)
      .map((child) => text(child, pre || tag === 'pre'))
      .join('');
    if (tag === 'sup') return `^(${content.trim()})`;
    if (tag === 'sub') return `_(${content.trim()})`;
    if (tag === 'code' && !pre) return `\`${content.trim()}\``;
    if (tag === 'li') return `\n${content.trim()}\n`;
    if (
      [
        'p',
        'div',
        'pre',
        'ul',
        'ol',
        'blockquote',
        'table',
        'tr',
        'h1',
        'h2',
        'h3',
        'h4',
      ].includes(tag)
    )
      return `\n\n${content.trim()}\n\n`;
    return content;
  }
  const body = text(template.content)
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!body)
    throw new Error('O enunciado recebido está vazio. Preencha-o manualmente.');
  const description = `${title}\n\n${body}`;
  if (description.length > 15000)
    throw new Error(
      'O enunciado é maior que o limite do editor. Cole uma versão resumida manualmente.',
    );
  return { text: description, hasImages };
}
export async function importProblem(
  apiUrl: string,
  link: string,
  signal: AbortSignal,
) {
  const { slug } = problemLink(link);
  if (!apiUrl)
    throw new Error(
      'Configure o backend em VITE_API_URL para importar problemas. Você ainda pode preencher os campos manualmente.',
    );
  const response = await fetch(
    `${apiUrl.replace(/\/+$/, '')}/leetcode/problems/${slug}`,
    { cache: 'no-store', signal },
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      typeof data?.error === 'string'
        ? data.error
        : 'Não foi possível importar o problema.',
    );
  const problem = parseImportedProblem(data, slug);
  return {
    problem,
    description: descriptionFromHtml(problem.title, problem.content_html),
  };
}
