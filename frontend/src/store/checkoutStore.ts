import { create } from "zustand";
import { persist } from "zustand/middleware";

type CheckoutState = {
  customerName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  district: string;
  deliveryNotes: string;
  paymentMethod: string;

  setCustomerName: (value: string) => void;
  setPhone: (value: string) => void;
  setEmail: (value: string) => void;
  setDeliveryAddress: (value: string) => void;
  setDistrict: (value: string) => void;
  setDeliveryNotes: (value: string) => void;
  setPaymentMethod: (value: string) => void;

  clearCheckout: () => void;
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      customerName: "",
      phone: "",
      email: "",
      deliveryAddress: "",
      district: "",
      deliveryNotes: "",
      paymentMethod: "cash_on_delivery",

      setCustomerName: (value) =>
        set({ customerName: value }),

      setPhone: (value) =>
        set({ phone: value }),

      setEmail: (value) =>
        set({ email: value }),

      setDeliveryAddress: (value) =>
        set({ deliveryAddress: value }),

      setDistrict: (value) =>
        set({ district: value }),

      setDeliveryNotes: (value) =>
        set({ deliveryNotes: value }),

      setPaymentMethod: (value) =>
        set({ paymentMethod: value }),

      clearCheckout: () =>
        set({
          customerName: "",
          phone: "",
          email: "",
          deliveryAddress: "",
          district: "",
          deliveryNotes: "",
          paymentMethod: "cash_on_delivery",
        }),
    }),
    {
      name: "josh-slumber-blis-checkout",
    }
  )
);