import Link from "next/link";
import { getProducts } from "@/lib/api";

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
  short_description: string | null;

  category: {
    id: number;
    name: string;
    slug: string;
  } | null;

  variants: ProductVariant[];
  images: ProductImage[];
};

function formatPrice(price: number) {
  return `UGX ${price.toLocaleString("en-UG")}`;
}

function getProductImage(product: Product) {
  if (!product.images || product.images.length === 0) {
    return null;
  }

  const primaryImage =
    product.images.find(
      (image) => image.is_primary
    ) ?? product.images[0];

  return `http://127.0.0.1:8000/storage/${primaryImage.image_path}`;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    q?: string;
  }>;
}) {
  const { category, q } = await searchParams;

  const searchQuery = q?.trim() ?? "";

  /*
  |--------------------------------------------------------------------------
  | Load Products
  |--------------------------------------------------------------------------
  */

  const productsResponse =
    await getProducts(category);

  const products: Product[] =
    productsResponse.data ?? [];

  /*
  |--------------------------------------------------------------------------
  | Search Filtering
  |--------------------------------------------------------------------------
  */

  const filteredProducts = searchQuery
    ? products.filter((product) => {
        const searchableText = [
          product.name,
          product.brand ?? "",
          product.short_description ?? "",
          product.category?.name ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          searchQuery.toLowerCase()
        );
      })
    : products;

  return (
    <main className="min-h-screen bg-background text-text-main">
      {/* ================================================================
          PRODUCTS
      ================================================================= */}

      <section className="mx-auto max-w-7xl px-4 pb-14 pt-5 sm:px-6 sm:pb-16 sm:pt-7 lg:px-8 lg:pb-20 lg:pt-8">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:gap-6">
            {filteredProducts.map(
              (product) => {
                const availablePrices =
                  product.variants
                    .filter(
                      (variant) =>
                        variant.stock_status ===
                        "in_stock"
                    )
                    .map((variant) =>
                      Number(variant.price)
                    );

                const lowestPrice =
                  availablePrices.length > 0
                    ? Math.min(
                        ...availablePrices
                      )
                    : null;

                const productImage =
                  getProductImage(product);

                const primaryImage =
                  product.images?.find(
                    (image) =>
                      image.is_primary
                  ) ??
                  product.images?.[0];

                const hasStock =
                  product.variants.some(
                    (variant) =>
                      variant.stock_status ===
                      "in_stock"
                  );

                return (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-2xl border border-border-soft bg-surface transition duration-300 sm:rounded-[1.5rem] lg:hover:-translate-y-1 lg:hover:shadow-xl"
                  >
                    {/* PRODUCT IMAGE */}

                    <Link
                      href={`/products/${product.slug}`}
                      className="relative block aspect-square overflow-hidden bg-surface-soft sm:aspect-[4/3]"
                    >
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={
                            primaryImage?.alt_text ??
                            product.name
                          }
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-4xl sm:text-5xl">
                            🛏️
                          </span>
                        </div>
                      )}

                      {!hasStock && (
                        <span className="absolute left-2 top-2 rounded-full bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-danger shadow-sm sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs">
                          Out of Stock
                        </span>
                      )}

                      {hasStock && (
                        <span className="absolute left-2 top-2 rounded-full bg-brand-yellow px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-brand-navy shadow-sm sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs">
                          In Stock
                        </span>
                      )}
                    </Link>

                    {/* PRODUCT INFORMATION */}

                    <div className="p-3 sm:p-5 lg:p-6">
                      <div className="hidden flex-wrap items-center gap-2 sm:flex">
                        {product.brand && (
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted sm:text-xs">
                            {product.brand}
                          </p>
                        )}

                        {product.category && (
                          <>
                            {product.brand && (
                              <span className="text-xs text-border-soft">
                                •
                              </span>
                            )}

                            <p className="text-[10px] font-medium text-text-muted sm:text-xs">
                              {
                                product.category
                                  .name
                              }
                            </p>
                          </>
                        )}
                      </div>

                      <Link
                        href={`/products/${product.slug}`}
                      >
                        <h2 className="line-clamp-2 text-sm font-bold leading-snug text-brand-navy sm:mt-2 sm:text-lg lg:text-xl">
                          {product.name}
                        </h2>
                      </Link>

                      <p className="mt-2 hidden line-clamp-2 min-h-11 text-sm leading-6 text-text-muted md:block">
                        {product.short_description ??
                          "Quality bedroom essential from Josh Slumber Blis."}
                      </p>

                      <div className="mt-3 border-t border-border-soft pt-3 sm:mt-5 sm:pt-4">
                        <p className="hidden text-xs text-text-muted sm:block">
                          {hasStock &&
                          lowestPrice !== null
                            ? "Starting from"
                            : "Availability"}
                        </p>

                        <div className="mt-0.5 flex flex-col gap-3 sm:mt-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="min-w-0 text-sm font-bold text-brand-navy sm:text-lg lg:text-xl">
                            {hasStock &&
                            lowestPrice !== null
                              ? formatPrice(
                                  lowestPrice
                                )
                              : "Out of Stock"}
                          </p>

                          <Link
                            href={`/products/${product.slug}`}
                            className="hidden min-h-10 shrink-0 items-center justify-center rounded-full bg-brand-navy px-4 text-sm font-bold text-white transition hover:opacity-90 sm:flex"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        ) : (
          /* ============================================================
             EMPTY STATE
          ============================================================= */

          <div className="rounded-[1.75rem] border border-border-soft bg-surface px-5 py-14 text-center sm:rounded-[2rem] sm:px-6 sm:py-20">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-yellow text-3xl">
              🔎
            </div>

            <h2 className="mt-5 text-2xl font-bold text-brand-navy">
              No matching products
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-muted sm:text-base">
              {searchQuery
                ? `We couldn't find any products matching “${searchQuery}”.`
                : "Products for this category will appear here once they are added."}
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-brand-navy px-6 font-bold text-white"
            >
              View All Products
            </Link>
          </div>
        )}
      </section>

      {/* ================================================================
          ORDER TRACKING CTA
      ================================================================= */}

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20 lg:px-8">
        <div className="overflow-hidden rounded-[1.75rem] bg-brand-navy px-5 py-8 text-center text-white sm:px-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-yellow">
            Need to check an order?
          </p>

          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            Already bought something?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/65">
            Guest customers can check previous orders
            using the phone number they entered during
            checkout.
          </p>

          <Link
            href="/my-orders"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-brand-yellow px-6 font-bold text-brand-navy"
          >
            Track My Order
          </Link>
        </div>
      </section>
    </main>
  );
}