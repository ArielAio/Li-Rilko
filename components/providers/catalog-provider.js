"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createDefaultCatalog, defaultContactChannels, defaultSiteSettings } from "@/lib/catalog-data";

const CATALOG_STORAGE_KEY = "li-rilko-catalog-v1";

const CatalogContext = createContext(null);

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

function sanitizeSiteSettings(rawSettings) {
  return {
    whatsappPhone: normalizeText(rawSettings?.whatsappPhone, defaultSiteSettings.whatsappPhone),
    whatsappIntro: normalizeText(rawSettings?.whatsappIntro, defaultSiteSettings.whatsappIntro),
    whatsappFloatingMessage: normalizeText(rawSettings?.whatsappFloatingMessage, defaultSiteSettings.whatsappFloatingMessage),
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

      const highlightsRaw = Array.isArray(product?.highlights) ? product.highlights : [];
      const highlights = highlightsRaw.map((item) => normalizeText(item)).filter(Boolean);

      return {
        id,
        name,
        category,
        sub,
        price: normalizeMoney(product?.price, 0),
        oldPrice: normalizeMoney(product?.oldPrice, normalizeMoney(product?.price, 0)),
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

  return {
    name,
    category,
    sub,
    price: normalizeMoney(input?.price, normalizeMoney(fallback.price, 0)),
    oldPrice: normalizeMoney(input?.oldPrice, normalizeMoney(fallback.oldPrice, normalizeMoney(input?.price, 0))),
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

export function CatalogProvider({ children }) {
  const [catalog, setCatalog] = useState(() => createDefaultCatalog());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const serialized = window.localStorage.getItem(CATALOG_STORAGE_KEY);
      if (serialized) {
        const parsed = JSON.parse(serialized);
        setCatalog(sanitizeCatalog(parsed));
      } else {
        setCatalog(createDefaultCatalog());
      }
    } catch {
      setCatalog(createDefaultCatalog());
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalog));
  }, [catalog, isHydrated]);

  const productMap = useMemo(() => new Map(catalog.products.map((product) => [product.id, product])), [catalog.products]);

  const publicProducts = useMemo(
    () => catalog.products.filter((product) => product.isVisible !== false),
    [catalog.products],
  );

  const publicProductMap = useMemo(() => new Map(publicProducts.map((product) => [product.id, product])), [publicProducts]);

  const addProduct = useCallback((input) => {
    const normalized = normalizeProductInput(input);
    if (!normalized.name) {
      return { ok: false, error: "Nome do produto é obrigatório." };
    }
    if (!normalized.category) {
      return { ok: false, error: "Categoria é obrigatória." };
    }
    if (!normalized.sub) {
      return { ok: false, error: "Subcategoria é obrigatória." };
    }

    let createdId = "";

    setCatalog((prev) => {
      const taken = new Set(prev.products.map((product) => product.id));
      const baseId = slugify(normalized.name) || `produto-${prev.products.length + 1}`;
      let id = baseId;
      let suffix = 2;

      while (taken.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }

      createdId = id;
      const nextCategories = ensureCategoryAndSub(prev.categories, normalized.category, normalized.sub);

      return {
        ...prev,
        categories: nextCategories,
        products: [{ ...normalized, id }, ...prev.products],
      };
    });

    return { ok: true, id: createdId };
  }, []);

  const updateProduct = useCallback((productId, input) => {
    let updated = false;
    let error = "";

    setCatalog((prev) => {
      const current = prev.products.find((product) => product.id === productId);
      if (!current) {
        error = "Produto não encontrado.";
        return prev;
      }

      const normalized = normalizeProductInput(input, current);
      if (!normalized.name || !normalized.category || !normalized.sub) {
        error = "Nome, categoria e subcategoria são obrigatórios.";
        return prev;
      }

      updated = true;
      const nextCategories = ensureCategoryAndSub(prev.categories, normalized.category, normalized.sub);

      return {
        ...prev,
        categories: nextCategories,
        products: prev.products.map((product) => (product.id === productId ? { ...product, ...normalized } : product)),
      };
    });

    if (!updated) {
      return { ok: false, error: error || "Não foi possível atualizar o produto." };
    }

    return { ok: true };
  }, []);

  const removeProduct = useCallback((productId) => {
    let removed = false;

    setCatalog((prev) => {
      const nextProducts = prev.products.filter((product) => product.id !== productId);
      removed = nextProducts.length < prev.products.length;

      if (!removed) {
        return prev;
      }

      return {
        ...prev,
        products: nextProducts,
      };
    });

    return removed;
  }, []);

  const toggleProductVisibility = useCallback((productId) => {
    setCatalog((prev) => ({
      ...prev,
      products: prev.products.map((product) =>
        product.id === productId ? { ...product, isVisible: !product.isVisible } : product,
      ),
    }));
  }, []);

  const toggleProductAvailability = useCallback((productId) => {
    setCatalog((prev) => ({
      ...prev,
      products: prev.products.map((product) =>
        product.id === productId ? { ...product, isAvailable: !product.isAvailable } : product,
      ),
    }));
  }, []);

  const saveCategories = useCallback((nextCategories) => {
    setCatalog((prev) => ({
      ...prev,
      categories: sanitizeCategories(nextCategories, prev.categories),
    }));
  }, []);

  const saveSiteSettings = useCallback((nextSettings) => {
    setCatalog((prev) => ({
      ...prev,
      siteSettings: sanitizeSiteSettings({
        ...prev.siteSettings,
        ...nextSettings,
      }),
    }));
  }, []);

  const saveContactChannels = useCallback((nextChannels) => {
    setCatalog((prev) => ({
      ...prev,
      contactChannels: sanitizeContactChannels(nextChannels),
    }));
  }, []);

  const resetCatalog = useCallback(() => {
    setCatalog(createDefaultCatalog());
  }, []);

  const value = useMemo(
    () => ({
      isHydrated,
      categories: catalog.categories,
      products: catalog.products,
      publicProducts,
      productMap,
      publicProductMap,
      homeHighlights: catalog.homeHighlights,
      contactChannels: catalog.contactChannels,
      siteSettings: catalog.siteSettings,
      addProduct,
      updateProduct,
      removeProduct,
      toggleProductVisibility,
      toggleProductAvailability,
      saveCategories,
      saveSiteSettings,
      saveContactChannels,
      resetCatalog,
    }),
    [
      addProduct,
      catalog.categories,
      catalog.contactChannels,
      catalog.homeHighlights,
      catalog.products,
      catalog.siteSettings,
      isHydrated,
      productMap,
      publicProductMap,
      publicProducts,
      removeProduct,
      resetCatalog,
      saveCategories,
      saveContactChannels,
      saveSiteSettings,
      toggleProductAvailability,
      toggleProductVisibility,
      updateProduct,
    ],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog precisa ser usado dentro de CatalogProvider.");
  }
  return context;
}

