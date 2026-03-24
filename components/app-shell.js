"use client";

import { usePathname } from "next/navigation";
import MobileCartBar from "@/components/mobile-cart-bar";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import WhatsAppFloatWidget from "@/components/whatsapp-float-widget";
import BottomTabBar from "@/components/bottom-tab-bar";
import AdminProductModal from "@/components/admin/admin-product-modal";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <>
      <SiteHeader />
      <main className={`app-shell ${!isAdminRoute ? "has-bottom-nav" : ""}`}>{children}</main>
      <SiteFooter />
      {!isAdminRoute && <MobileCartBar />}
      {!isAdminRoute && <WhatsAppFloatWidget />}
      {!isAdminRoute && <BottomTabBar />}
      <AdminProductModal />
    </>
  );
}
