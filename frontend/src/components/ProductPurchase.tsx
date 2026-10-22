"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cartStore";

type ProductVariant = {
  id: number;
  label: string;
  size_label: string | null;
  thickness_inches: string | null;
  price: string;
  stock_status: string;
};

type ProductPurchaseProps = {
  product: {
    id: number;
    name: string;
    slug: string;
    imagePath?: string | null;
    variants: ProductVariant[];
  };
};

function formatPrice(price: string | number) {
  return `UGX ${Number(price).toLocaleString("en-UG")}`;
}

export default function ProductPurchase({
  product,
}: ProductPurchaseProps) {
  const availableVariants = product.variants.filter(
    (variant) => variant.stock_status === "in_stock"
  );

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    availableVariants[0]?.id ?? null
  );

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  const selectedVariant = product.variants.find(
    (variant) => variant.id === selectedVariantId
  );

  function handleAddToCart() {
    if (!selectedVariant) {
      return;
    }

    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantId: selectedVariant.id,
      variantLabel: selectedVariant.label,
      price: Number(selectedVariant.price),
      quantity,
      imagePath: product.imagePath ?? null,
    });

    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1800);
  }

  return (
    <div>
      {/* ================================================================
          OPTIONS
      ================================================================= */}

      <div className="rounded-[1.5rem] border border-border-soft bg-surface p-4 sm:rounded-3xl sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-navy/60">
              Choose an option
            </p>

            <h2 className="mt-1 text-xl font-bold text-brand-navy">
              Available Options
            </h2>
          </div>

          <p className="text-xs text-text-muted">
            {availableVariants.length}{" "}
            {availableVariants.length === 1
              ? "option available"
              : "options available"}
          </p>
        </div>

        {/* Variant Grid */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {product.variants.map((variant) => {
            const isSelected =
              variant.id === selectedVariantId;

            const isOutOfStock =
              variant.stock_status !== "in_stock";

            return (
              <button
                key={variant.id}
                type="button"
                disabled={isOutOfStock}
                onClick={() => {
                  setSelectedVariantId(variant.id);
                  setQuantity(1);
                  setAdded(false);
                }}
                className={[
                  "relative min-h-[112px] rounded-2xl border p-4 text-left transition",
                  isSelected
                    ? "border-brand-navy bg-brand-navy text-white shadow-sm"
                    : "border-border-soft bg-background text-text-main",
                  isOutOfStock
                    ? "cursor-not-allowed opacity-45"
                    : isSelected
                      ? ""
                      : "hover:border-brand-navy",
                ].join(" ")}
              >
                {/* Selected Indicator */}
                {isSelected && !isOutOfStock && (
                  <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-yellow text-xs font-black text-brand-navy">
                    ✓
                  </span>
                )}

                <div className="pr-7">
                  <p
                    className={[
                      "font-bold leading-snug",
                      isSelected
                        ? "text-white"
                        : "text-brand-navy",
                    ].join(" ")}
                  >
                    {variant.label}
                  </p>

                  {variant.size_label &&
                    variant.size_label !== variant.label && (
                      <p
                        className={[
                          "mt-1 text-xs",
                          isSelected
                            ? "text-white/65"
                            : "text-text-muted",
                        ].join(" ")}
                      >
                        {variant.size_label}
                      </p>
                    )}

                  {variant.thickness_inches && (
                    <p
                      className={[
                        "mt-1 text-xs",
                        isSelected
                          ? "text-white/65"
                          : "text-text-muted",
                      ].join(" ")}
                    >
                      {Number(variant.thickness_inches)} inch thickness
                    </p>
                  )}

                  <p
                    className={[
                      "mt-3 text-base font-bold",
                      isSelected
                        ? "text-brand-yellow"
                        : "text-brand-navy",
                    ].join(" ")}
                  >
                    {formatPrice(variant.price)}
                  </p>

                  <p className="mt-2 text-xs">
                    {isOutOfStock ? (
                      <span
                        className={
                          isSelected
                            ? "font-bold text-red-200"
                            : "font-bold text-danger"
                        }
                      >
                        Out of Stock
                      </span>
                    ) : (
                      <span
                        className={
                          isSelected
                            ? "font-bold text-white/70"
                            : "font-bold text-success"
                        }
                      >
                        In Stock
                      </span>
                    )}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================
          SELECTED OPTION + QUANTITY
      ================================================================= */}

      {selectedVariant ? (
        <div className="mt-4 rounded-[1.5rem] border border-border-soft bg-surface p-4 sm:rounded-3xl sm:p-6">
          <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
            {/* Selected Option */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
                Selected option
              </p>

              <p className="mt-1 font-bold text-brand-navy">
                {selectedVariant.label}
              </p>

              <p className="mt-1 text-xl font-bold text-brand-navy">
                {formatPrice(selectedVariant.price)}
              </p>
            </div>

            {/* Quantity */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-text-muted sm:text-center">
                Quantity
              </p>

              <div className="grid h-12 grid-cols-[48px_56px_48px] items-center overflow-hidden rounded-full border border-border-soft bg-background">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) =>
                      Math.max(1, current - 1)
                    )
                  }
                  aria-label="Decrease quantity"
                  className="flex h-full items-center justify-center text-xl font-bold text-brand-navy transition hover:bg-surface-soft"
                >
                  −
                </button>

                <span className="flex h-full items-center justify-center border-x border-border-soft font-bold text-brand-navy">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) => current + 1)
                  }
                  aria-label="Increase quantity"
                  className="flex h-full items-center justify-center text-xl font-bold text-brand-navy transition hover:bg-surface-soft"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="mt-5 flex items-center justify-between border-t border-border-soft pt-4">
            <span className="text-sm font-semibold text-text-muted">
              Total
            </span>

            <span className="text-xl font-bold text-brand-navy">
              {formatPrice(
                Number(selectedVariant.price) * quantity
              )}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-[1.5rem] border border-border-soft bg-surface p-5 text-center">
          <p className="font-bold text-brand-navy">
            No option currently available
          </p>

          <p className="mt-1 text-sm text-text-muted">
            All variants of this product are currently out of stock.
          </p>
        </div>
      )}

      {/* ================================================================
          ACTIONS
      ================================================================= */}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedVariant}
          className={[
            "flex min-h-13 items-center justify-center rounded-full px-7 py-4 text-center font-bold transition",
            added
              ? "bg-success text-white"
              : "bg-brand-yellow text-brand-navy hover:brightness-95",
            !selectedVariant
              ? "cursor-not-allowed opacity-40"
              : "",
          ].join(" ")}
        >
          {added
            ? "Added to Cart ✓"
            : "Add to Cart"}
        </button>

        <a
          href="#"
          className="flex min-h-13 items-center justify-center rounded-full border-2 border-brand-navy px-7 py-4 text-center font-bold text-brand-navy transition hover:bg-brand-navy hover:text-white"
        >
          Ask on WhatsApp
        </a>
      </div>

      {/* Cart reassurance */}
      {selectedVariant && (
        <p className="mt-3 text-center text-xs leading-5 text-text-muted">
          You can review quantities and remove items before checkout.
        </p>
      )}
    </div>
  );
}