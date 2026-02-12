"use client";

import { usePathname } from "next/navigation";
import MobileCartBar from "@/components/mobile-cart-bar";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import WhatsAppFloatWidget from "@/components/whatsapp-float-widget";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <>
      <SiteHeader />
      <main className="app-shell">{children}</main>
      <SiteFooter />
      {!isAdminRoute && <MobileCartBar />}
      {!isAdminRoute && <WhatsAppFloatWidget />}
    </>
  );
}
