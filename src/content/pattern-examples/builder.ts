type Request = { fields: string[]; destination: string };
class ExportBuilder {
  private fields: string[] = [];
  private destination = '';
  select(...fields: string[]) {
    this.fields.push(...fields);
    return this;
  }
  to(destination: string) {
    this.destination = destination;
    return this;
  }
  build(): Request {
    if (!this.fields.length || !this.destination)
      throw new Error('Pedido incompleto');
    const request = { fields: [...this.fields], destination: this.destination };
    this.fields = [];
    this.destination = '';
    return request;
  }
}
export function demo() {
  const builder = new ExportBuilder();
  const first = builder.select('nome', 'email').to('arquivo').build();
  const second = builder.select('id').to('memoria').build();
  return [first, second];
}
