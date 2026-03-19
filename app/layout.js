import { Manrope, Sora } from "next/font/google";
import AppShell from "@/components/app-shell";
import AppProviders from "@/components/providers/app-providers";
import { getPublicCatalogSnapshot } from "@/lib/catalog-repository";
import "./globals.css";

const displayFont = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Li Rilko Imports | Catálogo com WhatsApp",
  description:
    "Loja Li Rilko: catálogo por categorias, carrinho multi-itens e finalização rápida via WhatsApp.",
};

export default async function RootLayout({ children }) {
  const initialCatalog = await getPublicCatalogSnapshot();

  return (
    <html lang="pt-BR">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <AppProviders initialCatalog={initialCatalog}>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
