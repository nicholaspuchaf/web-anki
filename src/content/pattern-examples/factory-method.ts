interface Encoder {
  encode(values: string[]): string;
}
abstract class ExportJob {
  protected abstract createEncoder(): Encoder;
  run(values: string[]) {
    const clean = values.map((value) => value.trim());
    return this.createEncoder().encode(clean);
  }
}
class JsonJob extends ExportJob {
  protected createEncoder(): Encoder {
    return { encode: (values) => JSON.stringify(values) };
  }
}
class PipeJob extends ExportJob {
  protected createEncoder(): Encoder {
    return { encode: (values) => values.join('|') };
  }
}
export function demo() {
  return [new JsonJob().run([' A ', 'B']), new PipeJob().run([' A ', 'B'])];
}
