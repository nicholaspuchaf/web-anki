class BookingForm {
  private people = 1;
  private capacity = 0;
  canBook = false;
  peopleChanged(value: number) {
    this.people = value;
    this.reconcile();
  }
  roomChanged(capacity: number) {
    this.capacity = capacity;
    this.reconcile();
  }
  private reconcile() {
    this.canBook = this.people > 0 && this.capacity >= this.people;
  }
}
export function demo() {
  const mediator = new BookingForm();
  const peopleInput = { change: (n: number) => mediator.peopleChanged(n) };
  const roomInput = { change: (n: number) => mediator.roomChanged(n) };
  peopleInput.change(5);
  roomInput.change(3);
  const smallRoom = mediator.canBook;
  roomInput.change(8);
  return { smallRoom, largeRoom: mediator.canBook };
}
