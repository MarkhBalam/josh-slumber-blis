import Link from "next/link";

import HeroCarousel, {
  type HeroSlide,
} from "@/components/HeroCarousel";

import { getProducts } from "@/lib/api";

const API_URL = "http://127.0.0.1:8000";

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
  short_description: string | null;
  is_featured: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
};

function formatPrice(price: string | number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(Number(price));
}

function getProductImage(product: Product) {
  if (!product.images || product.images.length === 0) {
    return null;
  }

  const primaryImage =
    product.images.find(
      (image) => image.is_primary
    ) ?? product.images[0];

  return `${API_URL}/storage/${primaryImage.image_path}`;
}

async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const response = await fetch(
      `${API_URL}/api/hero-slides`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    return data.data ?? [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [productResponse, heroSlides] =
    await Promise.all([
      getProducts(),
      getHeroSlides(),
    ]);

  const products: Product[] =
    productResponse.data ?? [];

  const featuredProducts = products.filter(
    (product) => product.is_featured
  );

  const homepageProducts =
    featuredProducts.length > 0
      ? featuredProducts.slice(0, 6)
      : products.slice(0, 6);

  return (
    <main className="min-h-screen bg-background text-text-main">
      {/* ================================================================
          COMPACT HOMEPAGE HERO
      ================================================================= */}

      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-5 sm:pt-4 lg:px-6 lg:pt-5">
          <div className="overflow-hidden rounded-[1.25rem] sm:rounded-[1.75rem]">
            <HeroCarousel slides={heroSlides} />
          </div>
        </div>
      </section>

      {/* ================================================================
          FEATURED PRODUCTS
      ================================================================= */}

      <section
        id="products"
        className="mx-auto max-w-7xl px-4 pb-14 pt-7 sm:px-6 sm:pb-16 sm:pt-9 lg:px-8 lg:pb-20 lg:pt-10"
      >
        {/* Section Heading */}

        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-navy/55 sm:text-xs">
              Our Collection
            </p>

            <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl lg:text-4xl">
              Featured Products
            </h2>

            <div className="mt-2.5 h-1 w-12 rounded-full bg-brand-yellow sm:w-14" />
          </div>

          <Link
            href="/shop"
            className="hidden shrink-0 text-sm font-bold text-brand-navy underline decoration-brand-yellow decoration-2 underline-offset-4 sm:block"
          >
            Shop all products →
          </Link>
        </div>

        {/* Products */}

        {homepageProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:gap-6">
            {homepageProducts.map((product) => {
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

              const hasStock =
                product.variants.some(
                  (variant) =>
                    variant.stock_status ===
                    "in_stock"
                );

              const productImage =
                getProductImage(product);

              const primaryImage =
                product.images?.find(
                  (image) => image.is_primary
                ) ?? product.images?.[0];

              return (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-2xl border border-border-soft bg-surface transition duration-300 sm:rounded-[1.5rem] lg:hover:-translate-y-1 lg:hover:shadow-xl"
                >
                  {/* Product Image */}

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

                    {product.is_featured && (
                      <span className="absolute left-2 top-2 rounded-full bg-brand-yellow px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-brand-navy shadow-sm sm:left-3 sm:top-3 sm:px-3 sm:py-1.5 sm:text-[10px]">
                        Featured
                      </span>
                    )}

                    {!hasStock && (
                      <span className="absolute right-2 top-2 rounded-full bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-danger shadow-sm sm:right-3 sm:top-3 sm:px-3 sm:py-1.5 sm:text-[10px]">
                        Out of Stock
                      </span>
                    )}
                  </Link>

                  {/* Product Details */}

                  <div className="p-3 sm:p-5 lg:p-6">
                    {product.brand && (
                      <p className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted sm:block sm:text-xs">
                        {product.brand}
                      </p>
                    )}

                    <Link
                      href={`/products/${product.slug}`}
                    >
                      <h3 className="line-clamp-2 text-sm font-bold leading-snug text-brand-navy sm:mt-2 sm:text-lg lg:text-xl">
                        {product.name}
                      </h3>
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
                        <p className="text-sm font-bold text-brand-navy sm:text-lg lg:text-xl">
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
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-border-soft bg-surface px-5 py-14 text-center sm:px-6 sm:py-16">
            <div className="text-5xl">
              🛏️
            </div>

            <h3 className="mt-5 text-2xl font-bold text-brand-navy">
              Products coming soon
            </h3>

            <p className="mt-2 text-text-muted">
              Products added through the admin
              dashboard will appear here.
            </p>
          </div>
        )}

        <div className="mt-7 sm:hidden">
          <Link
            href="/shop"
            className="flex min-h-11 w-full items-center justify-center rounded-full border-2 border-brand-navy px-6 text-sm font-bold text-brand-navy"
          >
            View All Products
          </Link>
        </div>
      </section>

      {/* ================================================================
          SHOP REASSURANCE
      ================================================================= */}

      <section className="border-y border-border-soft bg-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-border-soft px-2 sm:px-6 lg:px-8">
          <div className="px-2 py-5 text-center sm:px-5 sm:py-6">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-brand-yellow text-sm font-black text-brand-navy">
              ✓
            </div>

            <p className="mt-2 text-xs font-bold text-brand-navy sm:text-sm">
              Quality Products
            </p>
          </div>

          <div className="px-2 py-5 text-center sm:px-5 sm:py-6">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-brand-yellow text-sm font-black text-brand-navy">
              ↔
            </div>

            <p className="mt-2 text-xs font-bold text-brand-navy sm:text-sm">
              Multiple Sizes
            </p>
          </div>

          <div className="px-2 py-5 text-center sm:px-5 sm:py-6">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-brand-yellow text-sm font-black text-brand-navy">
              ✓
            </div>

            <p className="mt-2 text-xs font-bold text-brand-navy sm:text-sm">
              Delivery Available
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================
          CTA
      ================================================================= */}

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-brand-navy px-5 py-10 text-center text-white sm:rounded-[2rem] sm:px-10 sm:py-14 md:px-16">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand-yellow sm:h-40 sm:w-40" />

          <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full border-[20px] border-brand-yellow/10 sm:h-44 sm:w-44" />

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-yellow">
              Comfort starts here
            </p>

            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Find your perfect comfort.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
              From mattresses to complete bedding
              essentials, find the comfort your bedroom
              deserves.
            </p>

            <div className="mx-auto mt-7 grid max-w-md gap-3 sm:flex sm:max-w-none sm:justify-center">
              <Link
                href="/shop"
                className="flex min-h-12 items-center justify-center rounded-full bg-brand-yellow px-7 font-bold text-brand-navy transition hover:brightness-95"
              >
                Explore Products
              </Link>

              <Link
                href="/my-orders"
                className="flex min-h-12 items-center justify-center rounded-full border border-white/30 px-7 font-bold text-white transition hover:bg-white/10"
              >
                Track an Order
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}