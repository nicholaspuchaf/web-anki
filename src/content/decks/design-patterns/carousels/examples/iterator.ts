type Lesson = { title: string; children: Lesson[] };
function* depthFirst(node: Lesson): Generator<string> {
  yield node.title;
  for (const child of node.children) yield* depthFirst(child);
}
function* breadthFirst(root: Lesson): Generator<string> {
  const queue = [root];
  for (let index = 0; index < queue.length; index++) {
    const node = queue[index];
    yield node.title;
    queue.push(...node.children);
  }
}
export function demo() {
  const root: Lesson = {
    title: 'A',
    children: [
      { title: 'B', children: [{ title: 'D', children: [] }] },
      { title: 'C', children: [] },
    ],
  };
  return { depth: [...depthFirst(root)], breadth: [...breadthFirst(root)] };
}
