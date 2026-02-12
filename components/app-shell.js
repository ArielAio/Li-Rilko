"use client";

import MobileCartBar from "@/components/mobile-cart-bar";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import WhatsAppFloatWidget from "@/components/whatsapp-float-widget";

export default function AppShell({ children }) {
  return (
    <>
      <SiteHeader />
      <main className="app-shell">{children}</main>
      <SiteFooter />
      <MobileCartBar />
      <WhatsAppFloatWidget />
    </>
  );
}
