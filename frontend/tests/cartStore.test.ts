import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("zustand/middleware", () => ({
  persist: (initializer: unknown) => initializer,
}));

import { useCartStore } from "../src/store/cartStore";

const mattress = {
  productId: 1,
  productName: "Orthopedic Mattress",
  productSlug: "orthopedic-mattress",
  variantId: 101,
  variantLabel: "6x6",
  price: 850000,
  quantity: 2,
};

const pillow = {
  productId: 2,
  productName: "Memory Foam Pillow",
  productSlug: "memory-foam-pillow",
  variantId: 202,
  variantLabel: "Standard",
  price: 45000,
  quantity: 1,
};

describe("Josh Slumber Bliss cart cleanup", () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      cleanedOrderNumbers: [],
    });
  });

  it("removes purchased quantities and preserves other products", () => {
    useCartStore.getState().addItem(mattress);
    useCartStore.getState().addItem(pillow);

    useCartStore.getState().removePurchasedItems(
      "TEST-ORDER-001",
      [{ variantId: 101, quantity: 1 }]
    );

    expect(useCartStore.getState().items).toEqual([
      { ...mattress, quantity: 1 },
      pillow,
    ]);
  });

  it("does not subtract quantities twice for the same order", () => {
    useCartStore.getState().addItem(mattress);

    const cleanup = () =>
      useCartStore.getState().removePurchasedItems(
        "TEST-ORDER-002",
        [{ variantId: 101, quantity: 1 }]
      );

    cleanup();
    cleanup();

    expect(useCartStore.getState().items[0].quantity).toBe(1);
    expect(
      useCartStore.getState().cleanedOrderNumbers
    ).toEqual(["TEST-ORDER-002"]);
  });

  it("preserves products added after the original checkout", () => {
    useCartStore.getState().addItem(mattress);
    useCartStore.getState().addItem(pillow);

    useCartStore.getState().removePurchasedItems(
      "TEST-ORDER-003",
      [{ variantId: 101, quantity: 2 }]
    );

    expect(useCartStore.getState().items).toEqual([pillow]);
  });

  it("does not modify the cart unless cleanup is requested", () => {
    useCartStore.getState().addItem(mattress);

    expect(useCartStore.getState().items).toEqual([mattress]);
    expect(useCartStore.getState().cleanedOrderNumbers).toEqual([]);
  });
});
