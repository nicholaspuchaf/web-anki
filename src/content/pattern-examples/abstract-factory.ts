interface Part {
  render(text: string): string;
}
interface DocumentKit {
  heading(): Part;
  paragraph(): Part;
}
class PlainKit implements DocumentKit {
  heading() {
    return { render: (text: string) => text.toUpperCase() };
  }
  paragraph() {
    return { render: (text: string) => text };
  }
}
class MarkdownKit implements DocumentKit {
  heading() {
    return { render: (text: string) => `# ${text}` };
  }
  paragraph() {
    return { render: (text: string) => `> ${text}` };
  }
}
function document(kit: DocumentKit) {
  return [kit.heading().render('Resumo'), kit.paragraph().render('Tudo certo')];
}
export function demo() {
  return [document(new PlainKit()), document(new MarkdownKit())];
}
