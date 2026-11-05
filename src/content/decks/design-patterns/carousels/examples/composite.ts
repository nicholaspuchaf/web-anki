interface Work {
  minutes(): number;
}
class Task implements Work {
  constructor(private duration: number) {}
  minutes() {
    return this.duration;
  }
}
class WorkGroup implements Work {
  constructor(private children: Work[]) {}
  minutes(): number {
    return this.children.reduce((total, child) => total + child.minutes(), 0);
  }
}
export function demo() {
  const preparation = new WorkGroup([new Task(10), new Task(15)]);
  const plan = new WorkGroup([preparation, new Task(20)]);
  return plan.minutes();
}
