"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import {
  clearPendingPayment,
  getPendingPayment,
} from "@/lib/paymentSession";
import { useCartStore } from "@/store/cartStore";

type PaymentStatus =
  | "checking"
  | "paid"
  | "pending"
  | "failed"
  | "reversed"
  | "unavailable";

type VerificationResponse = {
  success?: boolean;
  message?: string;
  data?: {
    status?: string;
    order_number?: string;
  };
};

export default function PaymentReturnPage() {
  const [status, setStatus] = useState<PaymentStatus>("checking");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");
  const [retrying, setRetrying] = useState(false);

  const retryPayment = useCallback(async () => {
    if (retrying || status !== "failed") return;

    const payment = getPendingPayment();

    if (!payment) {
      setMessage(
        "Your payment session is unavailable. Please check your order before attempting another payment."
      );
      return;
    }

    setRetrying(true);
    setMessage("");

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://127.0.0.1:8000";

      const response = await fetch(
        `${apiUrl}/api/payments/initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            order_number: payment.orderNumber,
            payment_access_token: payment.paymentAccessToken,
          }),
          cache: "no-store",
        }
      );

      const data: {
        success?: boolean;
        message?: string;
        data?: {
          provider?: string;
          checkout_url?: string;
          status?: string;
        };
      } = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "We could not safely start another payment. Please contact support."
        );
      }

      if (
        data.data?.provider !== "pesapal" ||
        data.data?.status !== "pending" ||
        typeof data.data.checkout_url !== "string"
      ) {
        throw new Error("The payment provider returned an invalid checkout session.");
      }

      const checkoutUrl = new URL(data.data.checkout_url);

      if (checkoutUrl.protocol !== "https:") {
        throw new Error("The payment checkout URL is not secure.");
      }

      window.location.assign(checkoutUrl.toString());
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not start another payment. Please contact support."
      );
      setRetrying(false);
    }
  }, [retrying, status]);

  const verifyPayment = useCallback(async () => {
    const payment = getPendingPayment();

    if (!payment) {
      setStatus("unavailable");
      setMessage(
        "We could not find your payment session in this browser. Please check your order status before attempting another payment."
      );
      return;
    }

    setOrderNumber(payment.orderNumber);
    setStatus("checking");
    setMessage("");

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://127.0.0.1:8000";

      const response = await fetch(
        `${apiUrl}/api/payments/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            order_number: payment.orderNumber,
            payment_access_token: payment.paymentAccessToken,
          }),
          cache: "no-store",
        }
      );

      const data: VerificationResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Payment verification is temporarily unavailable."
        );
      }

      if (data.data?.order_number !== payment.orderNumber) {
        throw new Error("The verified order number did not match.");
      }

      const verifiedStatus = data.data?.status;

      if (
        verifiedStatus !== "paid" &&
        verifiedStatus !== "pending" &&
        verifiedStatus !== "failed" &&
        verifiedStatus !== "reversed"
      ) {
        throw new Error("The payment provider returned an unknown status.");
      }

      setStatus(verifiedStatus);

      if (verifiedStatus === "paid") {
        let purchasedItems: {
          variantId: number;
          quantity: number;
        }[] = [];

        try {
          const checkout: unknown = JSON.parse(
            payment.checkoutFingerprint
          );

          if (
            typeof checkout !== "object" ||
            checkout === null ||
            !("items" in checkout) ||
            !Array.isArray(checkout.items)
          ) {
            throw new Error("Invalid checkout items.");
          }

          purchasedItems = checkout.items.map((item: unknown) => {
            if (
              typeof item !== "object" ||
              item === null ||
              !("variant_id" in item) ||
              !("quantity" in item) ||
              typeof item.variant_id !== "number" ||
              typeof item.quantity !== "number" ||
              !Number.isSafeInteger(item.variant_id) ||
              item.variant_id <= 0 ||
              !Number.isSafeInteger(item.quantity) ||
              item.quantity <= 0
            ) {
              throw new Error("Invalid purchased item.");
            }

            return {
              variantId: item.variant_id,
              quantity: item.quantity,
            };
          });

          if (purchasedItems.length === 0) {
            throw new Error("No purchased items found.");
          }
        } catch {
          setMessage(
            "Payment confirmed, but we could not update your cart automatically."
          );
          return;
        }

        useCartStore
          .getState()
          .removePurchasedItems(payment.orderNumber, purchasedItems);

        clearPendingPayment();
      }
    } catch (error) {
      setStatus("unavailable");
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not verify your payment right now."
      );
    }
  }, []);

  useEffect(() => {
    void verifyPayment();
  }, [verifyPayment]);

  const content = {
    checking: {
      icon: "⏳",
      title: "Verifying Your Payment",
      description:
        "We're checking your payment directly with Pesapal. Please wait a moment.",
    },
    paid: {
      icon: "✓",
      title: "Payment Successful!",
      description:
        "Your payment has been verified and your Josh Slumber Bliss order is confirmed.",
    },
    pending: {
      icon: "⏳",
      title: "Payment Still Processing",
      description:
        "Pesapal has not yet confirmed your payment. Please do not pay again until the status is resolved.",
    },
    failed: {
      icon: "!",
      title: "Payment Unsuccessful",
      description:
        "Pesapal reported that this payment was unsuccessful. Your order has not been confirmed as paid.",
    },
    reversed: {
      icon: "!",
      title: "Payment Requires Assistance",
      description:
        "Pesapal reported a reversed transaction. Please contact support before attempting another payment.",
    },
    unavailable: {
      icon: "?",
      title: "Payment Status Not Confirmed",
      description:
        "We cannot confirm your payment status right now. Please check your order before attempting another payment.",
    },
  }[status];

  return (
    <main className="min-h-screen bg-background text-text-main">
      <section className="flex min-h-[calc(100vh-90px)] items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl rounded-[2rem] border border-border-soft bg-surface px-6 py-12 text-center sm:px-10">
          <div className="mx-auto inline-flex rounded-full bg-brand-yellow px-4 py-2 text-xs font-bold uppercase tracking-widest text-brand-navy">
            Josh Slumber Bliss
          </div>

          <div
            className="mx-auto mt-7 flex h-20 w-20 items-center justify-center rounded-full bg-brand-yellow text-4xl font-bold text-brand-navy"
            aria-hidden="true"
          >
            {content.icon}
          </div>

          <h1 className="mt-7 text-3xl font-bold text-brand-navy">
            {content.title}
          </h1>

          <p className="mt-4 text-sm leading-7 text-text-muted sm:text-base">
            {content.description}
          </p>

          {orderNumber && (
            <div className="mt-6 rounded-2xl border border-border-soft bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Order Number
              </p>
              <p className="mt-2 break-all text-lg font-bold text-brand-navy">
                {orderNumber}
              </p>
            </div>
          )}

          {message && (
            <p
              role="alert"
              className="mt-5 text-sm leading-6 text-danger"
            >
              {message}
            </p>
          )}

          {status === "paid" && (
            <p className="mt-5 text-sm leading-6 text-text-muted">
              Thank you for shopping with us. You can track your
              order using your phone number.
            </p>
          )}

          {status === "checking" && (
            <div
              className="mx-auto mt-7 h-8 w-8 animate-spin rounded-full border-4 border-brand-navy/20 border-t-brand-navy"
              role="status"
              aria-label="Verifying payment"
            />
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            {status === "failed" && (
              <button
                type="button"
                onClick={() => void retryPayment()}
                disabled={retrying}
                className="flex min-h-12 items-center justify-center whitespace-nowrap rounded-full bg-brand-yellow px-7 font-bold text-brand-navy transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {retrying ? "Preparing Secure Checkout..." : "Retry Payment"}
              </button>
            )}

            {(status === "pending" ||
              (status === "unavailable" && getPendingPayment() !== null)) && (
              <button
                type="button"
                onClick={() => void verifyPayment()}
                className="flex min-h-12 items-center justify-center whitespace-nowrap rounded-full bg-brand-yellow px-7 font-bold text-brand-navy transition hover:brightness-95"
              >
                Check Payment Again
              </button>
            )}

            <Link
              href="/my-orders"
              className="flex min-h-12 items-center justify-center whitespace-nowrap rounded-full bg-brand-yellow px-7 font-bold text-brand-navy transition hover:brightness-95"
            >
              Track My Order
            </Link>

            <Link
              href="/"
              className="flex min-h-12 items-center justify-center whitespace-nowrap rounded-full border-2 border-brand-navy px-7 font-bold text-brand-navy transition hover:bg-brand-navy hover:text-white"
            >
              Back to Home
            </Link>
          </div>

          {status !== "paid" && status !== "checking" && (
            <p className="mt-6 text-xs leading-6 text-text-muted">
              A payment redirect alone does not confirm payment.
              Please verify your order status before paying again.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
