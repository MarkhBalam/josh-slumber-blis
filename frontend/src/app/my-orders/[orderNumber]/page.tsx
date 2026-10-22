"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type ProductImage = {
  id: number;
  image_path: string;
  is_primary: boolean;
};

type OrderItem = {
  id: number;
  product_name: string;
  variant_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;

  product: {
    id: number;
    name: string;
    slug: string;
    images: ProductImage[];
  } | null;
};

type Order = {
  id: number;
  order_number: string;

  customer_name: string;

  delivery_address: string;
  district: string;
  delivery_notes: string | null;

  subtotal: string;
  delivery_fee: string;
  total: string;

  payment_method: string;
  payment_status: string;
  order_status: string;

  created_at: string;

  confirmed_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  paid_at: string | null;

  items: OrderItem[];
};

function formatPrice(price: string | number) {
  return `UGX ${Number(price).toLocaleString("en-UG")}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatText(value: string) {
  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function getProductImage(item: OrderItem) {
  if (!item.product?.images?.length) {
    return null;
  }

  const primaryImage =
    item.product.images.find(
      (image) => image.is_primary
    ) ?? item.product.images[0];

  return `${API_URL}/storage/${primaryImage.image_path}`;
}

function getStatusClasses(status: string) {
  switch (status) {
    case "pending":
      return "bg-brand-yellow text-brand-navy";

    case "confirmed":
      return "bg-blue-100 text-blue-800";

    case "processing":
      return "bg-purple-100 text-purple-800";

    case "out_for_delivery":
      return "bg-orange-100 text-orange-800";

    case "delivered":
      return "bg-success/10 text-success";

    case "cancelled":
      return "bg-danger/10 text-danger";

    default:
      return "bg-surface-soft text-text-muted";
  }
}

function getPaymentStatusClasses(status: string) {
  switch (status) {
    case "paid":
      return "bg-success/10 text-success";

    case "pending":
      return "bg-brand-yellow text-brand-navy";

    case "failed":
      return "bg-danger/10 text-danger";

    case "refunded":
      return "bg-purple-100 text-purple-800";

    default:
      return "bg-surface-soft text-text-muted";
  }
}

export default function CustomerOrderPage() {
  const params = useParams();

  const orderNumber = String(params.orderNumber);

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/orders/${encodeURIComponent(
            orderNumber
          )}`,
          {
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Order not found."
          );
        }

        setOrder(data.data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong while loading the order."
        );
      } finally {
        setLoading(false);
      }
    }

    if (orderNumber) {
      loadOrder();
    }
  }, [orderNumber]);

  const totalItems = useMemo(() => {
    if (!order) {
      return 0;
    }

    return order.items.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );
  }, [order]);

  /* ================================================================
     LOADING
  ================================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-text-main">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="rounded-[1.75rem] border border-border-soft bg-surface p-8 text-center sm:p-10">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-brand-navy/15 border-t-brand-navy" />

            <p className="mt-4 font-bold text-brand-navy">
              Loading your order...
            </p>

            <p className="mt-1 text-sm text-text-muted">
              We&apos;re retrieving the latest order details.
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ================================================================
     NOT FOUND
  ================================================================= */

  if (!order || error) {
    return (
      <main className="min-h-screen bg-background text-text-main">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <div className="rounded-[1.75rem] border border-border-soft bg-surface px-5 py-14 sm:rounded-3xl sm:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-yellow text-4xl">
              📦
            </div>

            <h1 className="mt-5 text-3xl font-bold text-brand-navy">
              Order not found
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-muted sm:text-base">
              {error ||
                "We couldn't find this order."}
            </p>

            <Link
              href="/my-orders"
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-brand-navy px-7 font-bold text-white transition hover:opacity-90"
            >
              Back to My Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ================================================================
     ORDER PROGRESS
  ================================================================= */

  const statusRank: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    processing: 2,
    out_for_delivery: 3,
    delivered: 4,
  };

  const currentRank =
    statusRank[order.order_status] ?? 0;

  const isCancelled =
    order.order_status === "cancelled";

  const timeline = [
    {
      key: "placed",
      label: "Order Placed",
      description:
        "Your order was successfully received.",
      date: order.created_at,
      complete: true,
    },
    {
      key: "confirmed",
      label: "Confirmed",
      description:
        "Your order has been reviewed and confirmed.",
      date: order.confirmed_at,
      complete:
        !isCancelled && currentRank >= 1,
    },
    {
      key: "processing",
      label: "Processing",
      description:
        "Your order is being prepared for delivery.",
      date: null,
      complete:
        !isCancelled && currentRank >= 2,
    },
    {
      key: "out_for_delivery",
      label: "Out for Delivery",
      description:
        "Your order is on its way to you.",
      date: order.out_for_delivery_at,
      complete:
        !isCancelled && currentRank >= 3,
    },
    {
      key: "delivered",
      label: "Delivered",
      description:
        "Your order has been successfully delivered.",
      date: order.delivered_at,
      complete:
        !isCancelled && currentRank >= 4,
    },
  ];

  return (
    <main className="min-h-screen bg-background text-text-main">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* ============================================================
            BACK
        ============================================================= */}

        <Link
          href="/my-orders"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-brand-navy transition hover:opacity-65"
        >
          <span className="text-lg">←</span>
          Back to My Orders
        </Link>

        {/* ============================================================
            ORDER HEADER
        ============================================================= */}

        <section className="mt-5 overflow-hidden rounded-[1.75rem] bg-brand-navy text-white sm:mt-7 sm:rounded-3xl">
          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-yellow">
                  Your Order
                </p>

                <h1 className="mt-2 break-all text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  {order.order_number}
                </h1>

                <p className="mt-2 text-xs text-white/60 sm:text-sm">
                  Placed {formatDate(order.created_at)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className={[
                    "rounded-full px-3 py-2 text-xs font-bold",
                    getStatusClasses(
                      order.order_status
                    ),
                  ].join(" ")}
                >
                  {formatText(
                    order.order_status
                  )}
                </span>

                <span
                  className={[
                    "rounded-full px-3 py-2 text-xs font-bold",
                    getPaymentStatusClasses(
                      order.payment_status
                    ),
                  ].join(" ")}
                >
                  Payment:{" "}
                  {formatText(
                    order.payment_status
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="grid border-t border-white/10 sm:grid-cols-3">
            <div className="border-b border-white/10 px-5 py-4 sm:border-b-0 sm:border-r">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                Customer
              </p>

              <p className="mt-1 text-sm font-bold">
                {order.customer_name}
              </p>
            </div>

            <div className="border-b border-white/10 px-5 py-4 sm:border-b-0 sm:border-r">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                Items
              </p>

              <p className="mt-1 text-sm font-bold">
                {totalItems}{" "}
                {totalItems === 1
                  ? "item"
                  : "items"}
              </p>
            </div>

            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                Order Total
              </p>

              <p className="mt-1 text-sm font-bold text-brand-yellow">
                {formatPrice(order.total)}
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================
            CANCELLED
        ============================================================= */}

        {order.cancelled_at && (
          <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/5 p-5">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger text-lg font-black text-white">
                !
              </div>

              <div>
                <p className="font-bold text-danger">
                  This order was cancelled
                </p>

                <p className="mt-1 text-sm text-danger/80">
                  Cancelled{" "}
                  {formatDate(
                    order.cancelled_at
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TRACKING
        ============================================================= */}

        <section className="mt-6 rounded-[1.75rem] border border-border-soft bg-surface p-5 sm:rounded-3xl sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-navy/50">
              Tracking
            </p>

            <h2 className="mt-1 text-2xl font-bold text-brand-navy">
              Order Progress
            </h2>

            <p className="mt-2 text-sm leading-6 text-text-muted">
              Follow your order from placement through
              delivery.
            </p>
          </div>

          <div className="mt-8">
            {timeline.map((step, index) => {
              const isLast =
                index === timeline.length - 1;

              const isCurrent =
                !isCancelled &&
                currentRank === index;

              return (
                <div
                  key={step.key}
                  className="relative flex gap-4 sm:gap-5"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={[
                        "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black transition",
                        step.complete
                          ? "border-brand-navy bg-brand-navy text-brand-yellow"
                          : isCurrent
                            ? "border-brand-yellow bg-brand-yellow text-brand-navy"
                            : "border-border-soft bg-background text-text-muted/40",
                      ].join(" ")}
                    >
                      {step.complete
                        ? "✓"
                        : index + 1}
                    </div>

                    {!isLast && (
                      <div
                        className={[
                          "min-h-16 w-0.5 flex-1",
                          step.complete &&
                          timeline[index + 1]
                            ?.complete
                            ? "bg-brand-navy"
                            : "bg-border-soft",
                        ].join(" ")}
                      />
                    )}
                  </div>

                  <div
                    className={[
                      "min-w-0 flex-1",
                      !isLast ? "pb-8" : "",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={[
                              "font-bold",
                              step.complete
                                ? "text-brand-navy"
                                : "text-text-muted/55",
                            ].join(" ")}
                          >
                            {step.label}
                          </p>

                          {isCurrent && (
                            <span className="rounded-full bg-brand-yellow px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-brand-navy">
                              Current
                            </span>
                          )}
                        </div>

                        <p
                          className={[
                            "mt-1 text-sm leading-5",
                            step.complete
                              ? "text-text-muted"
                              : "text-text-muted/50",
                          ].join(" ")}
                        >
                          {step.description}
                        </p>
                      </div>

                      {step.date ? (
                        <p className="shrink-0 text-xs font-semibold text-text-muted sm:text-sm">
                          {formatDate(step.date)}
                        </p>
                      ) : step.complete ? (
                        <span className="w-fit rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                          Completed
                        </span>
                      ) : (
                        <span className="w-fit rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-text-muted/60">
                          Not yet
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 border-t border-border-soft pt-6">
            <div className="flex flex-col gap-3 rounded-2xl bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-text-muted">
                  Payment
                </p>

                <p className="mt-1 font-bold text-brand-navy">
                  {formatText(
                    order.payment_method
                  )}
                </p>

                {order.paid_at && (
                  <p className="mt-1 text-xs text-text-muted">
                    Paid {formatDate(order.paid_at)}
                  </p>
                )}
              </div>

              <span
                className={[
                  "w-fit rounded-full px-3 py-2 text-xs font-bold",
                  getPaymentStatusClasses(
                    order.payment_status
                  ),
                ].join(" ")}
              >
                {formatText(
                  order.payment_status
                )}
              </span>
            </div>
          </div>
        </section>

        {/* ============================================================
            ITEMS
        ============================================================= */}

        <section className="mt-6 rounded-[1.75rem] border border-border-soft bg-surface p-4 sm:rounded-3xl sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-brand-navy sm:text-2xl">
                Items
              </h2>

              <p className="mt-1 text-xs text-text-muted sm:text-sm">
                {totalItems}{" "}
                {totalItems === 1
                  ? "item"
                  : "items"}{" "}
                in this order
              </p>
            </div>

            <p className="text-sm font-bold text-brand-navy sm:text-base">
              {formatPrice(order.subtotal)}
            </p>
          </div>

          <div className="mt-5 divide-y divide-border-soft">
            {order.items.map((item) => {
              const imageUrl =
                getProductImage(item);

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[76px_minmax(0,1fr)] gap-3 py-5 first:pt-0 last:pb-0 sm:grid-cols-[84px_minmax(0,1fr)_auto] sm:gap-4"
                >
                  <div className="h-[76px] w-[76px] overflow-hidden rounded-xl bg-surface-soft sm:h-[84px] sm:w-[84px] sm:rounded-2xl">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.product_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">
                        🛏️
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    {item.product ? (
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="line-clamp-2 font-bold leading-snug text-brand-navy hover:underline"
                      >
                        {item.product_name}
                      </Link>
                    ) : (
                      <p className="line-clamp-2 font-bold leading-snug text-brand-navy">
                        {item.product_name}
                      </p>
                    )}

                    <p className="mt-1 text-xs leading-5 text-text-muted sm:text-sm">
                      {item.variant_name}
                    </p>

                    <p className="mt-1 text-xs text-text-muted">
                      {formatPrice(
                        item.unit_price
                      )}{" "}
                      × {item.quantity}
                    </p>

                    <p className="mt-2 font-bold text-brand-navy sm:hidden">
                      {formatPrice(
                        item.subtotal
                      )}
                    </p>
                  </div>

                  <p className="hidden shrink-0 text-sm font-bold text-brand-navy sm:block">
                    {formatPrice(
                      item.subtotal
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================
            DELIVERY + TOTAL
        ============================================================= */}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-[1.75rem] border border-border-soft bg-surface p-5 sm:rounded-3xl sm:p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-yellow font-black text-brand-navy">
              D
            </div>

            <h2 className="mt-4 text-xl font-bold text-brand-navy">
              Delivery Details
            </h2>

            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
                Address
              </p>

              <p className="mt-2 font-bold leading-6 text-brand-navy">
                {order.delivery_address}
              </p>

              {order.district && (
                <p className="mt-1 text-sm text-text-muted">
                  {order.district}
                </p>
              )}
            </div>

            {order.delivery_notes && (
              <div className="mt-5 border-t border-border-soft pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
                  Delivery Notes
                </p>

                <p className="mt-2 text-sm leading-6 text-text-muted">
                  {order.delivery_notes}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-[1.75rem] bg-brand-navy p-5 text-white sm:rounded-3xl sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-yellow">
              Payment Summary
            </p>

            <h2 className="mt-1 text-xl font-bold">
              Order Total
            </h2>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-white/60">
                  Subtotal
                </span>

                <span className="font-semibold">
                  {formatPrice(
                    order.subtotal
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-white/60">
                  Delivery
                </span>

                <span
                  className={
                    Number(
                      order.delivery_fee
                    ) === 0
                      ? "font-bold text-brand-yellow"
                      : "font-semibold"
                  }
                >
                  {Number(
                    order.delivery_fee
                  ) === 0
                    ? "Free"
                    : formatPrice(
                        order.delivery_fee
                      )}
                </span>
              </div>
            </div>

            <div className="mt-6 border-t border-white/15 pt-5">
              <div className="flex items-end justify-between gap-4">
                <span className="text-sm text-white/60">
                  Total
                </span>

                <span className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {formatPrice(
                    order.total
                  )}
                </span>
              </div>
            </div>

            <div className="mt-6 border-t border-white/15 pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                Payment Method
              </p>

              <p className="mt-2 font-bold">
                {formatText(
                  order.payment_method
                )}
              </p>
            </div>
          </section>
        </div>

        {/* ============================================================
            BOTTOM ACTION
        ============================================================= */}

        <div className="mt-8 flex justify-center">
          <Link
            href="/shop"
            className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-brand-navy px-7 font-bold text-brand-navy transition hover:bg-brand-navy hover:text-white"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}