"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";

export default function CartButton() {
  const items = useCartStore((state) => state.items);

  const count = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <Link
      href="/cart"
      className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white"
    >
      Cart ({count})
    </Link>
  );
}