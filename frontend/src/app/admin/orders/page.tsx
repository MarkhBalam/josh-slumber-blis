"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

function formatPaymentMethod(method: string) {
  return method
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function getStatusClasses(status: string) {
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

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function loadOrders() {
      const token = localStorage.getItem(
        "josh-slumber-blis-admin-token"
      );

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/admin/orders",
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
            data.message || "Failed to load orders."
          );
        }

        setOrders(data.data ?? []);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong while loading orders."
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [router]);

  const filteredOrders = useMemo(() => {
    if (filter === "all") {
      return orders;
    }

    return orders.filter(
      (order) => order.order_status === filter
    );
  }, [orders, filter]);

  const pendingOrders = orders.filter(
    (order) => order.order_status === "pending"
  ).length;

  const activeOrders = orders.filter((order) =>
    [
      "confirmed",
      "processing",
      "out_for_delivery",
    ].includes(order.order_status)
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.order_status === "delivered"
  ).length;

  const paidOrderValue = orders
    .filter((order) => order.payment_status === "paid")
    .reduce((total, order) => total + Number(order.total), 0);

  return (
    <main className="min-h-screen bg-background text-brand-navy">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-brand-navy">
            Orders
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Review purchases, track fulfilment and manage customer orders.
          </p>
        </div>

        {/* Stats */}
        {!loading && !error && (
          <section className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {[
              {
                label: "Total orders",
                value: String(orders.length),
                detail: "All customer orders",
              },
              {
                label: "Pending orders",
                value: String(pendingOrders),
                detail: "Awaiting confirmation",
              },
              {
                label: "Orders in progress",
                value: String(activeOrders),
                detail: "Being fulfilled",
              },
              {
                label: "Paid order value",
                value: formatPrice(paidOrderValue),
                detail: "Confirmed paid orders",
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="min-w-0 rounded-2xl border border-brand-navy/10 bg-white p-3 sm:p-5"
              >
                <p className="text-xs font-medium text-slate-500 sm:text-sm">
                  {metric.label}
                </p>
                <p className="mt-2 break-words text-xl font-extrabold tracking-tight text-brand-navy sm:mt-3 sm:text-2xl">
                  {metric.value}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {metric.detail}
                </p>
              </div>
            ))}
          </section>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-10 rounded-3xl border border-black/10 bg-white p-8">
            <p className="font-semibold">
              Loading orders...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Filters */}
            <div className="mt-7 overflow-hidden rounded-2xl border border-brand-navy/10 bg-white">
              <div className="flex gap-2 overflow-x-auto px-4 py-4 sm:flex-wrap sm:px-6">
                {[
                  ["all", "All"],
                  ["pending", "Pending"],
                  ["confirmed", "Confirmed"],
                  ["processing", "Processing"],
                  ["out_for_delivery", "Out for Delivery"],
                  ["delivered", "Delivered"],
                  ["cancelled", "Cancelled"],
                ].map(([value, label]) => {
                  const count =
                    value === "all"
                      ? orders.length
                      : orders.filter(
                          (order) => order.order_status === value
                        ).length;

                  const active = filter === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                        active
                          ? "bg-brand-navy text-white"
                          : "bg-surface-soft text-brand-navy hover:bg-brand-navy/10"
                      }`}
                    >
                      {label}
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-white text-brand-navy"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Orders */}
            <div className="mt-6">
              {filteredOrders.length === 0 ? (
                <div className="rounded-3xl border border-black/10 bg-white px-6 py-16 text-center">
                  <div className="text-5xl">
                    📦
                  </div>

                  <h2 className="mt-5 text-2xl font-bold">
                    No orders found
                  </h2>

                  <p className="mt-2 text-gray-500">
                    There are currently no orders with
                    this status.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => {
                    const itemQuantity =
                      order.items.reduce(
                        (total, item) =>
                          total + item.quantity,
                        0
                      );

                    return (
                      <article
                        key={order.id}
                        className="overflow-hidden rounded-2xl border border-brand-navy/10 bg-white"
                      >
                        <div className="grid grid-cols-2 gap-x-3 gap-y-4 p-4 sm:p-5 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center">
                          {/* Order */}
                          <div className="col-span-2 lg:col-span-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                              Order
                            </p>

                            <p className="mt-1 break-all font-bold text-brand-navy">
                              {order.order_number}
                            </p>

                            <p className="mt-2 text-sm text-gray-500">
                              {formatDate(
                                order.created_at
                              )}
                            </p>
                          </div>

                          {/* Customer */}
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                              Customer
                            </p>

                            <p className="mt-1 font-semibold">
                              {order.customer_name}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {order.phone}
                            </p>
                          </div>

                          {/* Total */}
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                              Total
                            </p>

                            <p className="mt-1 text-lg font-bold text-brand-navy">
                              {formatPrice(order.total)}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {itemQuantity}{" "}
                              {itemQuantity === 1
                                ? "item"
                                : "items"}
                            </p>
                          </div>

                          {/* Action */}
                          <div className="col-span-2 lg:col-span-1 lg:text-right">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="inline-block rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                            >
                              View Order
                            </Link>
                          </div>
                        </div>

                        {/* Bottom Information */}
                        <div className="flex flex-wrap items-center gap-3 border-t border-brand-navy/10 bg-slate-50/70 px-4 py-3 sm:px-5">
                          <span
                            className={[
                              "rounded-full px-3 py-1.5 text-xs font-semibold",
                              getStatusClasses(
                                order.order_status
                              ),
                            ].join(" ")}
                          >
                            {formatStatus(
                              order.order_status
                            )}
                          </span>

                          <span
                            className={[
                              "rounded-full px-3 py-1.5 text-xs font-semibold",
                              getPaymentStatusClasses(
                                order.payment_status
                              ),
                            ].join(" ")}
                          >
                            Payment:{" "}
                            {formatStatus(
                              order.payment_status
                            )}
                          </span>

                          <span className="text-sm text-gray-500">
                            {formatPaymentMethod(
                              order.payment_method
                            )}
                          </span>

                          <span className="text-sm text-gray-400">
                            •
                          </span>

                          <span className="text-sm text-gray-500">
                            {order.district}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary */}
            {orders.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-black/10 bg-white p-6">
                <div>
                  <p className="font-bold">
                    Order Summary
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {orders.length} total orders •{" "}
                    {deliveredOrders} delivered
                  </p>
                </div>

                <p className="text-xl font-bold">
                  {formatPrice(paidOrderValue)}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}