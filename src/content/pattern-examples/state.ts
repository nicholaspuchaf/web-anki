interface AccessState {
  allows(): boolean;
  toggle(): AccessState;
}
class Active implements AccessState {
  allows() {
    return true;
  }
  toggle(): AccessState {
    return new Paused();
  }
}
class Paused implements AccessState {
  allows() {
    return false;
  }
  toggle(): AccessState {
    return new Active();
  }
}
class Subscription {
  private state: AccessState = new Active();
  access() {
    return this.state.allows();
  }
  pauseOrResume() {
    this.state = this.state.toggle();
  }
}
export function demo() {
  const subscription = new Subscription();
  const values = [subscription.access()];
  subscription.pauseOrResume();
  values.push(subscription.access());
  subscription.pauseOrResume();
  values.push(subscription.access());
  return values;
}
