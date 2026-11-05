interface Channel {
  deliver(text: string): string;
}
class Email implements Channel {
  deliver(text: string) {
    return `email:${text}`;
  }
}
class Journal implements Channel {
  deliver(text: string) {
    return `log:${text}`;
  }
}
class Notice {
  constructor(protected channel: Channel) {}
  send(text: string) {
    return this.channel.deliver(text);
  }
}
class UrgentNotice extends Notice {
  override send(text: string) {
    return this.channel.deliver(`URGENTE ${text}`);
  }
}
export function demo() {
  return [
    new Notice(new Email()).send('A'),
    new UrgentNotice(new Journal()).send('B'),
  ];
}
