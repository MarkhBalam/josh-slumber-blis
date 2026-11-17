"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Package,
  CheckCircle2,
  CirclePause,
  Layers3,
  ExternalLink,
  Pencil,
  SlidersHorizontal,
} from "lucide-react";

type ProductVariant = {
  id: number;
  label: string;
  price: string | number;
  stock_status: string;
};

type ProductImage = {
  id: number;
  image_path: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
};

type Product = {
  id: number;
  name: string;
  slug: string;
  brand: string | null;
  is_active: boolean;
  category: {
    id: number;
    name: string;
  } | null;
  variants: ProductVariant[];
  images: ProductImage[];
};

type StatusFilter = "all" | "active" | "inactive";

const API_URL = "http://127.0.0.1:8000";

function formatPrice(value: string | number) {
  return `UGX ${Number(value).toLocaleString("en-UG")}`;
}

function getProductImage(product: Product) {
  if (!product.images?.length) return null;

  const primary =
    product.images.find((image) => image.is_primary) ??
    product.images[0];

  return {
    url: `${API_URL}/storage/${primary.image_path}`,
    alt: primary.alt_text || product.name,
  };
}

function getLowestPrice(product: Product) {
  const prices = product.variants
    .map((variant) => Number(variant.price))
    .filter((price) => Number.isFinite(price));

  return prices.length ? Math.min(...prices) : null;
}

export default function AdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      const token = localStorage.getItem(
        "josh-slumber-blis-admin-token"
      );

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/admin/products`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (response.status === 401) {
          localStorage.removeItem("josh-slumber-blis-admin-token");
          localStorage.removeItem("josh-slumber-blis-admin-user");
          router.replace("/admin/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load products.");
        }

        if (!cancelled) {
          setProducts(Array.isArray(data.data) ? data.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while loading products."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const categories = useMemo(() => {
    return [...new Set(
      products
        .map((product) => product.category?.name)
        .filter((name): name is string => Boolean(name))
    )].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((product) => product.is_active).length,
    inactive: products.filter((product) => !product.is_active).length,
    variants: products.reduce(
      (sum, product) => sum + product.variants.length,
      0
    ),
  }), [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.brand || "").toLowerCase().includes(query) ||
        (product.category?.name || "").toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query);

      const matchesCategory =
        category === "all" || product.category?.name === category;

      const matchesStatus =
        status === "all" ||
        (status === "active" && product.is_active) ||
        (status === "inactive" && !product.is_active);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, category, status]);

  return (
    <main className="min-h-screen bg-background text-brand-navy">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Products
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your catalogue, pricing, variants and availability.
            </p>
          </div>

          <Link
            href="/admin/products/create"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus size={17} />
            Add Product
          </Link>
        </div>

        {loading && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
            Loading products...
          </div>
        )}

        {!loading && error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                {
                  label: "Total products",
                  value: stats.total,
                  icon: Package,
                  hint: "In your catalogue",
                },
                {
                  label: "Active products",
                  value: stats.active,
                  icon: CheckCircle2,
                  hint: "Visible in the store",
                },
                {
                  label: "Inactive products",
                  value: stats.inactive,
                  icon: CirclePause,
                  hint: "Not currently active",
                },
                {
                  label: "Product variants",
                  value: stats.variants,
                  icon: Layers3,
                  hint: "Sizes and options",
                },
              ].map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-slate-500 sm:text-sm">
                        {stat.label}
                      </p>
                      <Icon size={17} className="shrink-0 text-brand-navy/60" />
                    </div>

                    <p className="mt-2 text-2xl font-bold text-brand-navy">
                      {stat.value}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                      {stat.hint}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search products or brands..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-brand-navy"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:flex">
                  <div className="relative min-w-0">
                    <SlidersHorizontal
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      aria-label="Filter by category"
                      className="w-full min-w-0 appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-6 text-sm text-brand-navy outline-none focus:border-brand-navy sm:w-52"
                    >
                      <option value="all">All categories</option>
                      {categories.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as StatusFilter)
                    }
                    aria-label="Filter by status"
                    className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-brand-navy outline-none focus:border-brand-navy sm:w-40"
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-brand-navy">
                    {filteredProducts.length}
                  </span>{" "}
                  of {products.length} products
                </p>

                {(search || category !== "all" || status !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setCategory("all");
                      setStatus("all");
                    }}
                    className="text-xs font-semibold text-brand-navy underline underline-offset-2"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {filteredProducts.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Package
                    size={32}
                    className="mx-auto text-slate-300"
                  />
                  <h2 className="mt-3 text-lg font-bold">
                    {products.length === 0
                      ? "No products yet"
                      : "No matching products"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {products.length === 0
                      ? "Add your first product to start building the catalogue."
                      : "Try a different search or filter."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredProducts.map((product) => {
                    const image = getProductImage(product);
                    const lowestPrice = getLowestPrice(product);

                    return (
                      <article
                        key={product.id}
                        className="p-3.5 sm:p-5"
                      >
                        <div className="flex min-w-0 gap-3 sm:gap-4">
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-24">
                            {image ? (
                              <img
                                src={image.url}
                                alt={image.alt}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-3xl">
                                🛏️
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 lg:flex lg:items-center lg:justify-between lg:gap-6">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="min-w-0 break-words text-sm font-bold text-brand-navy sm:text-base">
                                {product.name}
                              </h2>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                  product.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {product.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                              {product.category?.name || "Uncategorized"}
                              {product.brand ? ` · ${product.brand}` : ""}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                              <p className="text-sm font-bold text-brand-navy">
                                {lowestPrice === null
                                  ? "No price"
                                  : formatPrice(lowestPrice)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {product.variants.length}{" "}
                                {product.variants.length === 1
                                  ? "variant"
                                  : "variants"}
                              </p>
                            </div>

                          </div>

                            <div className="mt-3 flex shrink-0 flex-wrap gap-2 lg:mt-0 lg:justify-end">
                              <Link
                                href={`/admin/products/${product.id}/edit`}
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-navy px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                              >
                                <Pencil size={13} />
                                Edit
                              </Link>

                              <Link
                                href={`/products/${product.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-brand-navy transition hover:bg-slate-50"
                              >
                                <ExternalLink size={13} />
                                View Store
                              </Link>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
