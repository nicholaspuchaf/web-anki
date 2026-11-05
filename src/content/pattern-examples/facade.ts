class MaterialStore {
  save(text: string) {
    return { id: 'material-1', text };
  }
}
class SearchIndex {
  indexed: string[] = [];
  add(id: string) {
    this.indexed.push(id);
  }
}
class Publisher {
  constructor(
    private store: MaterialStore,
    private index: SearchIndex,
  ) {}
  publish(text: string) {
    if (!text.trim()) throw new Error('Material vazio');
    const saved = this.store.save(text.trim());
    this.index.add(saved.id);
    return saved.id;
  }
}
export function demo() {
  const index = new SearchIndex();
  const publisher = new Publisher(new MaterialStore(), index);
  return { id: publisher.publish(' Conceito '), indexed: index.indexed };
}
