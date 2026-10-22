"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type ProductImage = {
  id: number;
  image_path: string;
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

  variant: {
    id: number;
    label: string;
    size_label: string | null;
    price: string;
  } | null;
};

type Order = {
  id: number;
  order_number: string;

  customer_name: string;
  phone: string;
  email: string | null;

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
  updated_at: string;

  confirmed_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  paid_at: string | null;

  items: OrderItem[];
};

const ORDER_STATUSES = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "confirmed",
    label: "Confirmed",
  },
  {
    value: "processing",
    label: "Processing",
  },
  {
    value: "out_for_delivery",
    label: "Out for Delivery",
  },
  {
    value: "delivered",
    label: "Delivered",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

const PAYMENT_STATUSES = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "paid",
    label: "Paid",
  },
  {
    value: "failed",
    label: "Failed",
  },
  {
    value: "refunded",
    label: "Refunded",
  },
];

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

function getOrderStatusClasses(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";

    case "confirmed":
      return "bg-blue-100 text-blue-800";

    case "processing":
      return "bg-purple-100 text-purple-800";

    case "out_for_delivery":
      return "bg-orange-100 text-orange-800";

    case "delivered":
      return "bg-green-100 text-green-800";

    case "cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getPaymentStatusClasses(status: string) {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800";

    case "pending":
      return "bg-yellow-100 text-yellow-800";

    case "failed":
      return "bg-red-100 text-red-700";

    case "refunded":
      return "bg-purple-100 text-purple-800";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();

  const orderId = String(params.id);

  const [order, setOrder] = useState<Order | null>(null);

  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Order
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    async function loadOrder() {
      const token = localStorage.getItem(
        "josh-slumber-blis-admin-token"
      );

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/admin/orders/${orderId}`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        if (response.status === 401) {
          localStorage.removeItem(
            "josh-slumber-blis-admin-token"
          );

          localStorage.removeItem(
            "josh-slumber-blis-admin-user"
          );

          router.replace("/admin/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load order."
          );
        }

        const loadedOrder: Order = data.data;

        setOrder(loadedOrder);
        setOrderStatus(loadedOrder.order_status);
        setPaymentStatus(loadedOrder.payment_status);
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

    if (orderId) {
      loadOrder();
    }
  }, [orderId, router]);

  /*
  |--------------------------------------------------------------------------
  | Order Calculations
  |--------------------------------------------------------------------------
  */

  const totalQuantity = useMemo(() => {
    if (!order) {
      return 0;
    }

    return order.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [order]);

  /*
  |--------------------------------------------------------------------------
  | Save Status
  |--------------------------------------------------------------------------
  */

  async function handleSave() {
    if (!order) {
      return;
    }

    const token = localStorage.getItem(
      "josh-slumber-blis-admin-token"
    );

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/admin/orders/${order.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            order_status: orderStatus,
            payment_status: paymentStatus,
          }),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem(
          "josh-slumber-blis-admin-token"
        );

        localStorage.removeItem(
          "josh-slumber-blis-admin-user"
        );

        router.replace("/admin/login");
        return;
      }

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
            "Failed to update order."
        );
      }

      const updated: Order = data.data;

      setOrder(updated);
      setOrderStatus(updated.order_status);
      setPaymentStatus(updated.payment_status);

      setSuccess("Order updated successfully.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating the order."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f6f2] text-[#1f1f1f]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-3xl border border-black/10 bg-white p-10">
            <p className="font-semibold">
              Loading order...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Missing Order
  |--------------------------------------------------------------------------
  */

  if (!order) {
    return (
      <main className="min-h-screen bg-[#f8f6f2] text-[#1f1f1f]">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <div className="rounded-3xl border border-black/10 bg-white p-10">
            <h1 className="text-3xl font-bold">
              Order not found
            </h1>

            <Link
              href="/admin/orders"
              className="mt-6 inline-block rounded-full bg-black px-6 py-3 font-semibold text-white"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Timeline Data
  |--------------------------------------------------------------------------
  */

  const timeline = [
    {
      label: "Order Placed",
      description: "Customer submitted the order.",
      date: order.created_at,
      complete: true,
    },
    {
      label: "Confirmed",
      description: "Order accepted and confirmed.",
      date: order.confirmed_at,
      complete: Boolean(order.confirmed_at),
    },
    {
      label: "Paid",
      description: "Payment received successfully.",
      date: order.paid_at,
      complete: Boolean(order.paid_at),
    },
    {
      label: "Out for Delivery",
      description: "Order dispatched for delivery.",
      date: order.out_for_delivery_at,
      complete: Boolean(order.out_for_delivery_at),
    },
    {
      label: "Delivered",
      description: "Order delivered to the customer.",
      date: order.delivered_at,
      complete: Boolean(order.delivered_at),
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-[#f8f6f2] text-[#1f1f1f]">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-black"
        >
          <span>←</span>
          <span>Back to Orders</span>
        </Link>

        {/* Header */}
        <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
              Order
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              {order.order_number}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Placed {formatDate(order.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold",
                getOrderStatusClasses(order.order_status),
              ].join(" ")}
            >
              {formatText(order.order_status)}
            </span>

            <span
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold",
                getPaymentStatusClasses(order.payment_status),
              ].join(" ")}
            >
              Payment: {formatText(order.payment_status)}
            </span>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
            {success}
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* LEFT */}
          <div className="space-y-6">

            {/* Timeline */}
            <section className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Progress
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Order Timeline
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Track this order from placement to delivery.
                </p>
              </div>

              {/* Cancelled Warning */}
              {order.cancelled_at && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="font-bold text-red-700">
                    Order Cancelled
                  </p>

                  <p className="mt-1 text-sm text-red-600">
                    Cancelled {formatDate(order.cancelled_at)}
                  </p>
                </div>
              )}

              <div className="mt-8">
                {timeline.map((step, index) => {
                  const isLast =
                    index === timeline.length - 1;

                  return (
                    <div
                      key={step.label}
                      className="relative flex gap-5"
                    >
                      {/* Timeline marker */}
                      <div className="flex flex-col items-center">
                        <div
                          className={[
                            "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                            step.complete
                              ? "border-black bg-black text-white"
                              : "border-black/15 bg-white text-gray-300",
                          ].join(" ")}
                        >
                          {step.complete ? "✓" : index + 1}
                        </div>

                        {!isLast && (
                          <div
                            className={[
                              "min-h-16 w-0.5 flex-1",
                              step.complete
                                ? "bg-black"
                                : "bg-black/10",
                            ].join(" ")}
                          />
                        )}
                      </div>

                      {/* Timeline content */}
                      <div
                        className={[
                          "min-w-0 flex-1",
                          !isLast ? "pb-8" : "",
                        ].join(" ")}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p
                              className={[
                                "font-bold",
                                step.complete
                                  ? "text-black"
                                  : "text-gray-400",
                              ].join(" ")}
                            >
                              {step.label}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {step.description}
                            </p>
                          </div>

                          <div className="text-right">
                            {step.date ? (
                              <p className="text-sm font-semibold text-gray-700">
                                {formatDate(step.date)}
                              </p>
                            ) : (
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-400">
                                Not yet
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Items */}
            <section className="rounded-3xl border border-black/10 bg-white p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    Order Items
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {totalQuantity}{" "}
                    {totalQuantity === 1 ? "item" : "items"}
                  </p>
                </div>

                <p className="font-bold">
                  {formatPrice(order.subtotal)}
                </p>
              </div>

              <div className="mt-6 divide-y divide-black/10">
                {order.items.map((item) => {
                  const imageUrl = getProductImage(item);

                  return (
                    <div
                      key={item.id}
                      className="flex gap-5 py-5 first:pt-0 last:pb-0"
                    >
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#ece8e1]">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.product_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl">
                            🛏️
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap justify-between gap-4">
                          <div>
                            {item.product ? (
                              <Link
                                href={`/products/${item.product.slug}`}
                                target="_blank"
                                className="font-bold hover:underline"
                              >
                                {item.product_name}
                              </Link>
                            ) : (
                              <p className="font-bold">
                                {item.product_name}
                              </p>
                            )}

                            <p className="mt-1 text-sm text-gray-500">
                              {item.variant_name}
                            </p>

                            <p className="mt-2 text-sm text-gray-500">
                              {formatPrice(item.unit_price)} ×{" "}
                              {item.quantity}
                            </p>
                          </div>

                          <p className="font-bold">
                            {formatPrice(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Customer */}
            <section className="rounded-3xl border border-black/10 bg-white p-6">
              <h2 className="text-2xl font-bold">
                Customer
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Info
                  label="Name"
                  value={order.customer_name}
                />

                <Info
                  label="Phone"
                  value={order.phone}
                />

                <Info
                  label="Email"
                  value={order.email ?? "Not provided"}
                />

                <Info
                  label="District / City"
                  value={order.district}
                />
              </div>
            </section>

            {/* Delivery */}
            <section className="rounded-3xl border border-black/10 bg-white p-6">
              <h2 className="text-2xl font-bold">
                Delivery
              </h2>

              <div className="mt-6">
                <Info
                  label="Delivery Address"
                  value={order.delivery_address}
                />
              </div>

              <div className="mt-5">
                <Info
                  label="Delivery Notes"
                  value={
                    order.delivery_notes ??
                    "No delivery notes"
                  }
                />
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <aside className="space-y-6">
            {/* Manage */}
            <section className="rounded-3xl border border-black/10 bg-white p-6">
              <h2 className="text-2xl font-bold">
                Manage Order
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Update order progress and payment status.
              </p>

              <div className="mt-6">
                <label className="text-sm font-semibold">
                  Order Status
                </label>

                <select
                  value={orderStatus}
                  onChange={(event) => {
                    setOrderStatus(event.target.value);
                    setSuccess("");
                  }}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-black"
                >
                  {ORDER_STATUSES.map((status) => (
                    <option
                      key={status.value}
                      value={status.value}
                    >
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-5">
                <label className="text-sm font-semibold">
                  Payment Status
                </label>

                <select
                  value={paymentStatus}
                  onChange={(event) => {
                    setPaymentStatus(event.target.value);
                    setSuccess("");
                  }}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-black"
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <option
                      key={status.value}
                      value={status.value}
                    >
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="mt-6 w-full rounded-full bg-black px-6 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Status"}
              </button>

              <div className="mt-7 border-t border-black/10 pt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Payment Method
                </p>

                <p className="mt-2 font-bold">
                  {formatText(order.payment_method)}
                </p>

                {order.paid_at && (
                  <p className="mt-1 text-sm text-gray-500">
                    Paid {formatDate(order.paid_at)}
                  </p>
                )}
              </div>
            </section>

            {/* Totals */}
            <section className="rounded-3xl bg-black p-6 text-white">
              <h2 className="text-xl font-bold">
                Order Total
              </h2>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">
                    Subtotal
                  </span>

                  <span>
                    {formatPrice(order.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-white/60">
                    Delivery
                  </span>

                  <span>
                    {Number(order.delivery_fee) === 0
                      ? "Free"
                      : formatPrice(order.delivery_fee)}
                  </span>
                </div>

                <div className="border-t border-white/15 pt-5">
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-white/60">
                      Total
                    </span>

                    <span className="text-2xl font-bold">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
        {label}
      </p>

      <p className="mt-1 font-semibold">
        {value}
      </p>
    </div>
  );
}