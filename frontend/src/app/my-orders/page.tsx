"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

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
  items: OrderItem[];
};

const STAGES = [
  "pending",
  "confirmed",
  "processing",
  "out_for_delivery",
  "delivered",
];

function formatText(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function productImage(item: OrderItem) {
  const images = item.product?.images;

  if (!images?.length) return null;

  const image = images.find((image) => image.is_primary) ?? images[0];

  return `${API_URL}/storage/${image.image_path}`;
}

function OrderCard({ order }: { order: Order }) {
  const cancelled = order.order_status === "cancelled";
  const stageIndex = STAGES.indexOf(order.order_status);
  const currentStage = stageIndex < 0 ? 0 : stageIndex;
  const progress = cancelled ? 0 : (currentStage / (STAGES.length - 1)) * 100;

  return (
    <article className="overflow-hidden rounded-3xl border border-border-soft bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-soft p-5 sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Order Number
          </p>
          <h3 className="mt-1 break-all text-lg font-bold text-brand-navy">
            {order.order_number}
          </h3>
          <p className="mt-2 text-xs text-text-muted">
            Placed {formatDate(order.created_at)}
          </p>
        </div>

        <span
          className={`rounded-full px-4 py-2 text-xs font-bold ${
            cancelled
              ? "bg-danger/10 text-danger"
              : order.order_status === "delivered"
                ? "bg-success/10 text-success"
                : "bg-brand-yellow text-brand-navy"
          }`}
        >
          {formatText(order.order_status)}
        </span>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        {order.items.map((item) => {
          const image = productImage(item);

          return (
            <div key={item.id} className="flex items-center gap-4">
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
                <p className="font-bold text-brand-navy">
                  {item.product_name}
                </p>
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

      <div className="border-t border-border-soft bg-background/60 p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-brand-navy">
            Delivery Progress
          </p>
          <span className="text-xs font-semibold text-text-muted">
            {cancelled ? "Cancelled" : `${Math.round(progress)}%`}
          </span>
        </div>

        <div
          className="h-2.5 overflow-hidden rounded-full bg-border-soft"
          role="progressbar"
          aria-label="Delivery progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className={`h-full rounded-full transition-all ${
              cancelled ? "bg-danger" : "bg-brand-navy"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 flex justify-between gap-2 text-[10px] font-semibold text-text-muted sm:text-xs">
          <span>Pending</span>
          <span>Confirmed</span>
          <span>Processing</span>
          <span>On the Way</span>
          <span>Delivered</span>
        </div>

        {cancelled && (
          <p className="mt-4 text-sm font-semibold text-danger">
            This order has been cancelled.
          </p>
        )}

        <Link
          href={`/my-orders/${encodeURIComponent(order.order_number)}`}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-brand-yellow px-6 text-center text-sm font-bold text-brand-navy transition hover:brightness-95 sm:w-auto"
        >
          View Delivery Timeline
        </Link>
      </div>
    </article>
  );
}

export default function MyOrdersPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          !["delivered", "cancelled"].includes(order.order_status)
      ),
    [orders]
  );

  const pastOrders = useMemo(
    () =>
      orders.filter((order) =>
        ["delivered", "cancelled"].includes(order.order_status)
      ),
    [orders]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!phone.trim()) {
      setError("Enter the phone number used at checkout.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSearched(false);

      const response = await fetch(
        `${API_URL}/api/orders/customer`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: phone.trim(),
          }),
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to find orders.");
      }

      setOrders(data.data ?? []);
      setSearched(true);
    } catch (error) {
      setOrders([]);
      setSearched(true);
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-text-main">
      <section className="border-b border-border-soft bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="inline-flex rounded-full bg-brand-yellow px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-navy">
            Order Tracking
          </div>

          <h1 className="mt-3 text-3xl font-bold text-brand-navy sm:text-5xl">
            Track Your Orders
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-text-muted sm:text-base">
            Enter your checkout phone number to see your products
            and follow their delivery progress.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-3xl border border-border-soft bg-surface p-5 sm:p-7">
          <h2 className="text-xl font-bold text-brand-navy">
            Find Your Orders
          </h2>

          <p className="mt-2 text-sm text-text-muted">
            No account required. Use the phone number you entered at checkout.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <input
              type="tel"
              required
              inputMode="tel"
              autoComplete="tel"
              aria-label="Checkout phone number"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="e.g. 0706 772 881"
              className="min-h-12 w-full rounded-full border border-border-soft bg-background px-5 text-base text-text-main focus:border-brand-navy focus:outline-none"
            />

            <button
              type="submit"
              disabled={loading}
              className="min-h-12 rounded-full bg-brand-navy px-7 font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Finding Orders..." : "Track My Orders"}
            </button>
          </form>

          {error && (
            <p role="alert" className="mt-4 text-sm font-semibold text-danger">
              {error}
            </p>
          )}
        </div>

        {searched && !error && (
          <div className="mt-10">
            {orders.length === 0 ? (
              <div className="rounded-3xl border border-border-soft bg-surface px-6 py-14 text-center">
                <div className="text-5xl">📦</div>
                <h2 className="mt-4 text-2xl font-bold text-brand-navy">
                  No Orders Found
                </h2>
                <p className="mt-3 text-sm text-text-muted">
                  Check that you entered the same phone number used at checkout.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-brand-navy">
                  {orders.length} {orders.length === 1 ? "Order" : "Orders"} Found
                </h2>

                {activeOrders.length > 0 && (
                  <div className="mt-8">
                    <h3 className="mb-4 text-xl font-bold text-brand-navy">
                      Active Orders
                    </h3>
                    <div className="space-y-5">
                      {activeOrders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                  </div>
                )}

                {pastOrders.length > 0 && (
                  <div className="mt-8">
                    <h3 className="mb-4 text-xl font-bold text-brand-navy">
                      Past Orders
                    </h3>
                    <div className="space-y-5">
                      {pastOrders.map((order) => (
                        <OrderCard key={order.id} order={order} />
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
