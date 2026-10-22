"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCartStore } from "@/store/cartStore";
import { useCheckoutStore } from "@/store/checkoutStore";

function formatPrice(price: number) {
  return `UGX ${price.toLocaleString("en-UG")}`;
}

function getProductImageUrl(imagePath?: string | null) {
  if (!imagePath) {
    return null;
  }

  return `http://127.0.0.1:8000/storage/${imagePath}`;
}

const paymentMethods = [
  {
    value: "cash_on_delivery",
    label: "Cash on Delivery",
    description: "Pay when your order is delivered.",
  },
  {
    value: "mobile_money",
    label: "Mobile Money",
    description: "Pay using your preferred mobile money service.",
  },
  {
    value: "momo_pay",
    label: "MoMo Pay",
    description: "Complete payment using MoMo Pay.",
  },
  {
    value: "bank_transfer",
    label: "Bank Transfer",
    description: "Pay directly through a bank transfer.",
  },
  {
    value: "pay_on_pickup",
    label: "Pay on Pickup",
    description: "Pay when collecting your order.",
  },
];

export default function CheckoutPage() {
  const router = useRouter();

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const customerName = useCheckoutStore(
    (state) => state.customerName
  );

  const setCustomerName = useCheckoutStore(
    (state) => state.setCustomerName
  );

  const phone = useCheckoutStore(
    (state) => state.phone
  );

  const setPhone = useCheckoutStore(
    (state) => state.setPhone
  );

  const email = useCheckoutStore(
    (state) => state.email
  );

  const setEmail = useCheckoutStore(
    (state) => state.setEmail
  );

  const deliveryAddress = useCheckoutStore(
    (state) => state.deliveryAddress
  );

  const setDeliveryAddress = useCheckoutStore(
    (state) => state.setDeliveryAddress
  );

  const district = useCheckoutStore(
    (state) => state.district
  );

  const setDistrict = useCheckoutStore(
    (state) => state.setDistrict
  );

  const deliveryNotes = useCheckoutStore(
    (state) => state.deliveryNotes
  );

  const setDeliveryNotes = useCheckoutStore(
    (state) => state.setDeliveryNotes
  );

  const paymentMethod = useCheckoutStore(
    (state) => state.paymentMethod
  );

  const setPaymentMethod = useCheckoutStore(
    (state) => state.setPaymentMethod
  );

  const clearCheckout = useCheckoutStore(
    (state) => state.clearCheckout
  );

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = items.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/orders",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            customer_name: customerName,
            phone,
            email: email || null,

            delivery_address: deliveryAddress,
            district: district || null,
            delivery_notes: deliveryNotes || null,

            payment_method: paymentMethod,

            items: items.map((item) => ({
              variant_id: item.variantId,
              quantity: item.quantity,
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const validationErrors = data.errors
          ? Object.values(data.errors)
              .flat()
              .join(" ")
          : null;

        throw new Error(
          validationErrors ||
            data.message ||
            "Failed to create order."
        );
      }

      const orderNumber =
        data.data.order_number;

      clearCart();
      clearCheckout();

      router.push(
        `/order-success?order=${encodeURIComponent(
          orderNumber
        )}`
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while placing your order."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ================================================================
     EMPTY CART
  ================================================================= */

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background text-text-main">
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="rounded-[1.75rem] border border-border-soft bg-surface px-5 py-14 sm:rounded-[2rem] sm:px-8 sm:py-20">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-yellow text-4xl">
              🛒
            </div>

            <h1 className="mt-6 text-3xl font-bold tracking-tight text-brand-navy">
              Your cart is empty
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-muted sm:text-base">
              Add something to your cart before proceeding
              to checkout.
            </p>

            <Link
              href="/shop"
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-brand-navy px-7 font-bold text-white transition hover:opacity-90"
            >
              Start Shopping
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-text-main">
      {/* ================================================================
          BACK
      ================================================================= */}

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <Link
          href="/cart"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-brand-navy transition hover:opacity-65"
        >
          <span
            aria-hidden="true"
            className="text-lg"
          >
            ←
          </span>

          <span>Back to Cart</span>
        </Link>
      </div>

      {/* ================================================================
          CHECKOUT
      ================================================================= */}

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6 sm:pb-20 sm:pt-7 lg:px-8">
        {/* Heading */}

        <div className="mb-7 sm:mb-10">
          <div className="inline-flex rounded-full bg-brand-yellow px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-navy sm:text-xs">
            Secure Checkout
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl lg:text-5xl">
            Complete your order
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted sm:text-base">
            Enter your contact and delivery information,
            then choose how you would like to pay.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8"
        >
          {/* ============================================================
              LEFT SIDE
          ============================================================= */}

          <div className="space-y-5 sm:space-y-6">
            {/* CUSTOMER DETAILS */}

            <section className="rounded-[1.5rem] border border-border-soft bg-surface p-4 sm:rounded-3xl sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-yellow font-black text-brand-navy">
                  1
                </div>

                <div>
                  <h2 className="text-lg font-bold text-brand-navy sm:text-xl">
                    Customer Details
                  </h2>

                  <p className="mt-0.5 text-xs text-text-muted">
                    Tell us who is placing the order.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="customerName"
                    className="text-sm font-bold text-brand-navy"
                  >
                    Full Name{" "}
                    <span className="text-danger">
                      *
                    </span>
                  </label>

                  <input
                    id="customerName"
                    type="text"
                    required
                    autoComplete="name"
                    value={customerName}
                    onChange={(event) =>
                      setCustomerName(
                        event.target.value
                      )
                    }
                    placeholder="Enter your full name"
                    className="mt-2 min-h-12 w-full rounded-2xl border border-border-soft bg-background px-4 text-base text-text-main transition placeholder:text-text-muted/60 focus:border-brand-navy focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="text-sm font-bold text-brand-navy"
                  >
                    Phone Number{" "}
                    <span className="text-danger">
                      *
                    </span>
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder="e.g. 0772 000 000"
                    className="mt-2 min-h-12 w-full rounded-2xl border border-border-soft bg-background px-4 text-base text-text-main transition placeholder:text-text-muted/60 focus:border-brand-navy focus:outline-none"
                  />

                  <p className="mt-2 text-xs leading-5 text-text-muted">
                    We also use this number to help you
                    find and track your guest order.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-bold text-brand-navy"
                  >
                    Email{" "}
                    <span className="font-normal text-text-muted">
                      (optional)
                    </span>
                  </label>

                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    className="mt-2 min-h-12 w-full rounded-2xl border border-border-soft bg-background px-4 text-base text-text-main transition placeholder:text-text-muted/60 focus:border-brand-navy focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* ============================================================
                DELIVERY DETAILS
            ============================================================= */}

            <section className="rounded-[1.5rem] border border-border-soft bg-surface p-4 sm:rounded-3xl sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-yellow font-black text-brand-navy">
                  2
                </div>

                <div>
                  <h2 className="text-lg font-bold text-brand-navy sm:text-xl">
                    Delivery Details
                  </h2>

                  <p className="mt-0.5 text-xs text-text-muted">
                    Tell us where your order should go.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="deliveryAddress"
                    className="text-sm font-bold text-brand-navy"
                  >
                    Delivery Address{" "}
                    <span className="text-danger">
                      *
                    </span>
                  </label>

                  <input
                    id="deliveryAddress"
                    type="text"
                    required
                    autoComplete="street-address"
                    value={deliveryAddress}
                    onChange={(event) =>
                      setDeliveryAddress(
                        event.target.value
                      )
                    }
                    placeholder="Area, road, landmark, building, etc."
                    className="mt-2 min-h-12 w-full rounded-2xl border border-border-soft bg-background px-4 text-base text-text-main transition placeholder:text-text-muted/60 focus:border-brand-navy focus:outline-none"
                  />

                  <p className="mt-2 text-xs leading-5 text-text-muted">
                    Include a nearby landmark where
                    possible to make delivery easier.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="district"
                    className="text-sm font-bold text-brand-navy"
                  >
                    District / City
                  </label>

                  <input
                    id="district"
                    type="text"
                    value={district}
                    onChange={(event) =>
                      setDistrict(event.target.value)
                    }
                    placeholder="e.g. Kampala"
                    className="mt-2 min-h-12 w-full rounded-2xl border border-border-soft bg-background px-4 text-base text-text-main transition placeholder:text-text-muted/60 focus:border-brand-navy focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="deliveryNotes"
                    className="text-sm font-bold text-brand-navy"
                  >
                    Delivery Notes{" "}
                    <span className="font-normal text-text-muted">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    id="deliveryNotes"
                    rows={4}
                    value={deliveryNotes}
                    onChange={(event) =>
                      setDeliveryNotes(
                        event.target.value
                      )
                    }
                    placeholder="Gate colour, landmark, preferred delivery time, special instructions..."
                    className="mt-2 w-full resize-none rounded-2xl border border-border-soft bg-background px-4 py-3 text-base text-text-main transition placeholder:text-text-muted/60 focus:border-brand-navy focus:outline-none"
                  />
                </div>
              </div>

              {/* Delivery Notice */}

              <div className="mt-6 rounded-2xl bg-brand-navy p-4 text-white sm:p-5">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow font-black text-brand-navy">
                    ✓
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      Free delivery within Uganda
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/65">
                      Kampala orders can usually be
                      delivered the same day. Other parts
                      of Uganda are generally delivered
                      within two days. Deliveries after
                      7 PM should be confirmed first.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ============================================================
                PAYMENT
            ============================================================= */}

            <section className="rounded-[1.5rem] border border-border-soft bg-surface p-4 sm:rounded-3xl sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-yellow font-black text-brand-navy">
                  3
                </div>

                <div>
                  <h2 className="text-lg font-bold text-brand-navy sm:text-xl">
                    Payment Method
                  </h2>

                  <p className="mt-0.5 text-xs text-text-muted">
                    Choose how you would like to pay.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {paymentMethods.map((method) => {
                  const isSelected =
                    paymentMethod === method.value;

                  return (
                    <label
                      key={method.value}
                      className={[
                        "relative cursor-pointer rounded-2xl border p-4 transition",
                        isSelected
                          ? "border-brand-navy bg-brand-navy text-white"
                          : "border-border-soft bg-background text-text-main hover:border-brand-navy",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={isSelected}
                          onChange={(event) =>
                            setPaymentMethod(
                              event.target.value
                            )
                          }
                          className="mt-1 h-4 w-4 shrink-0 accent-[#FDFC3C]"
                        />

                        <div className="min-w-0">
                          <p
                            className={[
                              "font-bold",
                              isSelected
                                ? "text-brand-yellow"
                                : "text-brand-navy",
                            ].join(" ")}
                          >
                            {method.label}
                          </p>

                          <p
                            className={[
                              "mt-1 text-xs leading-5",
                              isSelected
                                ? "text-white/65"
                                : "text-text-muted",
                            ].join(" ")}
                          >
                            {method.description}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-yellow text-xs font-black text-brand-navy">
                          ✓
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-border-soft bg-background p-4">
                <p className="text-xs leading-5 text-text-muted">
                  Payment processing will be connected
                  later. For now, your chosen payment
                  method is saved with your order for
                  confirmation.
                </p>
              </div>
            </section>

            {/* ERROR */}

            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm font-semibold leading-6 text-danger"
              >
                <div className="flex gap-3">
                  <span aria-hidden="true">
                    !
                  </span>

                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================
              ORDER SUMMARY
          ============================================================= */}

          <aside className="h-fit overflow-hidden rounded-[1.75rem] bg-brand-navy text-white sm:rounded-3xl lg:sticky lg:top-6">
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-yellow">
                    Final Review
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Order Summary
                  </h2>
                </div>

                <div className="flex h-11 min-w-11 items-center justify-center rounded-full bg-brand-yellow px-3 font-black text-brand-navy">
                  {totalItems}
                </div>
              </div>

              {/* Products */}

              <div className="mt-6 space-y-4">
                {items.map((item) => {
                  const imageUrl =
                    getProductImageUrl(
                      item.imagePath
                    );

                  const itemTotal =
                    item.price * item.quantity;

                  return (
                    <div
                      key={item.variantId}
                      className="border-b border-white/10 pb-4"
                    >
                      <div className="flex gap-3">
                        <Link
                          href={`/products/${item.productSlug}`}
                          className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/10 sm:h-[72px] sm:w-[72px]"
                        >
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <span className="text-2xl">
                                🛏️
                              </span>
                            </div>
                          )}
                        </Link>

                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/products/${item.productSlug}`}
                            className="line-clamp-2 text-sm font-bold leading-snug hover:underline"
                          >
                            {item.productName}
                          </Link>

                          <p className="mt-1 truncate text-xs text-white/55">
                            {item.variantLabel}
                          </p>

                          <div className="mt-2 flex items-end justify-between gap-3">
                            <p className="text-xs text-white/50">
                              Qty: {item.quantity}
                            </p>

                            <p className="shrink-0 text-sm font-bold text-brand-yellow">
                              {formatPrice(itemTotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}

              <div className="mt-6 space-y-4 border-b border-white/15 pb-6">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-white/65">
                    Items
                  </span>

                  <span className="font-semibold">
                    {totalItems}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-white/65">
                    Subtotal
                  </span>

                  <span className="font-semibold">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-white/65">
                    Delivery
                  </span>

                  <span className="font-bold text-brand-yellow">
                    Free
                  </span>
                </div>
              </div>

              {/* Final Total */}

              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-white/65">
                    Total
                  </p>

                  <p className="mt-1 text-xs text-white/45">
                    Including delivery
                  </p>
                </div>

                <span className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {formatPrice(subtotal)}
                </span>
              </div>

              {/* Place Order */}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-7 flex min-h-13 w-full items-center justify-center rounded-full bg-brand-yellow px-6 py-4 text-center font-bold text-brand-navy transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-navy/30 border-t-brand-navy" />
                    Placing Order...
                  </span>
                ) : (
                  "Place Order"
                )}
              </button>

              <p className="mt-3 text-center text-[11px] leading-5 text-white/45">
                Please review your details before placing
                your order.
              </p>

              <Link
                href="/cart"
                className="mt-3 flex min-h-10 items-center justify-center text-center text-sm font-semibold text-white/65 transition hover:text-white"
              >
                ← Back to Cart
              </Link>
            </div>

            {/* Reassurance */}

            <div className="border-t border-white/10 bg-white/[0.06] p-5 sm:p-6">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow font-black text-brand-navy">
                  ✓
                </div>

                <div>
                  <p className="text-sm font-bold">
                    Guest checkout
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/60">
                    No account is required. You can use
                    the phone number entered above to
                    find your order later.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </section>
    </main>
  );
}