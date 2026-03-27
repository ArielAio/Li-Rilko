import { Manrope, Sora } from "next/font/google";
import AppShell from "@/components/app-shell";
import AppProviders from "@/components/providers/app-providers";
import { getPublicCatalogSnapshot } from "@/lib/catalog-repository";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isAdminSessionValid } from "@/lib/admin-auth";
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
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? "";
  const isAdmin = isAdminSessionValid(sessionToken);

  return (
    <html lang="pt-BR">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <AppProviders initialCatalog={initialCatalog} isAdmin={isAdmin}>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
