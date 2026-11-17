
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  Trash2,
} from "lucide-react";

import { useCartStore } from "@/store/cartStore";

function formatPrice(price: number) {
  return `UGX ${price.toLocaleString("en-UG")}`;
}

function getCartImageUrl(imagePath?: string | null) {
  if (!imagePath) return null;

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://")
  ) {
    return imagePath;
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

  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  return (
    <main className="min-h-screen bg-background text-text-main">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <Link
          href="/shop"
          className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-brand-navy transition hover:opacity-65"
        >
          <ArrowLeft size={17} />
          Continue Shopping
        </Link>
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-12 pt-3 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-navy/55">
              Your Order
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
              Shopping Cart
            </h1>

            <p className="mt-1 text-sm text-text-muted">
              {totalItems}{" "}
              {totalItems === 1 ? "item" : "items"} in your cart
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="inline-flex min-h-10 shrink-0 items-center gap-1.5 text-sm font-semibold text-danger transition hover:opacity-70"
            >
              <Trash2 size={15} />
              Clear cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-border-soft bg-surface px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-yellow text-brand-navy">
              <ShoppingBag size={30} />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-brand-navy">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-muted">
              Your next great night&apos;s sleep is just a few clicks away.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-navy px-7 font-bold text-white transition hover:opacity-90"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-7">
            {/* LEFT COLUMN */}
            <div className="space-y-4">
              {items.map((item) => {
                const imageUrl = getCartImageUrl(item.imagePath);
                const itemTotal = item.price * item.quantity;

                return (
                  <article
                    key={item.variantId}
                    className="overflow-hidden rounded-3xl border border-border-soft bg-surface"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-4 sm:grid-cols-[128px_minmax(0,1fr)] sm:gap-5">
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
                              <div className="flex h-full w-full items-center justify-center text-3xl">
                                🛏️
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="min-w-0">
                          <Link
                            href={`/products/${item.productSlug}`}
                          >
                            <h2 className="line-clamp-2 text-base font-bold text-brand-navy hover:underline sm:text-lg">
                              {item.productName}
                            </h2>
                          </Link>

                          <p className="mt-1 text-sm text-text-muted">
                            Size:{" "}
                            <span className="font-semibold text-brand-navy">
                              {item.variantLabel}
                            </span>
                          </p>

                          <p className="mt-2 text-base font-bold text-brand-navy">
                            {formatPrice(item.price)}
                          </p>

                          {/* DESKTOP QUANTITY CONTROLS */}
                          <div className="mt-4 hidden items-center gap-4 sm:flex">
                            <div className="flex h-10 items-center overflow-hidden rounded-full border border-border-soft bg-background">
                              <button
                                type="button"
                                onClick={() =>
                                  decreaseQuantity(item.variantId)
                                }
                                aria-label="Decrease quantity"
                                className="flex h-10 w-11 items-center justify-center text-brand-navy transition hover:bg-surface-soft"
                              >
                                <Minus size={15} />
                              </button>

                              <span className="flex h-10 w-11 items-center justify-center border-x border-border-soft text-sm font-bold text-brand-navy">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  increaseQuantity(item.variantId)
                                }
                                aria-label="Increase quantity"
                                className="flex h-10 w-11 items-center justify-center text-brand-navy transition hover:bg-surface-soft"
                              >
                                <Plus size={15} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeItem(item.variantId)
                              }
                              className="text-sm font-semibold text-danger hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* MOBILE QUANTITY CONTROLS */}
                      <div className="mt-4 flex items-center justify-between border-t border-border-soft pt-4 sm:hidden">
                        <div className="flex h-10 items-center overflow-hidden rounded-full border border-border-soft bg-background">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(item.variantId)
                            }
                            aria-label="Decrease quantity"
                            className="flex h-10 w-11 items-center justify-center text-brand-navy"
                          >
                            <Minus size={15} />
                          </button>

                          <span className="flex h-10 w-11 items-center justify-center border-x border-border-soft text-sm font-bold text-brand-navy">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQuantity(item.variantId)
                            }
                            aria-label="Increase quantity"
                            className="flex h-10 w-11 items-center justify-center text-brand-navy"
                          >
                            <Plus size={15} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(item.variantId)
                          }
                          className="min-h-10 text-sm font-semibold text-danger"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-soft bg-background/60 px-4 py-3 sm:px-5">
                      <span className="text-xs font-semibold text-text-muted">
                        Item total
                      </span>

                      <span className="font-bold text-brand-navy">
                        {formatPrice(itemTotal)}
                      </span>
                    </div>
                  </article>
                );
              })}

              {/* DELIVERY INFORMATION */}
              <div className="rounded-2xl border border-border-soft bg-surface px-4 py-4 sm:px-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-navy/5 text-brand-navy">
                    <Truck size={20} strokeWidth={1.8} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-brand-navy">
                      Free Delivery Across Uganda
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-text-muted sm:text-sm">
                      Enjoy free delivery throughout Uganda.
                      Same-day delivery in Kampala. Other
                      locations are generally delivered within
                      two days. Orders after 7 PM require
                      confirmation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY */}
            <aside className="overflow-hidden rounded-3xl bg-brand-navy text-white lg:sticky lg:top-4">
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-yellow">
                      Your Order
                    </p>

                    <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                      Order Summary
                    </h2>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-yellow font-bold text-brand-navy">
                    {totalItems}
                  </div>
                </div>

                <div className="mt-5 space-y-3 border-b border-white/15 pb-4">
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

                    <span className="text-right text-xs font-bold text-brand-yellow">
                      Free
                    </span>
                  </div>
                </div>

                {/* FINAL TOTAL */}
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm text-white/65">
                      Total
                    </p>

                    <p className="mt-1 text-[11px] text-white/45">
                      Including free delivery
                    </p>
                  </div>

                  <span className="whitespace-nowrap text-2xl font-bold tracking-tight">
                    {formatPrice(total)}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-brand-yellow px-5 py-3 text-center font-bold text-brand-navy transition hover:brightness-95"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  href="/shop"
                  className="mt-3 flex min-h-9 items-center justify-center gap-2 text-sm font-semibold text-white/65 transition hover:text-white"
                >
                  <ArrowLeft size={15} />
                  Continue Shopping
                </Link>

                <div className="mt-3 flex items-center justify-center gap-2 border-t border-white/10 pt-3 text-xs text-white/55">
                  <Check
                    size={14}
                    className="text-brand-yellow"
                  />
                  Review your order before payment
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
