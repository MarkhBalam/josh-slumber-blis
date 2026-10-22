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
  total: string;
  order_status: string;
  payment_status: string;
};

function formatPrice(price: number) {
  return `UGX ${price.toLocaleString("en-UG")}`;
}

export default function AdminPage() {
  const router = useRouter();

  const [user, setUser] = useState<AdminUser | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Dashboard
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    async function loadDashboard() {
      const token = localStorage.getItem(
        "josh-slumber-blis-admin-token"
      );

      const storedUser = localStorage.getItem(
        "josh-slumber-blis-admin-user"
      );

      if (!token) {
        router.replace("/admin/login");
        return;
      }

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

        /*
        |--------------------------------------------------------------------------
        | Expired / Invalid Admin Session
        |--------------------------------------------------------------------------
        */

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

        const productsData =
          await productsResponse.json();

        const ordersData =
          await ordersResponse.json();

        if (!productsResponse.ok) {
          throw new Error(
            productsData.message ||
              "Failed to load products."
          );
        }

        if (!ordersResponse.ok) {
          throw new Error(
            ordersData.message ||
              "Failed to load orders."
          );
        }

        setProducts(productsData.data ?? []);
        setOrders(ordersData.data ?? []);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong while loading the dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  /*
  |--------------------------------------------------------------------------
  | Dashboard Calculations
  |--------------------------------------------------------------------------
  */

  const totalProducts = products.length;

  const activeProducts = products.filter(
    (product) => product.is_active
  ).length;

  const totalOrders = orders.length;

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

  /*
  |--------------------------------------------------------------------------
  | Paid Value
  |--------------------------------------------------------------------------
  */

  const paidOrderValue = useMemo(
    () =>
      orders
        .filter(
          (order) => order.payment_status === "paid"
        )
        .reduce(
          (total, order) =>
            total + Number(order.total),
          0
        ),
    [orders]
  );

  /*
  |--------------------------------------------------------------------------
  | Total Order Value
  |--------------------------------------------------------------------------
  */

  const totalOrderValue = useMemo(
    () =>
      orders
        .filter(
          (order) =>
            order.order_status !== "cancelled"
        )
        .reduce(
          (total, order) =>
            total + Number(order.total),
          0
        ),
    [orders]
  );

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  async function handleLogout() {
    const token = localStorage.getItem(
      "josh-slumber-blis-admin-token"
    );

    if (token) {
      try {
        await fetch(
          `${API_URL}/api/admin/logout`,
          {
            method: "POST",

            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch {
        // Local logout still continues if API request fails.
      }
    }

    localStorage.removeItem(
      "josh-slumber-blis-admin-token"
    );

    localStorage.removeItem(
      "josh-slumber-blis-admin-user"
    );

    router.replace("/admin/login");
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6f2] text-[#1f1f1f]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-black/10 border-t-black" />

          <p className="mt-4 font-semibold">
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f6f2] text-[#1f1f1f]">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {/* Top */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
              Josh Slumber Blis
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Admin Dashboard
            </h1>

            <p className="mt-3 text-gray-600">
              Welcome
              {user?.name ? `, ${user.name}` : ""}.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              target="_blank"
              className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold transition hover:border-black"
            >
              View Store
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Main Stats */}
        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            label="Total Products"
            value={String(totalProducts)}
            description={`${activeProducts} active`}
          />

          <DashboardCard
            label="Total Orders"
            value={String(totalOrders)}
            description={`${deliveredOrders} delivered`}
          />

          <DashboardCard
            label="Pending Orders"
            value={String(pendingOrders)}
            description={`${activeOrders} currently being handled`}
          />

          <div className="rounded-3xl bg-black p-6 text-white">
            <p className="text-sm text-white/60">
              Paid Order Value
            </p>

            <p className="mt-3 text-2xl font-bold">
              {formatPrice(paidOrderValue)}
            </p>

            <p className="mt-3 text-xs leading-5 text-white/50">
              Orders marked as paid only
            </p>
          </div>
        </section>

        {/* Business Overview */}
        <section className="mt-8 rounded-3xl border border-black/10 bg-white p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Business Overview
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Store activity
              </h2>
            </div>

            <p className="text-sm text-gray-500">
              Current data from your store
            </p>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl bg-[#f8f6f2] p-5">
              <p className="text-sm text-gray-500">
                Active Products
              </p>

              <p className="mt-2 text-3xl font-bold">
                {activeProducts}
              </p>
            </div>

            <div className="rounded-2xl bg-[#f8f6f2] p-5">
              <p className="text-sm text-gray-500">
                Orders In Progress
              </p>

              <p className="mt-2 text-3xl font-bold">
                {activeOrders}
              </p>
            </div>

            <div className="rounded-2xl bg-[#f8f6f2] p-5">
              <p className="text-sm text-gray-500">
                Total Order Value
              </p>

              <p className="mt-2 text-xl font-bold">
                {formatPrice(totalOrderValue)}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                Excludes cancelled orders
              </p>
            </div>
          </div>
        </section>

        {/* Management */}
        <section className="mt-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
              Management
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Quick Actions
            </h2>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {/* Products */}
            <Link
              href="/admin/products"
              className="group rounded-3xl border border-black/10 bg-white p-7 transition hover:-translate-y-1 hover:border-black hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-xl text-white">
                📦
              </div>

              <h3 className="mt-6 text-xl font-bold">
                Products
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                View products, change prices, edit
                stock and manage product images.
              </p>

              <p className="mt-6 text-sm font-semibold">
                Manage Products →
              </p>
            </Link>

            {/* Add Product */}
            <Link
              href="/admin/products/create"
              className="group rounded-3xl border border-black/10 bg-white p-7 transition hover:-translate-y-1 hover:border-black hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-2xl text-white">
                +
              </div>

              <h3 className="mt-6 text-xl font-bold">
                Add Product
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Add a new catalogue item with
                variants, pricing, stock and photos.
              </p>

              <p className="mt-6 text-sm font-semibold">
                Create Product →
              </p>
            </Link>

            {/* Orders */}
            <Link
              href="/admin/orders"
              className="group rounded-3xl border border-black/10 bg-white p-7 transition hover:-translate-y-1 hover:border-black hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-xl text-white">
                🧾
              </div>

              <div className="mt-6 flex items-center gap-3">
                <h3 className="text-xl font-bold">
                  Orders
                </h3>

                {pendingOrders > 0 && (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">
                    {pendingOrders} pending
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Review customer orders, delivery
                details and update order status.
              </p>

              <p className="mt-6 text-sm font-semibold">
                Manage Orders →
              </p>
            </Link>

            {/* Homepage Highlights */}
            <Link
              href="/admin/hero-slides"
              className="group rounded-3xl border border-black/10 bg-white p-7 transition hover:-translate-y-1 hover:border-[#040D52] hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#040D52] text-xl text-white">
                🖼️
              </div>

              <h3 className="mt-6 text-xl font-bold">
                Homepage Highlights
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Upload and manage promotional images
                that rotate in the homepage hero.
              </p>

              <p className="mt-6 text-sm font-semibold text-[#040D52]">
                Manage Highlights →
              </p>
            </Link>
          </div>
        </section>

        {/* Admin Account */}
        {user && (
          <section className="mt-8 rounded-3xl border border-black/10 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              Signed In As
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-bold">
                  {user.name}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {user.email}
                </p>
              </div>

              <span className="rounded-full bg-green-100 px-4 py-2 text-xs font-semibold text-green-700">
                Admin
              </span>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function DashboardCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-3 text-xs leading-5 text-gray-400">
        {description}
      </p>
    </div>
  );
}