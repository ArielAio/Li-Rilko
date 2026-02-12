"use client";

import { CartProvider } from "@/components/providers/cart-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

export default function AppProviders({ children }) {
  return (
    <ToastProvider>
      <CartProvider>{children}</CartProvider>
    </ToastProvider>
  );
}
