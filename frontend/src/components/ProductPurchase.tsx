
"use client";

import { useState } from "react";
import {
  Check,
  MessageCircle,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";

import { useCartStore } from "@/store/cartStore";

type ProductVariant = {
  id: number;
  label: string;
  size_label: string | null;
  thickness_inches?: string | null;
  price: string | number;
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
  const variants = product.variants ?? [];
  const isSingleSize = variants.length === 1;

  const availableVariants = variants.filter(
    (variant) => variant.stock_status === "in_stock"
  );

  const [selectedVariantId, setSelectedVariantId] = useState<
    number | null
  >(availableVariants[0]?.id ?? null);

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  const selectedVariant = variants.find(
    (variant) =>
      variant.id === selectedVariantId &&
      variant.stock_status === "in_stock"
  );

  const total = selectedVariant
    ? Number(selectedVariant.price) * quantity
    : 0;

  function handleAddToCart() {
    if (!selectedVariant) return;

    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantId: selectedVariant.id,
      variantLabel:
        selectedVariant.size_label || selectedVariant.label,
      price: Number(selectedVariant.price),
      quantity,
      imagePath: product.imagePath ?? null,
    });

    setAdded(true);
  }

  return (
    <div className="space-y-4">
      {/* OPTIONS FOR LEGACY MULTI-VARIANT PRODUCTS */}
      {!isSingleSize && (
        <div className="rounded-2xl border border-border-soft bg-surface p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-brand-navy">
              Choose an option
            </h2>

            <span className="text-xs text-text-muted">
              {availableVariants.length} available
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {variants.map((variant) => {
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
                    "rounded-xl border p-3 text-left transition",
                    isSelected
                      ? "border-brand-navy bg-brand-navy text-white"
                      : "border-border-soft bg-background text-brand-navy",
                    isOutOfStock
                      ? "cursor-not-allowed opacity-45"
                      : !isSelected
                        ? "hover:border-brand-navy"
                        : "",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold">
                      {variant.label}
                    </span>

                    {isSelected && (
                      <Check
                        size={16}
                        className="shrink-0 text-brand-yellow"
                      />
                    )}
                  </div>

                  {variant.size_label &&
                    variant.size_label !== variant.label && (
                      <p
                        className={[
                          "mt-1 text-xs",
                          isSelected
                            ? "text-white/70"
                            : "text-text-muted",
                        ].join(" ")}
                      >
                        {variant.size_label}
                      </p>
                    )}

                  <p
                    className={[
                      "mt-2 text-sm font-bold",
                      isSelected
                        ? "text-brand-yellow"
                        : "text-brand-navy",
                    ].join(" ")}
                  >
                    {formatPrice(variant.price)}
                  </p>

                  {isOutOfStock && (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      Out of Stock
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* QUANTITY AND TOTAL */}
      {selectedVariant ? (
        <div className="rounded-2xl border border-border-soft bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
                Quantity
              </p>

              <div className="flex h-11 items-center overflow-hidden rounded-full border border-border-soft bg-background">
                <button
                  type="button"
                  onClick={() => {
                    setQuantity((current) =>
                      Math.max(1, current - 1)
                    );
                    setAdded(false);
                  }}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  className="flex h-full w-11 items-center justify-center text-brand-navy transition hover:bg-surface-soft disabled:opacity-40"
                >
                  <Minus size={16} />
                </button>

                <span className="flex h-full w-12 items-center justify-center border-x border-border-soft text-sm font-bold text-brand-navy">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setQuantity((current) => current + 1);
                    setAdded(false);
                  }}
                  aria-label="Increase quantity"
                  className="flex h-full w-11 items-center justify-center text-brand-navy transition hover:bg-surface-soft"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
                Total
              </p>

              <p className="mt-2 text-xl font-bold tracking-tight text-brand-navy sm:text-2xl">
                {formatPrice(total)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border-soft bg-surface p-4 text-center">
          <p className="font-bold text-brand-navy">
            Currently unavailable
          </p>

          <p className="mt-1 text-sm text-text-muted">
            This product has no available options at the moment.
          </p>
        </div>
      )}

      {/* PURCHASE BUTTONS */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedVariant}
          className={[
            "flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200",
            "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
            added
              ? "bg-brand-navy text-brand-yellow"
              : "bg-brand-yellow text-brand-navy hover:brightness-95",
            !selectedVariant
              ? "cursor-not-allowed opacity-40"
              : "",
          ].join(" ")}
        >
          {!selectedVariant ? (
            "Out of Stock"
          ) : added ? (
            <>
              <Check size={18} strokeWidth={2.5} />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingCart size={18} />
              Add to Cart
            </>
          )}
        </button>

        <a
          href="#"
          onClick={(event) => event.preventDefault()}
          aria-disabled="true"
          title="WhatsApp enquiries are not configured yet"
          className="flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-brand-navy/25 px-5 py-3 text-sm font-bold text-brand-navy opacity-60"
        >
          <MessageCircle size={18} />
          Ask on WhatsApp
        </a>
      </div>
    </div>
  );
}
