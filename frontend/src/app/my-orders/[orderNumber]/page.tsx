"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type ProductImage = {
  image_path: string;
  is_primary: boolean;
};

type OrderItem = {
  id: number;
  product_name: string;
  variant_name: string;
  quantity: number;
  product: {
    slug: string;
    images: ProductImage[];
  } | null;
};

type Order = {
  id: number;
  order_number: string;
  order_status: string;
  created_at: string;
  confirmed_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  items: OrderItem[];
};

const STAGES = [
  {
    key: "pending",
    label: "Order Placed",
    description: "We have received your order.",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    description: "Your order has been reviewed and confirmed.",
  },
  {
    key: "processing",
    label: "Processing",
    description: "Your products are being prepared for delivery.",
  },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
    description: "Your order is on its way.",
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Your order has reached its destination.",
  },
];

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
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function productImage(item: OrderItem) {
  const images = item.product?.images;

  if (!images?.length) return null;

  const image = images.find((image) => image.is_primary) ?? images[0];

  return `${API_URL}/storage/${image.image_path}`;
}

export default function CustomerOrderPage() {
  const params = useParams();
  const orderNumber = String(params.orderNumber ?? "");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/orders/${encodeURIComponent(orderNumber)}`,
          {
            headers: { Accept: "application/json" },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Order not found.");
        }

        setOrder(data.data);
      } catch (error) {
        setOrder(null);
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load order tracking."
        );
      } finally {
        setLoading(false);
      }
    }

    if (orderNumber) {
      loadOrder();
    } else {
      setLoading(false);
    }
  }, [orderNumber]);

  const totalItems = useMemo(
    () =>
      order?.items.reduce((total, item) => total + item.quantity, 0) ?? 0,
    [order]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-20 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-navy/20 border-t-brand-navy" />
        <p className="mt-5 font-semibold text-brand-navy">
          Loading delivery progress...
        </p>
      </main>
    );
  }

  if (!order || error) {
    return (
      <main className="min-h-screen bg-background px-4 py-20 text-center">
        <div className="mx-auto max-w-xl rounded-3xl border border-border-soft bg-surface p-8">
          <div className="text-5xl">📦</div>
          <h1 className="mt-4 text-2xl font-bold text-brand-navy">
            Order Not Found
          </h1>
          <p className="mt-3 text-sm text-text-muted">
            {error || "We could not find this order."}
          </p>
          <Link
            href="/my-orders"
            className="mt-6 inline-flex rounded-full bg-brand-navy px-6 py-3 font-bold text-white"
          >
            Back to Order Tracking
          </Link>
        </div>
      </main>
    );
  }

  const cancelled = order.order_status === "cancelled";
  const currentIndex = Math.max(
    0,
    STAGES.findIndex((stage) => stage.key === order.order_status)
  );

  const progress = cancelled
    ? 0
    : (currentIndex / (STAGES.length - 1)) * 100;

  const stageDates: Record<string, string | null> = {
    pending: order.created_at,
    confirmed: order.confirmed_at,
    processing: null,
    out_for_delivery: order.out_for_delivery_at,
    delivered: order.delivered_at,
  };

  return (
    <main className="min-h-screen bg-background text-text-main">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/my-orders"
          className="inline-flex items-center gap-2 text-sm font-bold text-brand-navy hover:opacity-70"
        >
          <span aria-hidden="true">←</span>
          Back to My Orders
        </Link>

        <section className="mt-6 overflow-hidden rounded-3xl bg-brand-navy text-white">
          <div className="px-6 py-5 sm:px-8 sm:py-5">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-yellow">
              Delivery Tracking
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="break-all text-2xl font-bold sm:text-3xl">
                  {order.order_number}
                </h1>
                <p className="mt-2 text-sm text-white/70">
                  Placed {formatDate(order.created_at)}
                </p>
              </div>

              <span
                className={`rounded-full px-4 py-2 text-xs font-bold ${
                  cancelled
                    ? "bg-danger text-white"
                    : order.order_status === "delivered"
                      ? "bg-success text-white"
                      : "bg-brand-yellow text-brand-navy"
                }`}
              >
                {formatText(order.order_status)}
              </span>
            </div>
          </div>

          <div className="border-t border-white/15 px-6 py-3 text-sm text-white/80 sm:px-8">
            {totalItems} {totalItems === 1 ? "item" : "items"} in this order
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-border-soft bg-surface p-5 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Current Status
          </p>

          <h2 className="mt-2 text-2xl font-bold text-brand-navy">
            {cancelled
              ? "Order Cancelled"
              : STAGES[currentIndex].label}
          </h2>

          <p className="mt-2 text-sm leading-6 text-text-muted">
            {cancelled
              ? "This order has been cancelled."
              : STAGES[currentIndex].description}
          </p>

          <div className="mt-7">
            <div className="mb-3 flex justify-between text-xs font-semibold text-text-muted">
              <span>Order Progress</span>
              <span>
                {cancelled
                  ? "Cancelled"
                  : `Stage ${currentIndex + 1} of ${STAGES.length}`}
              </span>
            </div>

            <div
              role="progressbar"
              aria-label="Order progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="h-3 overflow-hidden rounded-full bg-border-soft"
            >
              <div
                className={`h-full rounded-full transition-all ${
                  cancelled ? "bg-danger" : "bg-brand-navy"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-6 md:mt-8">
            <div className="relative hidden md:grid md:grid-cols-5 md:gap-3">
              <div
                aria-hidden="true"
                className="absolute left-[10%] right-[10%] top-5 h-0.5 bg-border-soft"
              >
                <div
                  className={`h-full ${cancelled ? "bg-danger" : "bg-brand-navy"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {STAGES.map((stage, index) => {
                const complete = !cancelled && index < currentIndex;
                const current = !cancelled && index === currentIndex;
                const date = stageDates[stage.key];

                return (
                  <div
                    key={stage.key}
                    className="relative flex min-w-0 flex-col items-center text-center"
                  >
                    <div
                      className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${
                        complete
                          ? "border-brand-navy bg-brand-navy text-brand-yellow"
                          : current
                            ? "border-brand-yellow bg-brand-yellow text-brand-navy"
                            : "border-border-soft bg-background text-text-muted"
                      }`}
                    >
                      {complete ? "✓" : current ? "●" : index + 1}
                    </div>

                    <h3
                      className={`mt-3 text-sm font-bold ${
                        complete || current
                          ? "text-brand-navy"
                          : "text-text-muted"
                      }`}
                    >
                      {stage.label}
                    </h3>

                    {current && (
                      <span className="mt-2 rounded-full bg-brand-yellow px-2.5 py-1 text-[10px] font-bold uppercase text-brand-navy">
                        In Progress
                      </span>
                    )}

                    <p className="mt-2 text-xs leading-5 text-text-muted">
                      {stage.description}
                    </p>

                    {complete && date && (
                      <p className="mt-2 text-xs font-semibold text-text-muted">
                        {formatDate(date)}
                      </p>
                    )}

                    {complete && !date && (
                      <p className="mt-2 text-xs font-semibold text-success">
                        Completed
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-0 md:hidden">
              {STAGES.map((stage, index) => {
                const complete = !cancelled && index < currentIndex;
                const current = !cancelled && index === currentIndex;
                const date = stageDates[stage.key];
                const last = index === STAGES.length - 1;

                return (
                  <div key={stage.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                          complete
                            ? "border-brand-navy bg-brand-navy text-brand-yellow"
                            : current
                              ? "border-brand-yellow bg-brand-yellow text-brand-navy"
                              : "border-border-soft bg-background text-text-muted"
                        }`}
                      >
                        {complete ? "✓" : current ? "●" : index + 1}
                      </div>

                      {!last && (
                        <div
                          className={`min-h-12 w-0.5 flex-1 ${
                            index < currentIndex && !cancelled
                              ? "bg-brand-navy"
                              : "bg-border-soft"
                          }`}
                        />
                      )}
                    </div>

                    <div className={`min-w-0 flex-1 ${last ? "" : "pb-4"}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`font-bold ${
                            complete || current
                              ? "text-brand-navy"
                              : "text-text-muted"
                          }`}
                        >
                          {stage.label}
                        </h3>

                        {current && (
                          <span className="rounded-full bg-brand-yellow px-2.5 py-1 text-[10px] font-bold uppercase text-brand-navy">
                            Current
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-text-muted">
                        {stage.description}
                      </p>

                      {complete && date && (
                        <p className="mt-2 text-xs font-semibold text-text-muted">
                          {formatDate(date)}
                        </p>
                      )}

                      {current && (
                        <p className="mt-2 text-xs font-semibold text-brand-navy">
                          In Progress
                        </p>
                      )}

                      {complete && !date && (
                        <p className="mt-2 text-xs font-semibold text-success">
                          Completed
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {cancelled && order.cancelled_at && (
            <p className="mt-5 rounded-2xl bg-danger/10 p-4 text-sm font-semibold text-danger">
              Cancelled on {formatDate(order.cancelled_at)}
            </p>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-border-soft bg-surface p-5 sm:p-8">
          <h2 className="text-xl font-bold text-brand-navy sm:text-2xl">
            Products in This Order
          </h2>

          <div className="mt-5 divide-y divide-border-soft">
            {order.items.map((item) => {
              const image = productImage(item);

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-5 first:pt-0 last:pb-0"
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-soft">
                    {image ? (
                      <img
                        src={image}
                        alt={item.product_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">🛏️</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    {item.product ? (
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="font-bold text-brand-navy hover:underline"
                      >
                        {item.product_name}
                      </Link>
                    ) : (
                      <p className="font-bold text-brand-navy">
                        {item.product_name}
                      </p>
                    )}

                    <p className="mt-1 text-sm text-text-muted">
                      {item.variant_name}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-8 text-center">
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
