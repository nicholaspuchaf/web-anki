type Agent = { name: string; pending: number };
type Routing = (agents: Agent[]) => Agent;
const firstAvailable: Routing = (agents) => agents[0];
const leastLoaded: Routing = (agents) =>
  agents.reduce((a, b) => (a.pending <= b.pending ? a : b));
class TicketRouter {
  constructor(private routing: Routing) {}
  assign(agents: Agent[]) {
    if (!agents.length) throw new Error('Sem agentes');
    return this.routing(agents).name;
  }
}
export function demo() {
  const agents = [
    { name: 'Ana', pending: 4 },
    { name: 'Bia', pending: 1 },
  ];
  return [
    new TicketRouter(firstAvailable).assign(agents),
    new TicketRouter(leastLoaded).assign(agents),
  ];
}
