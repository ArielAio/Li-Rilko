"use client";

import { CatalogProvider } from "@/components/providers/catalog-provider";
import { CartProvider } from "@/components/providers/cart-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

export default function AppProviders({ children }) {
  return (
    <ToastProvider>
      <CatalogProvider>
        <CartProvider>{children}</CartProvider>
      </CatalogProvider>
    </ToastProvider>
  );
}
