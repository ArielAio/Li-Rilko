import { siteSettings } from "./catalog-data";

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value) {
  return numberFormatter.format(value || 0);
}

export function buildWhatsAppMessage(cartItems) {
  const intro = siteSettings.whatsappIntro;

  if (!cartItems || cartItems.length === 0) {
    return `${intro}\n\n(sem itens selecionados ainda)`;
  }

  const lines = cartItems.map((item) => `• ${item.name} (${item.qty}x) — ${formatCurrency(item.subtotal)}`);
  const total = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  return `${intro}\n\n${lines.join("\n")}\n\nTotal: ${formatCurrency(total)}`;
}

function buildWhatsAppLinkFromText(text) {
  const normalizedPhone = siteSettings.whatsappPhone.replace(/\D/g, "");

  if (normalizedPhone) {
    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
  }

  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppLink(cartItems) {
  const text = buildWhatsAppMessage(cartItems);
  return buildWhatsAppLinkFromText(text);
}

export function buildFloatingWhatsAppLink() {
  return buildWhatsAppLinkFromText(siteSettings.whatsappFloatingMessage);
}

export function productMatches(product, searchTerm, selectedCategory) {
  const categoryMatches = selectedCategory === "Todos" || product.category === selectedCategory;
  const query = searchTerm.trim().toLowerCase();

  if (!categoryMatches) {
    return false;
  }

  if (!query) {
    return true;
  }

  return (
    product.name.toLowerCase().includes(query) ||
    product.sub.toLowerCase().includes(query) ||
    product.category.toLowerCase().includes(query)
  );
}
