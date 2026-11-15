from pathlib import Path

path = Path("src/app/checkout/page.tsx")
source = path.read_text()

if 'from "@/lib/paymentSession"' in source:
    raise SystemExit("Pesapal integration already present; no changes made.")

old_import = 'import { useCheckoutStore } from "@/store/checkoutStore";'
new_import = '''import { useCheckoutStore } from "@/store/checkoutStore";
import {
  getPendingPayment,
  savePendingPayment,
} from "@/lib/paymentSession";'''

assert source.count(old_import) == 1
source = source.replace(old_import, new_import, 1)

old_block = '''    if (selectedPaymentMethod !== "cash_on_delivery") {
      setError(
        "Online payments are being connected. Please select Cash on Delivery to place your order for now."
      );
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/orders",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            customer_name: customerName,
            phone,
            email: email || null,

            delivery_address: deliveryAddress,
            district: district || null,
            delivery_notes: deliveryNotes || null,

            payment_method: selectedPaymentMethod,

            items: items.map((item) => ({
              variant_id: item.variantId,
              quantity: item.quantity,
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const validationErrors = data.errors
          ? Object.values(data.errors)
              .flat()
              .join(" ")
          : null;

        throw new Error(
          validationErrors ||
            data.message ||
            "Failed to create order."
        );
      }

      const orderNumber =
        data.data.order_number;

      clearCart();
      clearCheckout();

      router.push(
        `/order-success?order=${encodeURIComponent(
          orderNumber
        )}`
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while placing your order."
      );
    } finally {
      setIsSubmitting(false);
    }
'''

new_block = '''    setError("");
    setIsSubmitting(true);

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    const checkoutPayload = {
      customer_name: customerName,
      phone,
      email: email || null,
      delivery_address: deliveryAddress,
      district: district || null,
      delivery_notes: deliveryNotes || null,
      payment_method: selectedPaymentMethod,
      items: items.map((item) => ({
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
    };

    // Stable for this checkout, so retries reuse the same order.
    const checkoutFingerprint = JSON.stringify({
      ...checkoutPayload,
      items: [...checkoutPayload.items].sort(
        (a, b) => a.variant_id - b.variant_id
      ),
    });

    try {
      const existingPayment = getPendingPayment();

      // Never create a new order while an earlier online order
      // remains unresolved in this browser session.
      if (
        existingPayment &&
        (selectedPaymentMethod === "cash_on_delivery" ||
          existingPayment.checkoutFingerprint !== checkoutFingerprint)
      ) {
        throw new Error(
          "You have an unfinished online payment. Please complete or resolve that order before placing a different order."
        );
      }

      let orderNumber = existingPayment?.orderNumber;
      let paymentAccessToken = existingPayment?.paymentAccessToken;

      if (!existingPayment) {
        const response = await fetch(`${apiUrl}/api/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(checkoutPayload),
        });

        const data = await response.json();

        if (!response.ok) {
          const validationErrors = data.errors
            ? Object.values(data.errors).flat().join(" ")
            : null;

          throw new Error(
            validationErrors || data.message || "Failed to create order."
          );
        }

        orderNumber = data?.data?.order_number;
        paymentAccessToken = data?.payment_access_token;

        if (!orderNumber || typeof orderNumber !== "string") {
          throw new Error("The server did not return an order number.");
        }

        if (selectedPaymentMethod === "cash_on_delivery") {
          clearCart();
          clearCheckout();
          router.push(
            `/order-success?order=${encodeURIComponent(orderNumber)}`
          );
          return;
        }

        if (
          typeof paymentAccessToken !== "string" ||
          !/^[a-fA-F0-9]{64}$/.test(paymentAccessToken)
        ) {
          throw new Error(
            "Order created, but payment authorization is missing. Contact support with your order number: " +
              orderNumber
          );
        }

        // Save before initialization: a failed or interrupted request
        // must not create another order on the next submission.
        savePendingPayment({
          orderNumber,
          paymentAccessToken,
          checkoutFingerprint,
        });
      }

      if (!orderNumber || !paymentAccessToken) {
        throw new Error("Payment authorization is unavailable.");
      }

      const paymentResponse = await fetch(
        `${apiUrl}/api/payments/initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            order_number: orderNumber,
            payment_access_token: paymentAccessToken,
          }),
        }
      );

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(
          (paymentData?.message || "Could not initialize payment.") +
            ` Your order number is ${orderNumber}.`
        );
      }

      const checkoutUrl = paymentData?.data?.checkout_url;

      if (
        typeof checkoutUrl !== "string" ||
        !checkoutUrl.startsWith("https://")
      ) {
        throw new Error(
          `The payment provider returned an invalid checkout URL. Your order number is ${orderNumber}.`
        );
      }

      window.location.assign(checkoutUrl);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong while placing your order."
      );
    } finally {
      setIsSubmitting(false);
    }
'''

assert source.count(old_block) == 1, "Submission handler did not match."
source = source.replace(old_block, new_block, 1)

old_notice = '''Cash on Delivery is available now. MTN Mobile Money,
                  Airtel Money and Visa / Mastercard will become available
                  once secure online payments are connected.'''
new_notice = '''Cash on Delivery is available. For MTN Mobile Money,
                  Airtel Money and Visa / Mastercard, you will be redirected
                  to Pesapal's secure payment page. Online payments are
                  currently running in sandbox test mode.'''

assert source.count(old_notice) == 1
source = source.replace(old_notice, new_notice, 1)

old_disabled = 'disabled={isSubmitting || selectedPaymentMethod !== "cash_on_delivery"}'
assert source.count(old_disabled) == 1
source = source.replace(old_disabled, 'disabled={isSubmitting}', 1)

old_button = '''selectedPaymentMethod === "cash_on_delivery"
                    ? "Place Order"
                    : "Online Payment Coming Soon"'''
new_button = '''selectedPaymentMethod === "cash_on_delivery"
                    ? "Place Order"
                    : "Continue to Secure Payment"'''
assert source.count(old_button) == 1
source = source.replace(old_button, new_button, 1)

path.write_text(source)
print("Checkout integration applied successfully.")
