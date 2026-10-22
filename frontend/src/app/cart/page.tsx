"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";

function formatPrice(price: number) {
  return `UGX ${price.toLocaleString("en-UG")}`;
}

function getCartImageUrl(imagePath?: string | null) {
  if (!imagePath) {
    return null;
  }

  return `http://127.0.0.1:8000/storage/${imagePath}`;
}

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);

  const increaseQuantity = useCartStore(
    (state) => state.increaseQuantity
  );

  const decreaseQuantity = useCartStore(
    (state) => state.decreaseQuantity
  );

  const clearCart = useCartStore((state) => state.clearCart);

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-background text-text-main">
      {/* ================================================================
          BACK NAVIGATION
      ================================================================= */}

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <Link
          href="/shop"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-brand-navy transition hover:opacity-65"
        >
          <span
            aria-hidden="true"
            className="text-lg"
          >
            ←
          </span>

          <span>Continue Shopping</span>
        </Link>
      </div>

      {/* ================================================================
          CART
      ================================================================= */}

      <section className="mx-auto max-w-7xl px-4 pb-14 pt-5 sm:px-6 sm:pb-20 sm:pt-7 lg:px-8">
        {/* Heading */}

        <div className="mb-7 flex items-end justify-between gap-4 sm:mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-navy/55 sm:text-sm">
              Your order
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
              Shopping Cart
            </h1>

            <p className="mt-2 text-sm text-text-muted sm:text-base">
              {totalItems}{" "}
              {totalItems === 1 ? "item" : "items"} in your cart
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="shrink-0 text-sm font-bold text-danger underline-offset-4 hover:underline"
            >
              Clear cart
            </button>
          )}
        </div>

        {/* ==============================================================
            EMPTY CART
        =============================================================== */}

        {items.length === 0 ? (
          <div className="rounded-[1.75rem] border border-border-soft bg-surface px-5 py-14 text-center sm:rounded-[2rem] sm:px-6 sm:py-20">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-yellow text-4xl">
              🛒
            </div>

            <h2 className="mt-6 text-2xl font-bold text-brand-navy sm:text-3xl">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-muted sm:text-base">
              Add a mattress, pillow, duvet or another bedroom essential
              to get started.
            </p>

            <Link
              href="/shop"
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-brand-navy px-7 font-bold text-white transition hover:opacity-90"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
            {/* ==========================================================
                CART ITEMS
            =========================================================== */}

            <div className="space-y-4">
              {items.map((item) => {
                const imageUrl =
                  getCartImageUrl(item.imagePath);

                const itemTotal =
                  item.price * item.quantity;

                return (
                  <article
                    key={item.variantId}
                    className="overflow-hidden rounded-[1.5rem] border border-border-soft bg-surface sm:rounded-3xl"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-4 sm:grid-cols-[128px_minmax(0,1fr)] sm:gap-5">
                        {/* Product Image */}

                        <Link
                          href={`/products/${item.productSlug}`}
                          className="block"
                        >
                          <div className="aspect-square w-full overflow-hidden rounded-2xl bg-surface-soft">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.productName}
                                className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <span className="text-3xl sm:text-4xl">
                                  🛏️
                                </span>
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Product Info */}

                        <div className="min-w-0">
                          <Link
                            href={`/products/${item.productSlug}`}
                            className="block"
                          >
                            <h2 className="line-clamp-2 text-base font-bold leading-snug text-brand-navy hover:underline sm:text-lg">
                              {item.productName}
                            </h2>
                          </Link>

                          <p className="mt-1 text-xs leading-5 text-text-muted sm:text-sm">
                            Option:{" "}
                            <span className="font-bold text-brand-navy">
                              {item.variantLabel}
                            </span>
                          </p>

                          <p className="mt-2 text-sm font-bold text-brand-navy sm:text-base">
                            {formatPrice(item.price)}
                          </p>

                          {/* Desktop Controls */}

                          <div className="mt-4 hidden items-center gap-4 sm:flex">
                            <div className="grid h-11 grid-cols-[44px_48px_44px] items-center overflow-hidden rounded-full border border-border-soft bg-background">
                              <button
                                type="button"
                                onClick={() =>
                                  decreaseQuantity(
                                    item.variantId
                                  )
                                }
                                className="flex h-full items-center justify-center text-lg font-bold text-brand-navy transition hover:bg-surface-soft"
                                aria-label={`Decrease quantity of ${item.productName}`}
                              >
                                −
                              </button>

                              <span className="flex h-full items-center justify-center border-x border-border-soft text-sm font-bold text-brand-navy">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  increaseQuantity(
                                    item.variantId
                                  )
                                }
                                className="flex h-full items-center justify-center text-lg font-bold text-brand-navy transition hover:bg-surface-soft"
                                aria-label={`Increase quantity of ${item.productName}`}
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  item.variantId
                                )
                              }
                              className="text-sm font-bold text-danger hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Quantity Controls */}

                      <div className="mt-4 flex items-center justify-between border-t border-border-soft pt-4 sm:hidden">
                        <div className="grid h-11 grid-cols-[44px_46px_44px] items-center overflow-hidden rounded-full border border-border-soft bg-background">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(
                                item.variantId
                              )
                            }
                            className="flex h-full items-center justify-center text-lg font-bold text-brand-navy"
                            aria-label={`Decrease quantity of ${item.productName}`}
                          >
                            −
                          </button>

                          <span className="flex h-full items-center justify-center border-x border-border-soft text-sm font-bold text-brand-navy">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQuantity(
                                item.variantId
                              )
                            }
                            className="flex h-full items-center justify-center text-lg font-bold text-brand-navy"
                            aria-label={`Increase quantity of ${item.productName}`}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(item.variantId)
                          }
                          className="min-h-11 px-2 text-sm font-bold text-danger"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}

                    <div className="flex items-center justify-between border-t border-border-soft bg-background/60 px-4 py-3.5 sm:px-5">
                      <span className="text-xs font-semibold text-text-muted sm:text-sm">
                        Item total
                      </span>

                      <span className="font-bold text-brand-navy">
                        {formatPrice(itemTotal)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* ==========================================================
                ORDER SUMMARY
            =========================================================== */}

            <aside className="h-fit overflow-hidden rounded-[1.75rem] bg-brand-navy text-white sm:rounded-3xl lg:sticky lg:top-6">
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-yellow">
                      Your order
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                      Order Summary
                    </h2>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-yellow font-black text-brand-navy">
                    {totalItems}
                  </div>
                </div>

                {/* Summary Lines */}

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

                {/* Total */}

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

                {/* Checkout */}

                <Link
                  href="/checkout"
                  className="mt-7 flex min-h-13 w-full items-center justify-center rounded-full bg-brand-yellow px-6 py-4 text-center font-bold text-brand-navy transition hover:brightness-95"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  href="/shop"
                  className="mt-4 flex min-h-10 items-center justify-center text-center text-sm font-semibold text-white/65 transition hover:text-white"
                >
                  ← Continue Shopping
                </Link>
              </div>

              {/* Delivery Information */}

              <div className="border-t border-white/10 bg-white/[0.06] p-5 sm:p-6">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow font-black text-brand-navy">
                    ✓
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      Free delivery countrywide
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/60">
                      Kampala orders can be delivered the same day.
                      Other parts of Uganda are generally delivered
                      within two days.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}