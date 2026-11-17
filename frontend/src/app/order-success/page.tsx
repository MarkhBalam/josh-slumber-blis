"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  CheckCheck,
  ClipboardCheck,
  Copy,
  Info,
  ShoppingBag,
  Truck,
} from "lucide-react";

type ConfirmationDetails = {
  order_number: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
};

type ConfirmationState = "loading" | "verified" | "unavailable";

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[60vh] items-center justify-center bg-background text-text-main">
          <p className="text-sm text-text-muted">
            Loading your order details...
          </p>
        </main>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  const [copied, setCopied] = useState(false);
  const [confirmationState, setConfirmationState] =
    useState<ConfirmationState>("loading");
  const [confirmation, setConfirmation] =
    useState<ConfirmationDetails | null>(null);

  const trackingHref = orderNumber
    ? `/my-orders/${encodeURIComponent(orderNumber)}`
    : "/my-orders";

  useEffect(() => {
    let cancelled = false;

    async function loadConfirmation() {
      setConfirmationState("loading");
      setConfirmation(null);

      if (!orderNumber) {
        setConfirmationState("unavailable");
        return;
      }

      try {
        const raw = sessionStorage.getItem(
          "jsb_order_confirmation"
        );

        if (!raw) {
          throw new Error("Confirmation session unavailable.");
        }

        const session: unknown = JSON.parse(raw);

        if (
          typeof session !== "object" ||
          session === null ||
          !("orderNumber" in session) ||
          !("paymentAccessToken" in session) ||
          session.orderNumber !== orderNumber ||
          typeof session.paymentAccessToken !== "string" ||
          !/^[a-fA-F0-9]{64}$/.test(session.paymentAccessToken)
        ) {
          throw new Error("Invalid confirmation session.");
        }

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          "http://127.0.0.1:8000";

        const response = await fetch(
          `${apiUrl}/api/orders/confirmation`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              order_number: orderNumber,
              payment_access_token:
                session.paymentAccessToken,
            }),
            cache: "no-store",
          }
        );

        const result: {
          success?: boolean;
          data?: ConfirmationDetails;
        } = await response.json();

        if (
          !response.ok ||
          !result.success ||
          !result.data ||
          result.data.order_number !== orderNumber
        ) {
          throw new Error("Order confirmation failed.");
        }

        if (!cancelled) {
          setConfirmation(result.data);
          setConfirmationState("verified");
        }
      } catch {
        if (!cancelled) {
          setConfirmationState("unavailable");
        }
      }
    }

    void loadConfirmation();

    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  async function handleCopy() {
    if (!orderNumber) return;

    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const isCashOnDelivery =
    confirmation?.payment_method === "cash_on_delivery";

  const paymentStatus = confirmation?.payment_status;

  let firstTitle = "Order Confirmation";
  let firstDescription =
    "We couldn't verify your order details in this browser. You can still track your order using your order number.";

  let secondTitle = "Delivery Across Uganda";
  let secondDescription =
    "Delivery arrangements will be confirmed after your order is reviewed.";

  if (confirmationState === "loading") {
    firstTitle = "Checking Order Details";
    firstDescription =
      "We're securely retrieving your order information.";
  } else if (confirmationState === "verified") {
    if (isCashOnDelivery) {
      firstTitle = "Order Received";
      firstDescription =
        "We've received your order and will contact you to confirm the details before delivery.";

      secondTitle = "Pay on Delivery";
      secondDescription =
        "No payment is required now. You'll pay when your order is delivered.";
    } else if (paymentStatus === "paid") {
      firstTitle = "Payment Received";
      firstDescription =
        "Your payment has been recorded successfully.";

      secondTitle = "Delivery Across Uganda";
      secondDescription =
        "We'll review your order and contact you to arrange delivery.";
    } else if (paymentStatus === "pending") {
      firstTitle = "Payment Processing";
      firstDescription =
        "Your payment is still pending. Please don't make another payment until its status is confirmed.";

      secondTitle = "Order Awaiting Payment";
      secondDescription =
        "Delivery arrangements will follow once payment is confirmed.";
    } else if (paymentStatus === "failed") {
      firstTitle = "Payment Unsuccessful";
      firstDescription =
        "Your payment was not completed successfully.";

      secondTitle = "Payment Assistance";
      secondDescription =
        "Please check your payment status before trying again.";
    } else if (paymentStatus === "reversed") {
      firstTitle = "Payment Requires Assistance";
      firstDescription =
        "Your payment was reversed. Please contact support before making another payment.";

      secondTitle = "Order Awaiting Resolution";
      secondDescription =
        "We'll assist you with the payment issue before arranging delivery.";
    } else {
      firstTitle = "Payment Status Unavailable";
      firstDescription =
        "We couldn't determine your payment status. Please check your order before paying again.";
    }
  }

  return (
    <main className="bg-background px-4 py-7 text-text-main sm:px-6 sm:py-10">
      <section className="mx-auto w-full max-w-xl">
        <div className="overflow-hidden rounded-[1.75rem] border border-border-soft bg-surface shadow-sm">
          <div className="px-5 py-7 sm:px-8 sm:py-8">
            {/* SUCCESS HEADER */}
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-brand-navy">
                <Check size={30} strokeWidth={3} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand-navy/60">
                  Order Received
                </p>

                <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight text-brand-navy sm:text-[28px]">
                  Order Placed Successfully!
                </h1>

                <p className="mt-2 text-sm leading-5 text-text-muted">
                  Thank you for shopping with Josh Slumber Bliss.
                </p>
              </div>
            </div>

            {/* ORDER REFERENCE */}
            {orderNumber && (
              <div className="mt-6 rounded-xl border border-border-soft bg-background p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">
                  Your Order Number
                </p>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="min-w-0 break-all text-base font-extrabold tracking-tight text-brand-navy sm:text-lg">
                    {orderNumber}
                  </p>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border-soft bg-surface px-3 py-2 text-xs font-bold text-brand-navy transition hover:bg-brand-yellow"
                  >
                    {copied ? (
                      <>
                        <CheckCheck size={15} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={15} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* DYNAMIC NEXT STEPS */}
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow/20 text-brand-navy">
                  <ClipboardCheck size={19} />
                </div>

                <div>
                  <p className="text-sm font-bold text-brand-navy">
                    {firstTitle}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-text-muted">
                    {firstDescription}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow/20 text-brand-navy">
                  <Truck size={19} />
                </div>

                <div>
                  <p className="text-sm font-bold text-brand-navy">
                    {secondTitle}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-text-muted">
                    {secondDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href={trackingHref}
                className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-yellow px-4 text-sm font-bold text-brand-navy transition hover:brightness-95"
              >
                <ClipboardCheck size={17} />
                Track My Order
              </Link>

              <Link
                href="/shop"
                className="flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-brand-navy px-4 text-sm font-bold text-brand-navy transition hover:bg-brand-navy hover:text-white"
              >
                <ShoppingBag size={17} />
                Continue Shopping
              </Link>
            </div>

            {/* GUEST CHECKOUT NOTE */}
            <div className="mt-5 flex items-start gap-2 border-t border-border-soft pt-4">
              <Info
                size={16}
                className="mt-0.5 shrink-0 text-text-muted"
              />

              <p className="text-xs leading-5 text-text-muted">
                No account needed. You can find your order later
                using the phone number provided at checkout.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
