import { Manrope, Sora } from "next/font/google";
import AppShell from "@/components/app-shell";
import AppProviders from "@/components/providers/app-providers";
import "./globals.css";

const displayFont = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Li Rilko Imports | Catálogo com WhatsApp",
  description:
    "Loja Li Rilko: catálogo por categorias, carrinho multi-itens e finalização rápida via WhatsApp.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
