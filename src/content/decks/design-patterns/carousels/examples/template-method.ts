abstract class ContactImporter {
  protected abstract split(input: string): string[];
  run(input: string) {
    const values = this.split(input).map((value) => value.trim());
    return values.filter((value) => value.includes('@'));
  }
}
class LineImporter extends ContactImporter {
  protected split(input: string) {
    return input.split('\n');
  }
}
class SemicolonImporter extends ContactImporter {
  protected split(input: string) {
    return input.split(';');
  }
}
export function demo() {
  return [
    new LineImporter().run(' a@x.test \nsem-email'),
    new SemicolonImporter().run(' b@x.test ;outro'),
  ];
}
