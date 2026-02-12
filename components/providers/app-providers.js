"use client";

import { CatalogProvider } from "@/components/providers/catalog-provider";
import { CartProvider } from "@/components/providers/cart-provider";
import PageTransitionProvider from "@/components/providers/page-transition-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

export default function AppProviders({ children }) {
  return (
    <ToastProvider>
      <CatalogProvider>
        <CartProvider>
          <PageTransitionProvider>{children}</PageTransitionProvider>
        </CartProvider>
      </CatalogProvider>
    </ToastProvider>
  );
}
