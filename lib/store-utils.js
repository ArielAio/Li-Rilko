import { defaultSiteSettings } from "./catalog-data";
import { normalizePhone } from "./attendants-utils";

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value) {
  return numberFormatter.format(value || 0);
}

export function resolveProductPrices(product) {
  const priceInstallment = Number(product?.priceInstallment ?? product?.price ?? 0);
  const priceCash = Number(product?.priceCash ?? priceInstallment);

  return {
    priceCash: Number.isFinite(priceCash) ? priceCash : 0,
    priceInstallment: Number.isFinite(priceInstallment) ? priceInstallment : 0,
  };
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

  const lines = cartItems.map((item) => {
    const subtotalCash = Number(item.subtotalCash ?? 0);
    const subtotalInstallment = Number(item.subtotalInstallment ?? item.subtotal ?? 0);
    return [
      `• ${item.name} (${item.qty}x)`,
      `  À vista: ${formatCurrency(subtotalCash)} | A prazo: ${formatCurrency(subtotalInstallment)}`,
    ].join("\n");
  });
  const totalCash = cartItems.reduce((acc, item) => acc + Number(item.subtotalCash ?? 0), 0);
  const totalInstallment = cartItems.reduce((acc, item) => acc + Number(item.subtotalInstallment ?? item.subtotal ?? 0), 0);

  return `${intro}\n\n${lines.join("\n")}\n\nTotal à vista: ${formatCurrency(totalCash)}\nTotal a prazo: ${formatCurrency(totalInstallment)}`;
}

function buildWhatsAppLinkFromText(text, phone) {
  const normalizedPhone = normalizePhone(phone);
  const encodedText = encodeURIComponent(text);

  if (!normalizedPhone) {
    return null;
  }

  return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
}

export function buildWhatsAppLink(cartItems, settings, phone) {
  const text = buildWhatsAppMessage(cartItems, settings);
  return buildWhatsAppLinkFromText(text, phone);
}

export function buildFloatingWhatsAppLink(settings, phone) {
  const siteSettings = resolveSiteSettings(settings);
  return buildWhatsAppLinkFromText(siteSettings.whatsappFloatingMessage, phone);
}

export function buildAttendantWhatsAppLink(text, attendant) {
  return buildWhatsAppLinkFromText(text, attendant?.phone);
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
