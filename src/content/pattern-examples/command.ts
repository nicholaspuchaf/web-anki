class Cart {
  quantity = 0;
}
interface Command {
  execute(): void;
  undo(): void;
}
class AddUnits implements Command {
  private previous: number | undefined;
  constructor(
    private cart: Cart,
    private units: number,
  ) {}
  execute() {
    this.previous = this.cart.quantity;
    this.cart.quantity += this.units;
  }
  undo() {
    if (this.previous === undefined) throw new Error('Comando não executado');
    this.cart.quantity = this.previous;
    this.previous = undefined;
  }
}
export function demo() {
  const cart = new Cart();
  const command: Command = new AddUnits(cart, 3);
  command.execute();
  const after = cart.quantity;
  command.undo();
  return { after, undone: cart.quantity };
}
