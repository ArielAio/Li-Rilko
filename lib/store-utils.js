import { defaultSiteSettings } from "./catalog-data";

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

function resolveWhatsAppOptions(options) {
  if (typeof options === "string") {
    return {
      preferredPhone: options,
      sourcePage: "",
      attendantId: "",
      attendantName: "",
      siteUrl: "",
    };
  }

  return {
    preferredPhone: String(options?.preferredPhone || ""),
    sourcePage: String(options?.sourcePage || ""),
    attendantId: String(options?.attendantId || ""),
    attendantName: String(options?.attendantName || ""),
    siteUrl: String(options?.siteUrl || ""),
  };
}

export function buildWhatsAppMessage(cartItems, settings, options = {}) {
  const siteSettings = resolveSiteSettings(settings);
  const normalizedOptions = resolveWhatsAppOptions(options);
  const intro = siteSettings.whatsappIntro;
  const greeting = normalizedOptions.attendantName ? `Olá, ${normalizedOptions.attendantName}!` : "";
  const introBlock = greeting ? `${greeting}\n${intro}` : intro;

  const contextLines = [];
  if (normalizedOptions.sourcePage) {
    contextLines.push(`Origem: ${normalizedOptions.sourcePage}`);
  }

  if (!cartItems || cartItems.length === 0) {
    const footer = contextLines.length > 0 ? `\n${contextLines.join("\n")}` : "";
    return `${introBlock}\n\n(sem itens selecionados ainda)${footer}`;
  }

  const normalizedBaseUrl = normalizedOptions.siteUrl ? normalizedOptions.siteUrl.replace(/\/$/, "") : "";

  const lines = cartItems.map((item) => {
    const subtotalCash = Number(item.subtotalCash ?? 0);
    const subtotalInstallment = Number(item.subtotalInstallment ?? item.subtotal ?? 0);
    const itemLines = [
      `• ${item.name} (${item.qty}x)`,
      `  À vista: ${formatCurrency(subtotalCash)} | A prazo: ${formatCurrency(subtotalInstallment)}`,
    ];

    if (normalizedBaseUrl && item?.id) {
      itemLines.push(`  Link: ${normalizedBaseUrl}/produto/${item.id}`);
    }

    return itemLines.join("\n");
  });

  const totalCash = cartItems.reduce((acc, item) => acc + Number(item.subtotalCash ?? 0), 0);
  const totalInstallment = cartItems.reduce((acc, item) => acc + Number(item.subtotalInstallment ?? item.subtotal ?? 0), 0);

  const footer = contextLines.length > 0 ? `\n\n${contextLines.join("\n")}` : "";

  return `${introBlock}\n\n${lines.join("\n")}\n\nTotal à vista: ${formatCurrency(totalCash)}\nTotal a prazo: ${formatCurrency(totalInstallment)}${footer}`;
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return "";
}

export function resolveWhatsAppPhone(settings, options = {}) {
  const normalizedOptions = resolveWhatsAppOptions(options);

  return normalizePhone(normalizedOptions.preferredPhone);
}

function buildWhatsAppLinkFromText(text, settings, options = {}) {
  const normalizedPhone = resolveWhatsAppPhone(settings, options);
  const encodedText = encodeURIComponent(text);

  if (!normalizedPhone) {
    return null;
  }

  return `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedText}`;
}

export function buildWhatsAppLink(cartItems, settings, options = {}) {
  const text = buildWhatsAppMessage(cartItems, settings, options);
  return buildWhatsAppLinkFromText(text, settings, options);
}

export function buildFloatingWhatsAppLink(settings, options = {}) {
  const siteSettings = resolveSiteSettings(settings);
  const normalizedOptions = resolveWhatsAppOptions(options);
  const greeting = normalizedOptions.attendantName ? `Olá, ${normalizedOptions.attendantName}!\n\n` : "";
  const text = `${greeting}${siteSettings.whatsappFloatingMessage}`;
  return buildWhatsAppLinkFromText(text, siteSettings, normalizedOptions);
}

export function openWhatsAppLink(url) {
  if (typeof window === "undefined" || !url) {
    return false;
  }

  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent);

  if (isMobile) {
    window.location.assign(url);
    return true;
  }

  const popup = window.open(url, "_blank", "noopener,noreferrer");
  if (popup) {
    return true;
  }

  window.location.assign(url);
  return true;
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
