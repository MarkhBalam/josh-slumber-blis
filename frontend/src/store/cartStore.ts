import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: number;
  productName: string;
  productSlug: string;
  variantId: number;
  variantLabel: string;
  price: number;
  quantity: number;

  // Optional so older persisted cart items still work.
  imagePath?: string | null;
};

type CartState = {
  items: CartItem[];

  addItem: (item: CartItem) => void;

  removeItem: (variantId: number) => void;

  increaseQuantity: (variantId: number) => void;

  decreaseQuantity: (variantId: number) => void;

  clearCart: () => void;

  totalItems: () => number;

  totalPrice: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find(
            (cartItem) => cartItem.variantId === item.variantId
          );

          if (existingItem) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.variantId === item.variantId
                  ? {
                      ...cartItem,
                      quantity: cartItem.quantity + item.quantity,

                      // If an older cart item has no image yet,
                      // allow the new add-to-cart action to supply one.
                      imagePath:
                        cartItem.imagePath ??
                        item.imagePath ??
                        null,
                    }
                  : cartItem
              ),
            };
          }

          return {
            items: [...state.items, item],
          };
        }),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter(
            (item) => item.variantId !== variantId
          ),
        })),

      increaseQuantity: (variantId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                }
              : item
          ),
        })),

      decreaseQuantity: (variantId) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.variantId === variantId
                ? {
                    ...item,
                    quantity: item.quantity - 1,
                  }
                : item
            )
            .filter((item) => item.quantity > 0),
        })),

      clearCart: () => set({ items: [] }),

      totalItems: () =>
        get().items.reduce(
          (total, item) => total + item.quantity,
          0
        ),

      totalPrice: () =>
        get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        ),
    }),
    {
      name: "josh-slumber-blis-cart",
    }
  )
);