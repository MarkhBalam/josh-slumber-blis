
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Check,
  ArrowRight,
} from "lucide-react";

import { useCartStore } from "@/store/cartStore";

type ProductVariant = {
  id: number;
  label: string;
  size_label: string | null;
  price: string | number;
  stock_status: string;
};

type Props = {
  productId: number;
  productName: string;
  productSlug: string;
  variants: ProductVariant[];
  imagePath?: string | null;
};

export default function JSBProductCardAction({
  productId,
  productName,
  productSlug,
  variants,
  imagePath,
}: Props) {
  const addItem = useCartStore((state) => state.addItem);

  const [added, setAdded] = useState(false);

  const activeVariants = variants ?? [];

  const singleVariant =
    activeVariants.length === 1
      ? activeVariants[0]
      : null;

  const hasStock = activeVariants.some(
    (variant) => variant.stock_status === "in_stock"
  );

  // OUT-OF-STOCK PRODUCTS
  if (!hasStock) {
    return (
      <button
        type="button"
        disabled
        className="flex min-h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 text-sm font-bold text-gray-400"
      >
        <ShoppingCart size={18} strokeWidth={2.2} />
        Out of Stock
      </button>
    );
  }

  // LEGACY PRODUCTS WITH MULTIPLE OPTIONS
  if (!singleVariant) {
    return (
      <Link
        href={`/products/${productSlug}`}
        className="group/button flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-navy px-4 text-sm font-bold text-brand-yellow transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-yellow hover:text-brand-navy hover:shadow-md active:translate-y-0"
      >
        Choose Options

        <ArrowRight
          size={17}
          strokeWidth={2}
          className="transition-transform duration-200 group-hover/button:translate-x-1"
        />
      </Link>
    );
  }

  function handleAddToCart() {
    if (
      !singleVariant ||
      singleVariant.stock_status !== "in_stock"
    ) {
      return;
    }

    addItem({
      productId,
      productName,
      productSlug,
      variantId: singleVariant.id,
      variantLabel:
        singleVariant.size_label || singleVariant.label,
      price: Number(singleVariant.price),
      quantity: 1,
      imagePath: imagePath ?? null,
    });

    setAdded(true);
  }

  // SINGLE-SIZE PRODUCTS
  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className={[
        "group/button flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold",
        "transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
        added
          ? "bg-brand-navy text-brand-yellow"
          : "bg-brand-navy text-brand-yellow hover:bg-brand-yellow hover:text-brand-navy",
      ].join(" ")}
    >
      {added ? (
        <>
          <Check
            size={18}
            strokeWidth={2.5}
          />
          Added to Cart
        </>
      ) : (
        <>
          <ShoppingCart
            size={18}
            strokeWidth={2.2}
            className="transition-transform duration-200 group-hover/button:scale-110"
          />
          Add to Cart
        </>
      )}
    </button>
  );
}
