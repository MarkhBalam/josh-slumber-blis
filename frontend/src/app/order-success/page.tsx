"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  const trackingHref = orderNumber
    ? `/my-orders/${encodeURIComponent(orderNumber)}`
    : "/my-orders";

  return (
    <main className="min-h-screen bg-background text-text-main">
      <section className="flex min-h-[calc(100vh-90px)] items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
        <div className="w-full max-w-2xl">
          <div className="overflow-hidden rounded-[1.75rem] border border-border-soft bg-surface text-center sm:rounded-[2rem]">
            {/* ============================================================
                SUCCESS CONTENT
            ============================================================= */}

            <div className="px-5 py-10 sm:px-8 sm:py-14">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-yellow text-3xl font-black text-brand-navy sm:h-24 sm:w-24 sm:text-4xl">
                ✓
              </div>

              <div className="mt-6 inline-flex rounded-full bg-brand-navy px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-yellow sm:text-xs">
                Order Received
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
                Thank you for your order.
              </h1>

              <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-text-muted sm:text-base sm:leading-7">
                Your Josh Slumber Blis order has been received successfully.
                We&apos;ll confirm the order details, your selected payment
                method, and delivery information.
              </p>

              {/* ========================================================
                  ORDER NUMBER
              ========================================================= */}

              {orderNumber && (
                <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border-soft bg-background p-5 sm:p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-text-muted">
                    Your Order Number
                  </p>

                  <p className="mt-2 break-all text-xl font-bold text-brand-navy sm:text-2xl">
                    {orderNumber}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-text-muted">
                    Keep this number for reference when checking your order.
                  </p>
                </div>
              )}

              {/* ========================================================
                  WHAT HAPPENS NEXT
              ========================================================= */}

              <div className="mx-auto mt-8 max-w-lg text-left">
                <p className="text-sm font-bold text-brand-navy">
                  What happens next?
                </p>

                <div className="mt-4 space-y-3">
                  <div className="flex gap-3 rounded-2xl bg-background p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-sm font-black text-brand-navy">
                      1
                    </div>

                    <div>
                      <p className="text-sm font-bold text-brand-navy">
                        Order confirmation
                      </p>

                      <p className="mt-1 text-xs leading-5 text-text-muted">
                        Your order will be reviewed and confirmed.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl bg-background p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-sm font-black text-brand-navy">
                      2
                    </div>

                    <div>
                      <p className="text-sm font-bold text-brand-navy">
                        Payment confirmation
                      </p>

                      <p className="mt-1 text-xs leading-5 text-text-muted">
                        Your selected payment method will be confirmed with
                        the order.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl bg-background p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-sm font-black text-brand-navy">
                      3
                    </div>

                    <div>
                      <p className="text-sm font-bold text-brand-navy">
                        Delivery
                      </p>

                      <p className="mt-1 text-xs leading-5 text-text-muted">
                        Once the order is ready, delivery will be arranged
                        using the details you provided at checkout.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================
                  ACTIONS
              ========================================================= */}

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Link
                  href={trackingHref}
                  className="flex min-h-12 items-center justify-center rounded-full bg-brand-yellow px-6 text-sm font-bold text-brand-navy transition hover:brightness-95"
                >
                  Track My Order
                </Link>

                <Link
                  href="/shop"
                  className="flex min-h-12 items-center justify-center rounded-full border-2 border-brand-navy px-6 text-sm font-bold text-brand-navy transition hover:bg-brand-navy hover:text-white"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* ============================================================
                GUEST ORDER NOTE
            ============================================================= */}

            <div className="border-t border-border-soft bg-brand-navy px-5 py-5 text-left text-white sm:px-8">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow font-black text-brand-navy">
                  i
                </div>

                <div>
                  <p className="text-sm font-bold">
                    No account needed
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/60">
                    You can also find your orders later from My Orders using
                    the phone number you entered during checkout.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ==============================================================
              BACK HOME
          =============================================================== */}

          <div className="mt-5 text-center">
            <Link
              href="/"
              className="text-sm font-bold text-brand-navy transition hover:opacity-65"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}