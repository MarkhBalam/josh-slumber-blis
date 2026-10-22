"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import Link from "next/link";

const API_URL = "http://127.0.0.1:8000";

type ProductImage = {
  id: number;
  image_path: string;
  alt_text?: string | null;
  sort_order?: number;
  is_primary: boolean;
};

type OrderItem = {
  id: number;
  product_id: number;
  product_variant_id: number;
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
  phone: string;

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

function getOrderStatusClasses(status: string) {
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

export default function MyOrdersPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          ![
            "delivered",
            "cancelled",
          ].includes(order.order_status)
      ),
    [orders]
  );

  const pastOrders = useMemo(
    () =>
      orders.filter((order) =>
        [
          "delivered",
          "cancelled",
        ].includes(order.order_status)
      ),
    [orders]
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!phone.trim()) {
      setError(
        "Enter the phone number you used at checkout."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSearched(false);

      const response = await fetch(
        `${API_URL}/api/orders/customer?phone=${encodeURIComponent(
          phone.trim()
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
        const validationErrors = data.errors
          ? Object.values(data.errors)
              .flat()
              .join(" ")
          : null;

        throw new Error(
          validationErrors ||
            data.message ||
            "Failed to find your orders."
        );
      }

      setOrders(data.data ?? []);
      setSearched(true);
    } catch (error) {
      setOrders([]);
      setSearched(true);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while finding your orders."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-text-main">
      {/* ================================================================
          INTRO
      ================================================================= */}

      <section className="border-b border-border-soft bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="inline-flex rounded-full bg-brand-yellow px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-navy sm:text-xs">
            Order Tracking
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl lg:text-5xl">
            My Orders
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted sm:text-base sm:leading-7">
            Find your recent Josh Slumber Blis orders and
            check how each one is progressing.
          </p>
        </div>
      </section>

      {/* ================================================================
          SEARCH
      ================================================================= */}

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="overflow-hidden rounded-[1.75rem] border border-border-soft bg-surface sm:rounded-3xl">
          <div className="p-5 sm:p-6">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-navy font-bold text-brand-yellow">
                i
              </div>

              <div>
                <h2 className="text-lg font-bold text-brand-navy">
                  Find your guest orders
                </h2>

                <p className="mt-1 text-sm leading-6 text-text-muted">
                  You do not need an account. Enter the
                  same phone number you used during
                  checkout to retrieve your orders.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div>
                <label
                  htmlFor="orderPhone"
                  className="sr-only"
                >
                  Checkout phone number
                </label>

                <input
                  id="orderPhone"
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="e.g. 0706 772 881"
                  className="min-h-12 w-full rounded-full border border-border-soft bg-background px-5 text-base text-text-main transition placeholder:text-text-muted/60 focus:border-brand-navy focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-12 items-center justify-center rounded-full bg-brand-navy px-7 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Finding Orders...
                  </span>
                ) : (
                  "Find My Orders"
                )}
              </button>
            </form>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm font-semibold leading-6 text-danger"
              >
                {error}
              </div>
            )}
          </div>

          <div className="border-t border-border-soft bg-background/60 px-5 py-4 sm:px-6">
            <p className="text-xs leading-5 text-text-muted">
              Tip: use the exact phone number you entered
              when you placed the order.
            </p>
          </div>
        </div>

        {/* ==============================================================
            RESULTS
        =============================================================== */}

        {searched && !error && (
          <div className="mt-10">
            {orders.length === 0 ? (
              <div className="rounded-[1.75rem] border border-border-soft bg-surface px-5 py-14 text-center sm:rounded-3xl sm:px-6 sm:py-16">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-yellow text-4xl">
                  📦
                </div>

                <h2 className="mt-5 text-2xl font-bold text-brand-navy">
                  No orders found
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-muted sm:text-base">
                  We couldn&apos;t find an order linked to
                  that phone number. Make sure you used
                  the same number entered at checkout.
                </p>

                <Link
                  href="/shop"
                  className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-brand-navy px-7 font-bold text-white transition hover:opacity-90"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <>
                {/* RESULTS HEADER */}

                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-navy/50">
                      Your purchases
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-brand-navy sm:text-3xl">
                      {orders.length}{" "}
                      {orders.length === 1
                        ? "Order"
                        : "Orders"}{" "}
                      Found
                    </h2>
                  </div>

                  <p className="text-xs text-text-muted sm:text-sm">
                    Newest orders first
                  </p>
                </div>

                {/* ACTIVE ORDERS */}

                {activeOrders.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-brand-yellow ring-4 ring-brand-yellow/20" />

                      <h3 className="text-xl font-bold text-brand-navy">
                        Active Orders
                      </h3>
                    </div>

                    <div className="mt-4 space-y-5">
                      {activeOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* PAST ORDERS */}

                {pastOrders.length > 0 && (
                  <div className="mt-10">
                    <h3 className="text-xl font-bold text-brand-navy">
                      Past Orders
                    </h3>

                    <div className="mt-4 space-y-5">
                      {pastOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function OrderCard({
  order,
}: {
  order: Order;
}) {
  const totalItems = order.items.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-border-soft bg-surface sm:rounded-3xl">
      {/* ================================================================
          ORDER HEADER
      ================================================================= */}

      <div className="border-b border-border-soft p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted sm:text-xs">
              Order Number
            </p>

            <p className="mt-1 break-all text-base font-bold text-brand-navy sm:text-lg">
              {order.order_number}
            </p>

            <p className="mt-2 text-xs text-text-muted sm:text-sm">
              Placed {formatDate(order.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={[
                "rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] sm:text-xs",
                getOrderStatusClasses(
                  order.order_status
                ),
              ].join(" ")}
            >
              {formatText(order.order_status)}
            </span>

            <span
              className={[
                "rounded-full px-3 py-1.5 text-[10px] font-bold sm:text-xs",
                getPaymentStatusClasses(
                  order.payment_status
                ),
              ].join(" ")}
            >
              Payment:{" "}
              {formatText(order.payment_status)}
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================
          ITEMS
      ================================================================= */}

      <div className="p-4 sm:p-6">
        <div className="space-y-5">
          {order.items.map((item) => {
            const imageUrl =
              getProductImage(item);

            return (
              <div
                key={item.id}
                className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 sm:grid-cols-[82px_minmax(0,1fr)_auto] sm:gap-4"
              >
                {/* Image */}

                <div className="h-[72px] w-[72px] overflow-hidden rounded-xl bg-surface-soft sm:h-[82px] sm:w-[82px] sm:rounded-2xl">
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

                {/* Product */}

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
                    Qty: {item.quantity}
                  </p>

                  <p className="mt-2 font-bold text-brand-navy sm:hidden">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>

                {/* Desktop item total */}

                <p className="hidden shrink-0 text-sm font-bold text-brand-navy sm:block">
                  {formatPrice(item.subtotal)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================
          ORDER CARD FOOTER
      ================================================================= */}

      <div className="border-t border-border-soft bg-background/60 p-4 sm:px-6 sm:py-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-xs text-text-muted sm:text-sm">
              {totalItems}{" "}
              {totalItems === 1
                ? "item"
                : "items"}
            </p>

            <p className="mt-1 text-xl font-bold text-brand-navy">
              {formatPrice(order.total)}
            </p>
          </div>

          <Link
            href={`/my-orders/${encodeURIComponent(
              order.order_number
            )}`}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-brand-yellow px-5 text-center text-sm font-bold text-brand-navy transition hover:brightness-95 sm:w-auto"
          >
            View Order & Tracking
          </Link>
        </div>
      </div>
    </article>
  );
}