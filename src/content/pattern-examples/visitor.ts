interface Visitor {
  text(node: TextFile): number;
  image(node: ImageFile): number;
}
interface File {
  accept(visitor: Visitor): number;
}
class TextFile implements File {
  constructor(readonly characters: number) {}
  accept(visitor: Visitor) {
    return visitor.text(this);
  }
}
class ImageFile implements File {
  constructor(readonly pixels: number) {}
  accept(visitor: Visitor) {
    return visitor.image(this);
  }
}
class StorageEstimate implements Visitor {
  text(node: TextFile) {
    return node.characters * 2;
  }
  image(node: ImageFile) {
    return node.pixels * 4;
  }
}
class FileCount implements Visitor {
  text(_node: TextFile) {
    return 1;
  }
  image(_node: ImageFile) {
    return 1;
  }
}
export function demo() {
  const files: File[] = [new TextFile(10), new ImageFile(5)];
  const sum = (visitor: Visitor) =>
    files.reduce((n, file) => n + file.accept(visitor), 0);
  return {
    estimatedBytes: sum(new StorageEstimate()),
    files: sum(new FileCount()),
  };
}
