class ScriptEditor {
  #text = '';
  write(text: string) {
    this.#text = text;
  }
  read() {
    return this.#text;
  }
  checkpoint(): () => void {
    const saved = this.#text;
    return () => {
      this.#text = saved;
    };
  }
}
export function demo() {
  const editor = new ScriptEditor();
  const history: (() => void)[] = [];
  editor.write('Introdução');
  history.push(editor.checkpoint());
  editor.write('Novo final');
  const changed = editor.read();
  history.pop()!();
  return { changed, restored: editor.read() };
}
