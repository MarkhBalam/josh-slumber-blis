"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type AdminUser = {
  id: number;
  name: string;
  email: string;
};

type Product = {
  id: number;
  is_active: boolean;
};

type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  district: string;
  total: string;
  payment_status: string;
  order_status: string;
  created_at: string;
};

function money(value: number | string) {
  return `UGX ${Number(value).toLocaleString("en-UG")}`;
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function readable(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function Status({
  value,
  payment = false,
}: {
  value: string;
  payment?: boolean;
}) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-800",
    confirmed: "bg-blue-50 text-blue-800",
    processing: "bg-indigo-50 text-indigo-800",
    out_for_delivery: "bg-orange-50 text-orange-800",
    delivered: "bg-emerald-50 text-emerald-800",
    paid: "bg-emerald-50 text-emerald-800",
    failed: "bg-red-50 text-red-700",
    cancelled: "bg-red-50 text-red-700",
    refunded: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
        styles[value] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {payment ? `Payment: ${readable(value)}` : readable(value)}
    </span>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-navy/10 bg-white p-3 sm:p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 break-words text-xl font-extrabold tracking-tight text-brand-navy sm:mt-3 sm:text-2xl">
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("pending");

  useEffect(() => {
    async function loadDashboard() {
      const token = localStorage.getItem(
        "josh-slumber-blis-admin-token"
      );

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      const storedUser = localStorage.getItem(
        "josh-slumber-blis-admin-user"
      );

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem(
            "josh-slumber-blis-admin-user"
          );
        }
      }

      try {
        setError("");

        const [productsResponse, ordersResponse] =
          await Promise.all([
            fetch(`${API_URL}/api/admin/products`, {
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
              cache: "no-store",
            }),
            fetch(`${API_URL}/api/admin/orders`, {
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
              cache: "no-store",
            }),
          ]);

        if (
          productsResponse.status === 401 ||
          ordersResponse.status === 401
        ) {
          localStorage.removeItem(
            "josh-slumber-blis-admin-token"
          );
          localStorage.removeItem(
            "josh-slumber-blis-admin-user"
          );
          router.replace("/admin/login");
          return;
        }

        const productsData = await productsResponse.json();
        const ordersData = await ordersResponse.json();

        if (!productsResponse.ok) {
          throw new Error(
            productsData.message || "Unable to load products."
          );
        }

        if (!ordersResponse.ok) {
          throw new Error(
            ordersData.message || "Unable to load orders."
          );
        }

        setProducts(productsData.data ?? []);
        setOrders(ordersData.data ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      ),
    [orders]
  );

  const incomingOrders = sortedOrders.filter(
    (order) => order.order_status === "pending"
  );

  const inProgressOrders = orders.filter((order) =>
    ["confirmed", "processing", "out_for_delivery"].includes(
      order.order_status
    )
  );

  const paidValue = orders
    .filter((order) => order.payment_status === "paid")
    .reduce((sum, order) => sum + Number(order.total), 0);

  const activeProducts = products.filter(
    (product) => product.is_active
  ).length;

  if (loading) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center">
        <p className="font-semibold text-brand-navy">
          Loading business overview...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-7 px-5 py-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-navy">
              Overview
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Orders, payments and store activity
              {user?.name ? ` · ${user.name}` : ""}
            </p>
          </div>

          <Link
            href="/admin/orders"
            className="rounded-xl bg-brand-navy px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            View All Orders
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Metric
            label="Incoming orders"
            value={String(incomingOrders.length)}
            detail="Awaiting confirmation"
          />
          <Metric
            label="Orders in progress"
            value={String(inProgressOrders.length)}
            detail="Confirmed, processing or dispatched"
          />
          <Metric
            label="Paid order value"
            value={money(paidValue)}
            detail="Orders with confirmed paid status"
          />
          <Metric
            label="Active products"
            value={String(activeProducts)}
            detail={`${products.length} products in catalogue`}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-brand-navy/10 bg-white">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-extrabold text-brand-navy">
              Order management
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Track and manage orders through every stage
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-4 py-4 sm:flex-wrap sm:px-6">
            {[
              ["pending", "Pending"],
              ["confirmed", "Confirmed"],
              ["processing", "Processing"],
              ["out_for_delivery", "Out for Delivery"],
              ["delivered", "Delivered"],
              ["cancelled", "Cancelled"],
            ].map(([status, label]) => {
              const count = orders.filter(
                (order) => order.order_status === status
              ).length;

              const active = selectedStatus === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedStatus(status)}
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

          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
            <div>
              <h3 className="font-bold text-brand-navy">
                {readable(selectedStatus)} orders
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {selectedStatus === "pending"
                  ? "New orders awaiting confirmation"
                  : selectedStatus === "delivered"
                    ? "Orders successfully delivered to customers"
                    : selectedStatus === "cancelled"
                      ? "Cancelled orders retained for records"
                      : "Orders currently at this fulfilment stage"}
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="text-sm font-bold text-brand-navy hover:underline"
            >
              View all orders →
            </Link>
          </div>

          {sortedOrders.filter(
            (order) => order.order_status === selectedStatus
          ).length === 0 ? (
            <div className="border-t border-slate-100 px-6 py-12 text-center">
              <p className="font-semibold text-brand-navy">
                No {readable(selectedStatus).toLowerCase()} orders
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Orders in this stage will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 md:hidden">
                {sortedOrders
                  .filter((order) => order.order_status === selectedStatus)
                  .slice(0, 10)
                  .map((order) => (
                    <article key={order.id} className="space-y-3 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="min-w-0 break-all text-sm font-bold text-brand-navy">
                          {order.order_number}
                        </p>
                        <Status value={order.payment_status} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">Customer</p>
                          <p className="mt-1 break-words text-sm font-semibold">
                            {order.customer_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {order.district}
                          </p>
                        </div>

                        <div className="min-w-0 text-right">
                          <p className="text-xs text-slate-500">Amount</p>
                          <p className="mt-1 break-words text-sm font-bold text-brand-navy">
                            {money(order.total)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-slate-500">
                          {dateTime(order.created_at)}
                        </p>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="rounded-lg bg-brand-navy px-4 py-2 text-xs font-bold text-white"
                        >
                          Review order →
                        </Link>
                      </div>
                    </article>
                  ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Order</th>
                    <th className="px-6 py-3 font-semibold">Customer</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Amount</th>
                    <th className="px-6 py-3 font-semibold">Payment</th>
                    <th className="px-6 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {sortedOrders
                    .filter(
                      (order) => order.order_status === selectedStatus
                    )
                    .slice(0, 10)
                    .map((order) => (
                      <tr
                        key={order.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4 font-bold text-brand-navy">
                          {order.order_number}
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold">
                            {order.customer_name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {order.district}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {dateTime(order.created_at)}
                        </td>

                        <td className="px-6 py-4 font-semibold">
                          {money(order.total)}
                        </td>

                        <td className="px-6 py-4">
                          <Status value={order.payment_status} />
                        </td>

                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-bold text-brand-navy underline-offset-4 hover:underline"
                          >
                            Review →
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
                </table>
              </div>
            </>
          )}

          {sortedOrders.filter(
            (order) => order.order_status === selectedStatus
          ).length > 10 && (
            <div className="border-t border-slate-100 px-6 py-4 text-right">
              <Link
                href="/admin/orders"
                className="text-sm font-bold text-brand-navy hover:underline"
              >
                View remaining orders →
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
