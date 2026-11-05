abstract class Approval {
  constructor(protected next?: Approval) {}
  abstract approve(amount: number): string;
  protected forward(amount: number) {
    return this.next?.approve(amount) ?? 'sem aprovador';
  }
}
class TeamLead extends Approval {
  approve(amount: number): string {
    return amount <= 100 ? 'lider' : this.forward(amount);
  }
}
class Manager extends Approval {
  approve(amount: number): string {
    return amount <= 1000 ? 'gerente' : this.forward(amount);
  }
}
export function demo() {
  const chain = new TeamLead(new Manager());
  return [chain.approve(50), chain.approve(500), chain.approve(5000)];
}
