import { createDefaultCatalog, defaultContactChannels, defaultSiteSettings } from "@/lib/catalog-data";

function normalizeText(value, fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function normalizeMoney(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return fallback;
  }
  return Number(numeric.toFixed(2));
}

function slugify(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeCategories(rawCategories, fallbackCategories) {
  const source = Array.isArray(rawCategories) && rawCategories.length > 0 ? rawCategories : fallbackCategories;
  const seen = new Set();

  const result = source
    .map((category) => {
      const name = normalizeText(category?.name);
      if (!name) {
        return null;
      }

      const normalizedKey = name.toLowerCase();
      if (seen.has(normalizedKey)) {
        return null;
      }
      seen.add(normalizedKey);

      const subsRaw = Array.isArray(category?.subs) ? category.subs : [];
      const subsSeen = new Set();
      const subs = subsRaw
        .map((sub) => normalizeText(sub))
        .filter((sub) => {
          if (!sub) {
            return false;
          }
          const subKey = sub.toLowerCase();
          if (subsSeen.has(subKey)) {
            return false;
          }
          subsSeen.add(subKey);
          return true;
        });

      return {
        name,
        subs: subs.length > 0 ? subs : ["Geral"],
      };
    })
    .filter(Boolean);

  if (result.length > 0) {
    return result;
  }

  return fallbackCategories;
}

function sanitizeHighlights(rawHighlights, fallbackHighlights) {
  const source = Array.isArray(rawHighlights) && rawHighlights.length > 0 ? rawHighlights : fallbackHighlights;
  const normalized = source
    .map((item) => ({
      title: normalizeText(item?.title),
      text: normalizeText(item?.text),
    }))
    .filter((item) => item.title && item.text);

  return normalized.length > 0 ? normalized : fallbackHighlights;
}

function sanitizeContactChannels(rawChannels) {
  const source = Array.isArray(rawChannels) && rawChannels.length > 0 ? rawChannels : defaultContactChannels;
  const normalized = source
    .map((channel, index) => ({
      id: normalizeText(channel?.id, `channel-${index + 1}`),
      title: normalizeText(channel?.title, "Canal"),
      value: normalizeText(channel?.value, "-"),
      href: normalizeText(channel?.href, "#"),
    }))
    .filter((channel) => channel.title);

  return normalized.length > 0 ? normalized : defaultContactChannels;
}

function normalizeWhatsAppPhone(value) {
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

function sanitizeWhatsAppAttendants(rawAttendants) {
  const source = Array.isArray(rawAttendants) ? rawAttendants : [];
  const seenPhones = new Set();
  const usedIds = new Set();

  return source
    .map((attendant, index) => {
      const name = normalizeText(attendant?.name);
      const phone = normalizeWhatsAppPhone(attendant?.phone);

      if (!name || !phone) {
        return null;
      }

      if (seenPhones.has(phone)) {
        return null;
      }
      seenPhones.add(phone);

      const baseId = slugify(attendant?.id || name) || `attendant-${index + 1}`;
      let id = baseId;
      let suffix = 2;

      while (usedIds.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }

      usedIds.add(id);

      return {
        id,
        name,
        phone,
      };
    })
    .filter(Boolean);
}

function sanitizeSiteSettings(rawSettings) {
  const whatsappAttendants = sanitizeWhatsAppAttendants(rawSettings?.whatsappAttendants);
  const whatsappPhone = normalizeWhatsAppPhone(rawSettings?.whatsappPhone) || normalizeWhatsAppPhone(defaultSiteSettings.whatsappPhone);

  return {
    whatsappPhone,
    whatsappIntro: normalizeText(rawSettings?.whatsappIntro, defaultSiteSettings.whatsappIntro),
    whatsappFloatingMessage: normalizeText(rawSettings?.whatsappFloatingMessage, defaultSiteSettings.whatsappFloatingMessage),
    whatsappAttendants,
  };
}

function getDefaultImage(seed) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed || "li-rilko-produto")}/1200/1200`;
}

function sanitizeImages(imagesRaw, fallbackImage) {
  const source = Array.isArray(imagesRaw) ? imagesRaw : [];
  const unique = [];
  const seen = new Set();

  source.forEach((value) => {
    const url = normalizeText(value);
    if (!url || seen.has(url)) {
      return;
    }
    seen.add(url);
    unique.push(url);
  });

  if (fallbackImage && !seen.has(fallbackImage)) {
    unique.unshift(fallbackImage);
  }

  return unique.length > 0 ? unique.slice(0, 6) : [getDefaultImage("li-rilko")];
}

function sanitizeProducts(rawProducts, fallbackProducts, categories) {
  const source = Array.isArray(rawProducts) && rawProducts.length > 0 ? rawProducts : fallbackProducts;
  const fallbackCategory = categories[0]?.name || "Outros";
  const fallbackSub = categories[0]?.subs?.[0] || "Geral";
  const usedIds = new Set();

  const normalized = source
    .map((product, index) => {
      const name = normalizeText(product?.name, `Produto ${index + 1}`);
      const category = normalizeText(product?.category, fallbackCategory);
      const sub = normalizeText(product?.sub, fallbackSub);
      const baseId = slugify(product?.id || name) || `produto-${index + 1}`;

      let id = baseId;
      let suffix = 2;
      while (usedIds.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }
      usedIds.add(id);

      const image = normalizeText(product?.image, getDefaultImage(id));
      const images = sanitizeImages(product?.images, image);
      const priceInstallment = normalizeMoney(product?.priceInstallment, normalizeMoney(product?.price, 0));
      const priceCash = normalizeMoney(product?.priceCash, priceInstallment);

      const highlightsRaw = Array.isArray(product?.highlights) ? product.highlights : [];
      const highlights = highlightsRaw.map((item) => normalizeText(item)).filter(Boolean);

      return {
        id,
        name,
        category,
        sub,
        price: priceInstallment,
        priceInstallment,
        priceCash,
        oldPrice: normalizeMoney(product?.oldPrice, priceInstallment),
        badge: normalizeText(product?.badge, "Destaque"),
        shortDescription: normalizeText(product?.shortDescription, "Produto disponível na vitrine da loja."),
        highlights: highlights.length > 0 ? highlights.slice(0, 6) : ["Atendimento via WhatsApp"],
        image: images[0],
        images,
        isVisible: product?.isVisible !== false,
        isAvailable: product?.isAvailable !== false,
      };
    })
    .filter((product) => product.name);

  return normalized.length > 0 ? normalized : fallbackProducts;
}

function sanitizeCatalog(rawCatalog) {
  const fallback = createDefaultCatalog();
  if (!rawCatalog || typeof rawCatalog !== "object") {
    return fallback;
  }

  const categories = sanitizeCategories(rawCatalog.categories, fallback.categories);
  const products = sanitizeProducts(rawCatalog.products, fallback.products, categories);

  return {
    categories,
    products,
    homeHighlights: sanitizeHighlights(rawCatalog.homeHighlights, fallback.homeHighlights),
    contactChannels: sanitizeContactChannels(rawCatalog.contactChannels),
    siteSettings: sanitizeSiteSettings(rawCatalog.siteSettings),
  };
}

function ensureCategoryAndSub(categories, categoryName, subName) {
  const normalizedCategory = normalizeText(categoryName);
  const normalizedSub = normalizeText(subName);

  if (!normalizedCategory) {
    return categories;
  }

  const next = categories.map((category) => ({
    name: category.name,
    subs: [...category.subs],
  }));

  const index = next.findIndex((category) => category.name.toLowerCase() === normalizedCategory.toLowerCase());

  if (index === -1) {
    next.push({
      name: normalizedCategory,
      subs: normalizedSub ? [normalizedSub] : ["Geral"],
    });
    return next;
  }

  if (normalizedSub) {
    const hasSub = next[index].subs.some((sub) => sub.toLowerCase() === normalizedSub.toLowerCase());
    if (!hasSub) {
      next[index].subs.push(normalizedSub);
    }
  }

  return next;
}

function normalizeProductInput(input, fallback = {}) {
  const name = normalizeText(input?.name, fallback.name || "");
  const category = normalizeText(input?.category, fallback.category || "");
  const sub = normalizeText(input?.sub, fallback.sub || "");
  const image = normalizeText(input?.image, fallback.image || getDefaultImage(name || "produto"));
  const rawImages = Array.isArray(input?.images) ? input.images : [];
  const images = sanitizeImages(rawImages, image);
  const rawHighlights = Array.isArray(input?.highlights) ? input.highlights : [];
  const highlights = rawHighlights.map((item) => normalizeText(item)).filter(Boolean);
  const fallbackInstallment = normalizeMoney(fallback.priceInstallment, normalizeMoney(fallback.price, 0));
  const priceInstallment = normalizeMoney(input?.priceInstallment, normalizeMoney(input?.price, fallbackInstallment));
  const priceCash = normalizeMoney(input?.priceCash, normalizeMoney(fallback.priceCash, priceInstallment));

  return {
    name,
    category,
    sub,
    price: priceInstallment,
    priceInstallment,
    priceCash,
    oldPrice: normalizeMoney(input?.oldPrice, normalizeMoney(fallback.oldPrice, priceInstallment)),
    badge: normalizeText(input?.badge, fallback.badge || "Destaque"),
    shortDescription: normalizeText(
      input?.shortDescription,
      fallback.shortDescription || "Produto disponível na vitrine da loja.",
    ),
    image: images[0],
    images,
    highlights: highlights.length > 0 ? highlights.slice(0, 6) : fallback.highlights || ["Atendimento via WhatsApp"],
    isVisible: input?.isVisible !== false,
    isAvailable: input?.isAvailable !== false,
  };
}

export {
  ensureCategoryAndSub,
  normalizeMoney,
  normalizeProductInput,
  normalizeText,
  sanitizeCatalog,
  sanitizeCategories,
  sanitizeContactChannels,
  sanitizeSiteSettings,
  slugify,
};
