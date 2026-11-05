class FormTemplate {
  constructor(
    public title: string,
    public fields: { label: string }[],
  ) {}
  clone() {
    return new FormTemplate(
      this.title,
      this.fields.map((field) => ({ ...field })),
    );
  }
}
export function demo() {
  const original = new FormTemplate('Cadastro', [{ label: 'Nome' }]);
  const copy = original.clone();
  copy.title = 'Inscrição';
  copy.fields[0].label = 'Participante';
  return {
    original: original.fields[0].label,
    copy: copy.fields[0].label,
    independent: original.fields !== copy.fields,
  };
}
