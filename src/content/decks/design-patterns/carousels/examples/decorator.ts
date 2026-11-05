interface Reader {
  read(): string;
}
class Cached implements Reader {
  private value: string | undefined;
  constructor(private inner: Reader) {}
  read() {
    return (this.value ??= this.inner.read());
  }
}
class Metered implements Reader {
  calls = 0;
  constructor(private inner: Reader) {}
  read() {
    this.calls++;
    return this.inner.read();
  }
}
export function demo() {
  const source = { read: () => 'conteudo' };
  const inside = new Metered(source);
  const cached = new Cached(inside);
  cached.read();
  cached.read();
  const outside = new Metered(new Cached(source));
  outside.read();
  outside.read();
  return { inside: inside.calls, outside: outside.calls };
}
