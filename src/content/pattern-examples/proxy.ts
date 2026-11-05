interface Document {
  read(allowed: boolean): string;
}
class ProtectedPreview implements Document {
  private real: { read(): string } | undefined;
  constructor(private create: () => { read(): string }) {}
  read(allowed: boolean) {
    if (!allowed) throw new Error('Acesso negado');
    this.real ??= this.create();
    return this.real.read();
  }
}
export function demo() {
  let loads = 0;
  const preview = new ProtectedPreview(() => {
    loads++;
    return { read: () => 'texto' };
  });
  try {
    preview.read(false);
  } catch {
    /* Rejeição esperada. */
  }
  const deniedLoads = loads;
  preview.read(true);
  preview.read(true);
  return { deniedLoads, loads };
}
