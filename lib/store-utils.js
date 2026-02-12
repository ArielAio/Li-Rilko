import { defaultSiteSettings } from "./catalog-data";

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value) {
  return numberFormatter.format(value || 0);
}

function resolveSiteSettings(settings) {
  return {
    ...defaultSiteSettings,
    ...(settings || {}),
  };
}

export function buildWhatsAppMessage(cartItems, settings) {
  const siteSettings = resolveSiteSettings(settings);
  const intro = siteSettings.whatsappIntro;

  if (!cartItems || cartItems.length === 0) {
    return `${intro}\n\n(sem itens selecionados ainda)`;
  }

  const lines = cartItems.map((item) => `• ${item.name} (${item.qty}x) — ${formatCurrency(item.subtotal)}`);
  const total = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  return `${intro}\n\n${lines.join("\n")}\n\nTotal: ${formatCurrency(total)}`;
}

function buildWhatsAppLinkFromText(text, settings) {
  const siteSettings = resolveSiteSettings(settings);
  const normalizedPhone = String(siteSettings.whatsappPhone || "").replace(/\D/g, "");
  const encodedText = encodeURIComponent(text);

  if (normalizedPhone) {
    return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
  }

  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

export function buildWhatsAppLink(cartItems, settings) {
  const text = buildWhatsAppMessage(cartItems, settings);
  return buildWhatsAppLinkFromText(text, settings);
}

export function buildFloatingWhatsAppLink(settings) {
  const siteSettings = resolveSiteSettings(settings);
  return buildWhatsAppLinkFromText(siteSettings.whatsappFloatingMessage, siteSettings);
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
    product.category.toLowerCase().includes(query) ||
    product.shortDescription.toLowerCase().includes(query)
  );
}
