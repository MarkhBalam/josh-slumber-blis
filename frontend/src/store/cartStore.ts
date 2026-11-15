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
  imagePath?: string | null;
};

type PurchasedItem = {
  variantId: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];

  // Records orders whose cart cleanup has already been applied.
  cleanedOrderNumbers: string[];

  addItem: (item: CartItem) => void;
  removeItem: (variantId: number) => void;
  increaseQuantity: (variantId: number) => void;
  decreaseQuantity: (variantId: number) => void;
  clearCart: () => void;

  removePurchasedItems: (
    orderNumber: string,
    purchasedItems: PurchasedItem[]
  ) => void;

  totalItems: () => number;
  totalPrice: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      cleanedOrderNumbers: [],

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

      removePurchasedItems: (orderNumber, purchasedItems) =>
        set((state) => {
          if (
            !orderNumber.trim() ||
            (state.cleanedOrderNumbers ?? []).includes(orderNumber)
          ) {
            return state;
          }

          const purchased = new Map<number, number>();

          for (const item of purchasedItems) {
            if (
              !Number.isSafeInteger(item.variantId) ||
              item.variantId <= 0 ||
              !Number.isSafeInteger(item.quantity) ||
              item.quantity <= 0
            ) {
              return state;
            }

            purchased.set(
              item.variantId,
              (purchased.get(item.variantId) ?? 0) + item.quantity
            );
          }

          if (purchased.size === 0) {
            return state;
          }

          return {
            items: state.items
              .map((item) => ({
                ...item,
                quantity:
                  item.quantity -
                  (purchased.get(item.variantId) ?? 0),
              }))
              .filter((item) => item.quantity > 0),

            // Stored alongside the cart update in one Zustand state.
            cleanedOrderNumbers: [
              ...(state.cleanedOrderNumbers ?? []),
              orderNumber,
            ],
          };
        }),

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
