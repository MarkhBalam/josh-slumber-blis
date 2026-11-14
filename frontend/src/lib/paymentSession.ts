export const PAYMENT_SESSION_KEY = "jsb_pending_pesapal_payment";

export type PendingPaymentSession = {
  orderNumber: string;
  paymentAccessToken: string;
  checkoutFingerprint: string;
};

export function savePendingPayment(
  payment: PendingPaymentSession
): void {
  sessionStorage.setItem(
    PAYMENT_SESSION_KEY,
    JSON.stringify(payment)
  );
}

export function getPendingPayment(): PendingPaymentSession | null {
  try {
    const raw = sessionStorage.getItem(PAYMENT_SESSION_KEY);

    if (!raw) return null;

    const value: unknown = JSON.parse(raw);

    if (
      typeof value !== "object" ||
      value === null ||
      !("orderNumber" in value) ||
      !("paymentAccessToken" in value) ||
      !("checkoutFingerprint" in value) ||
      typeof value.orderNumber !== "string" ||
      typeof value.paymentAccessToken !== "string" ||
      typeof value.checkoutFingerprint !== "string" ||
      !/^[a-fA-F0-9]{64}$/.test(value.paymentAccessToken)
    ) {
      return null;
    }

    return {
      orderNumber: value.orderNumber,
      paymentAccessToken: value.paymentAccessToken,
      checkoutFingerprint: value.checkoutFingerprint,
    };
  } catch {
    return null;
  }
}

export function clearPendingPayment(): void {
  sessionStorage.removeItem(PAYMENT_SESSION_KEY);
}
