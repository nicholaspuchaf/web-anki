interface Payments {
  charge(cents: number): string;
}
class LegacyGateway {
  bill(decimalAmount: string) {
    return `cobrado:${decimalAmount}`;
  }
}
class PaymentAdapter implements Payments {
  constructor(private gateway: LegacyGateway) {}
  charge(cents: number) {
    if (!Number.isSafeInteger(cents) || cents < 0)
      throw new Error('Centavos inválidos');
    return this.gateway.bill((cents / 100).toFixed(2));
  }
}
export function demo() {
  const payments: Payments = new PaymentAdapter(new LegacyGateway());
  return payments.charge(1590);
}
