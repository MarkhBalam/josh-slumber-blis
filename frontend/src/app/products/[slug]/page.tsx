import Link from "next/link";
import { getProductBySlug } from "@/lib/api";
import ProductPurchase from "@/components/ProductPurchase";
import ProductGallery from "@/components/ProductGallery";

type ProductVariant = {
  id: number;
  label: string;
  size_label: string | null;
  thickness_inches: string | null;
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
  material: string | null;
  firmness: string | null;
  short_description: string | null;
  description: string | null;

  category: {
    name: string;
  } | null;

  variants: ProductVariant[];
  images: ProductImage[];
};

function formatPrice(price: string | number) {
  return `UGX ${Number(price).toLocaleString("en-UG")}`;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const response = await getProductBySlug(slug);
  const product: Product = response.data;

  /*
  |--------------------------------------------------------------------------
  | Available Variants
  |--------------------------------------------------------------------------
  */

  const availableVariants = product.variants.filter(
    (variant) => variant.stock_status === "in_stock"
  );

  const availablePrices = availableVariants.map(
    (variant) => Number(variant.price)
  );

  const lowestPrice =
    availablePrices.length > 0
      ? Math.min(...availablePrices)
      : null;

  const hasStock = availableVariants.length > 0;

  /*
  |--------------------------------------------------------------------------
  | Primary Product Image
  |--------------------------------------------------------------------------
  */

  const primaryImage =
    product.images?.find((image) => image.is_primary) ??
    product.images?.[0] ??
    null;

  const primaryImagePath =
    primaryImage?.image_path ?? null;

  return (
    <main className="min-h-screen bg-background text-text-main">
      {/* ================================================================
          BREADCRUMB / BACK
      ================================================================= */}

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <Link
          href="/shop"
          className="inline-flex min-h-10 items-center gap-2 rounded-full text-sm font-bold text-brand-navy transition hover:opacity-65"
        >
          <span
            aria-hidden="true"
            className="text-lg"
          >
            ←
          </span>

          <span>Back to Shop</span>
        </Link>
      </div>

      {/* ================================================================
          PRODUCT
      ================================================================= */}

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-14 pt-5 sm:px-6 sm:pb-20 sm:pt-7 lg:grid-cols-2 lg:items-start lg:gap-14 lg:px-8">
        {/* ==============================================================
            GALLERY
        =============================================================== */}

        <div className="min-w-0 lg:sticky lg:top-8">
          <ProductGallery
            productName={product.name}
            images={product.images ?? []}
          />
        </div>

        {/* ==============================================================
            PRODUCT INFORMATION
        =============================================================== */}

        <div className="min-w-0 lg:py-2">
          {/* Category + Stock */}

          <div className="flex flex-wrap items-center gap-2">
            {product.category && (
              <span className="rounded-full bg-brand-yellow px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-navy sm:text-xs">
                {product.category.name}
              </span>
            )}

            <span
              className={[
                "rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] sm:text-xs",
                hasStock
                  ? "bg-success/10 text-success"
                  : "bg-danger/10 text-danger",
              ].join(" ")}
            >
              {hasStock ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          {/* Product Name */}

          <h1 className="mt-4 text-3xl font-bold leading-[1.1] tracking-tight text-brand-navy sm:text-4xl lg:text-5xl">
            {product.name}
          </h1>

          {/* Brand */}

          {product.brand && (
            <p className="mt-3 text-sm text-text-muted">
              Brand{" "}
              <span className="font-bold text-brand-navy">
                {product.brand}
              </span>
            </p>
          )}

          {/* ============================================================
              PRICE
          ============================================================= */}

          <div className="mt-6 border-y border-border-soft py-5">
            {lowestPrice !== null ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                  Starting from
                </p>

                <p className="mt-1 text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">
                  {formatPrice(lowestPrice)}
                </p>

                {availableVariants.length > 1 && (
                  <p className="mt-1 text-xs text-text-muted">
                    Final price depends on your selected option.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                  Availability
                </p>

                <p className="mt-1 text-xl font-bold text-danger">
                  Currently Out of Stock
                </p>
              </>
            )}
          </div>

          {/* ============================================================
              DESCRIPTION
          ============================================================= */}

          <div className="mt-6">
            <h2 className="text-base font-bold text-brand-navy">
              About this product
            </h2>

            <p className="mt-2 max-w-xl whitespace-pre-line text-sm leading-7 text-text-muted sm:text-base">
              {product.description ??
                product.short_description ??
                "Quality bedroom essential from Josh Slumber Blis."}
            </p>
          </div>

          {/* ============================================================
              PRODUCT DETAILS
          ============================================================= */}

          {(product.material || product.firmness) && (
            <div className="mt-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-navy/60">
                Product Details
              </p>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {product.material && (
                  <div className="rounded-2xl border border-border-soft bg-surface p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-sm font-black text-brand-navy">
                        M
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
                          Material
                        </p>

                        <p className="mt-1 font-bold text-brand-navy">
                          {product.material}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {product.firmness && (
                  <div className="rounded-2xl border border-border-soft bg-surface p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-sm font-black text-brand-navy">
                        F
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
                          Firmness
                        </p>

                        <p className="mt-1 font-bold text-brand-navy">
                          {product.firmness}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================
              PURCHASE
          ============================================================= */}

          <div className="mt-8">
            <ProductPurchase
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                imagePath: primaryImagePath,
                variants: product.variants,
              }}
            />
          </div>

          {/* ============================================================
              BUYING REASSURANCE
          ============================================================= */}

          <div className="mt-6 rounded-3xl bg-brand-navy p-5 text-white sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-yellow">
              Shop with confidence
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow font-black text-brand-navy">
                  ✓
                </div>

                <div>
                  <p className="text-sm font-bold">
                    Quality Selection
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/60">
                    Carefully selected bedroom and sleep essentials.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow font-black text-brand-navy">
                  ✓
                </div>

                <div>
                  <p className="text-sm font-bold">
                    Delivery Available
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/60">
                    Convenient delivery for customers across Uganda.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              CONTINUE SHOPPING
          ============================================================= */}

          <div className="mt-6 text-center sm:text-left">
            <Link
              href="/shop"
              className="text-sm font-bold text-brand-navy underline decoration-brand-yellow decoration-2 underline-offset-4"
            >
              Continue shopping →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}