class Configuration {
  private static instance: Configuration | undefined;
  private constructor(readonly applicationName: string) {}
  static current() {
    return (this.instance ??= new Configuration('Estudos'));
  }
}
export function demo() {
  const first = Configuration.current();
  const second = Configuration.current();
  return { same: first === second, name: second.applicationName };
}
