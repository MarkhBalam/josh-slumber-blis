import Link from "next/link";
import { getProducts } from "@/lib/api";
import JSBProductCardAction from "@/components/JSBProductCardAction";

type ProductVariant = {
  id: number;
  label: string;
  size_label: string | null;
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
  description: string | null;

  category: {
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
  } | null;

  variants: ProductVariant[];
  images: ProductImage[];
};

type Category = {
  id: number;
  slug: string;
  children?: Category[];
};

function collectCategoryIds(category: Category): number[] {
  return [
    category.id,
    ...(category.children ?? []).flatMap(collectCategoryIds),
  ];
}

async function getMattressCategoryIds(): Promise<Set<number>> {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/api/categories",
      { cache: "no-store" }
    );

    if (!response.ok) return new Set();

    const data = await response.json();
    const categories: Category[] = data.data ?? [];
    const mattresses = categories.find(
      (category) => category.slug === "mattresses"
    );

    return new Set(
      mattresses ? collectCategoryIds(mattresses) : []
    );
  } catch {
    return new Set();
  }
}

function formatPrice(price: number) {
  return `UGX ${price.toLocaleString("en-UG")}`;
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

  const [productsResponse, mattressCategoryIds] =
    await Promise.all([
      getProducts(category),
      getMattressCategoryIds(),
    ]);

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
          product.description ?? "",
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
            {filteredProducts.map((product) => {
              const variants = product.variants ?? [];

              const isSingleSize = variants.length === 1;

              const singleVariant = isSingleSize
                ? variants[0]
                : null;

              const availablePrices = variants
                .filter(
                  (variant) =>
                    variant.stock_status === "in_stock"
                )
                .map((variant) => Number(variant.price))
                .filter(Number.isFinite);

              const lowestPrice =
                availablePrices.length > 0
                  ? Math.min(...availablePrices)
                  : null;

              const hasStock = variants.some(
                (variant) =>
                  variant.stock_status === "in_stock"
              );

              const primaryImage =
                product.images?.find(
                  (image) => image.is_primary
                ) ??
                [...(product.images ?? [])].sort(
                  (a, b) => a.sort_order - b.sort_order
                )[0];

              const imagePath =
                primaryImage?.image_path ?? null;

              const imageUrl = imagePath
                ? `http://127.0.0.1:8000/storage/${imagePath}`
                : null;

              const isMattress =
                product.category !== null &&
                mattressCategoryIds.has(product.category.id);

              const sizeLabel = singleVariant
                ? singleVariant.size_label ||
                  singleVariant.label
                : null;

              const description = product.description?.trim();

              return (
                <article
                  key={product.id}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border-soft bg-surface transition duration-300 sm:rounded-[1.5rem] lg:hover:-translate-y-1 lg:hover:shadow-xl"
                >
                  <Link
                    href={`/products/${product.slug}`}
                    className="relative block aspect-square overflow-hidden bg-surface-soft sm:aspect-[4/3]"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
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
                      <span className="absolute right-2 top-2 rounded-full bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-danger shadow-sm sm:right-3 sm:top-3 sm:px-3 sm:py-1.5 sm:text-[10px]">
                        Out of Stock
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col p-3 sm:p-5 lg:p-6">
                    <Link
                      href={`/products/${product.slug}`}
                      className="block"
                    >
                      <h2 className="line-clamp-2 text-sm font-bold leading-snug text-brand-navy sm:text-lg lg:text-xl">
                        {product.name}
                      </h2>
                    </Link>

                    {/* MATTRESS SIZE OR ADMIN PRODUCT DESCRIPTION */}
                    {isMattress && isSingleSize && sizeLabel &&
                      sizeLabel.toLowerCase() !== "standard" ? (
                      <p className="mt-2 text-xs font-medium text-text-muted sm:text-sm">
                        Size: {sizeLabel}
                      </p>
                    ) : !isMattress && description ? (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-text-muted sm:text-sm">
                        {description}
                      </p>
                    ) : null}

                    <div className="mt-auto pt-4">
                      {singleVariant ? (
                        <p className="text-base font-extrabold text-brand-navy sm:text-xl">
                          {formatPrice(Number(singleVariant.price))}
                        </p>
                      ) : lowestPrice !== null ? (
                        <div>
                          <p className="text-xs text-text-muted">
                            Starting from
                          </p>
                          <p className="text-base font-extrabold text-brand-navy sm:text-xl">
                            {formatPrice(lowestPrice)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-text-muted">
                          Price unavailable
                        </p>
                      )}

                      <div className="mt-4">
                        <JSBProductCardAction
                          productId={product.id}
                          productName={product.name}
                          productSlug={product.slug}
                          variants={variants}
                          imagePath={imagePath}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
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