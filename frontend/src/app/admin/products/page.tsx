"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ProductVariant = {
  id: number;
  label: string;
  price: string;
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

function formatPrice(price: string | number) {
  return `UGX ${Number(price).toLocaleString("en-UG")}`;
}

function getProductImage(product: Product) {
  if (!product.images || product.images.length === 0) {
    return null;
  }

  const primaryImage =
    product.images.find((image) => image.is_primary) ??
    product.images[0];

  return `http://127.0.0.1:8000/storage/${primaryImage.image_path}`;
}

export default function AdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      const token = localStorage.getItem(
        "josh-slumber-blis-admin-token"
      );

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/admin/products",
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
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
            data.message || "Failed to load products."
          );
        }

        setProducts(data.data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong while loading products."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [router]);

  return (
    <main className="min-h-screen bg-[#f8f6f2] text-[#1f1f1f]">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
              Josh Slumber Blis
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Products
            </h1>

            <p className="mt-2 text-gray-500">
              Manage products, prices, variants and stock.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-full border border-black px-5 py-2.5 text-sm font-semibold"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/products/create"
              className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white"
            >
              + Add Product
            </Link>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-10 rounded-3xl border border-black/10 bg-white p-8">
            <p className="font-semibold">
              Loading products...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {/* Products */}
        {!loading && !error && (
          <div className="mt-10 overflow-hidden rounded-3xl border border-black/10 bg-white">
            {products.length === 0 ? (
              <div className="p-10 text-center">
                <h2 className="text-2xl font-bold">
                  No products yet
                </h2>

                <p className="mt-2 text-gray-500">
                  Add your first product to start building the catalogue.
                </p>

                <Link
                  href="/admin/products/create"
                  className="mt-6 inline-block rounded-full bg-black px-6 py-3 font-semibold text-white"
                >
                  Add Product
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-black/10">
                {products.map((product) => {
                  const prices = product.variants.map(
                    (variant) => Number(variant.price)
                  );

                  const lowestPrice =
                    prices.length > 0
                      ? Math.min(...prices)
                      : null;

                  const productImage =
                    getProductImage(product);

                  const primaryImage =
                    product.images?.find(
                      (image) => image.is_primary
                    ) ?? product.images?.[0];

                  return (
                    <article
                      key={product.id}
                      className="grid gap-5 p-6 md:grid-cols-[90px_1fr_auto] md:items-center"
                    >
                      {/* Product Image */}
                      <div className="h-20 w-20 overflow-hidden rounded-2xl bg-[#ece8e1]">
                        {productImage ? (
                          <img
                            src={productImage}
                            alt={
                              primaryImage?.alt_text ??
                              product.name
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl">
                            🛏️
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-lg font-bold">
                            {product.name}
                          </h2>

                          <span
                            className={[
                              "rounded-full px-3 py-1 text-xs font-semibold",
                              product.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500",
                            ].join(" ")}
                          >
                            {product.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          {product.category?.name ??
                            "No category"}
                        </p>

                        {product.brand && (
                          <p className="mt-1 text-sm text-gray-500">
                            Brand: {product.brand}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-5 text-sm">
                          <span>
                            <strong>
                              {product.variants.length}
                            </strong>{" "}
                            {product.variants.length === 1
                              ? "variant"
                              : "variants"}
                          </span>

                          <span>
                            From{" "}
                            <strong>
                              {lowestPrice !== null
                                ? formatPrice(lowestPrice)
                                : "No price"}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3 md:justify-end">
                        <Link
                          href={`/products/${product.slug}`}
                          className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold transition hover:bg-black hover:text-white"
                          target="_blank"
                        >
                          View Store
                        </Link>

                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
                        >
                          Edit
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}