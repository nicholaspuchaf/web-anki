type Listener = (available: number) => void;
class Vacancies {
  private listeners = new Set<Listener>();
  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  publish(count: number) {
    for (const listener of [...this.listeners]) listener(count);
  }
}
export function demo() {
  const vacancies = new Vacancies();
  const events: string[] = [];
  const unsubscribe = vacancies.subscribe((n) => events.push(`A:${n}`));
  vacancies.subscribe((n) => events.push(`B:${n}`));
  vacancies.publish(1);
  unsubscribe();
  vacancies.publish(2);
  return events;
}
