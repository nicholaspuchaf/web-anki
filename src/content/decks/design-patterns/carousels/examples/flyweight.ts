type Style = Readonly<{ sector: string; color: string }>;
class Styles {
  private values = new Map<string, Style>();
  get(sector: string, color: string) {
    const key = JSON.stringify([sector, color]);
    if (!this.values.has(key))
      this.values.set(key, Object.freeze({ sector, color }));
    return this.values.get(key)!;
  }
}
export function demo() {
  const styles = new Styles();
  const a = { row: 1, seat: 1, style: styles.get('A', 'azul') };
  const b = { row: 1, seat: 2, style: styles.get('A', 'azul') };
  return { shared: a.style === b.style, positions: [a.seat, b.seat] };
}
