"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { defaultAttendants } from "@/lib/attendants-data";
import { createDefaultAppCatalog } from "@/lib/app-catalog-data";
import { sanitizeContactChannels, sanitizeSiteSettings } from "@/lib/catalog-normalizer";

const CatalogContext = createContext(null);

function okResult(extra = {}) {
  return { ok: true, ...extra };
}

function errorResult(error) {
  return { ok: false, error };
}

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

function createFallbackAdminCategories(categories) {
  return categories.map((category, categoryIndex) => {
    const categoryId = `fallback-category-${categoryIndex + 1}`;

    return {
      id: categoryId,
      name: category.name,
      sortOrder: categoryIndex,
      isActive: true,
      subs: category.subs.map((sub, subIndex) => ({
        id: `${categoryId}-sub-${subIndex + 1}`,
        categoryId,
        name: sub,
        sortOrder: subIndex,
        isActive: true,
      })),
    };
  });
}

function normalizeProduct(product, index, fallbackCategories, fallbackAdminCategories) {
  const fallbackCategory = fallbackCategories[0]?.name || "Outros";
  const fallbackSub = fallbackCategories[0]?.subs?.[0] || "Geral";
  const categoryName = normalizeText(product?.category, fallbackCategory);
  const subName = normalizeText(product?.sub, fallbackSub);
  const categoryId =
    normalizeText(product?.categoryId) ||
    fallbackAdminCategories.find((category) => category.name === categoryName)?.id ||
    fallbackAdminCategories[0]?.id ||
    "";
  const subcategoryId =
    normalizeText(product?.subcategoryId) ||
    fallbackAdminCategories
      .find((category) => category.id === categoryId)
      ?.subs?.find((sub) => sub.name === subName)?.id ||
    fallbackAdminCategories[0]?.subs?.[0]?.id ||
    "";
  const images = Array.isArray(product?.images) && product.images.length > 0 ? product.images.filter(Boolean).slice(0, 6) : [];
  const imageItems = Array.isArray(product?.imageItems)
    ? product.imageItems
        .map((item, imageIndex) => ({
          id: normalizeText(item?.id, `fallback-image-${index + 1}-${imageIndex + 1}`),
          storagePath: normalizeText(item?.storagePath, images[imageIndex] || ""),
          publicUrl: normalizeText(item?.publicUrl, images[imageIndex] || ""),
          sortOrder: Number(item?.sortOrder ?? imageIndex),
        }))
        .filter((item) => item.storagePath || item.publicUrl)
    : images.map((image, imageIndex) => ({
        id: `fallback-image-${index + 1}-${imageIndex + 1}`,
        storagePath: image,
        publicUrl: image,
        sortOrder: imageIndex,
      }));

  const resolvedImages = imageItems.map((item) => item.publicUrl || item.storagePath).filter(Boolean);

  return {
    id: normalizeText(product?.id, `produto-${index + 1}`),
    slug: normalizeText(product?.slug),
    name: normalizeText(product?.name, `Produto ${index + 1}`),
    categoryId,
    subcategoryId,
    category: categoryName,
    sub: subName,
    price: normalizeMoney(product?.priceInstallment, normalizeMoney(product?.price, 0)),
    priceInstallment: normalizeMoney(product?.priceInstallment, normalizeMoney(product?.price, 0)),
    priceCash: normalizeMoney(product?.priceCash, normalizeMoney(product?.priceInstallment, normalizeMoney(product?.price, 0))),
    oldPrice: normalizeMoney(product?.oldPrice, normalizeMoney(product?.priceInstallment, normalizeMoney(product?.price, 0))),
    badge: normalizeText(product?.badge, "Destaque"),
    shortDescription: normalizeText(product?.shortDescription, "Produto disponível na vitrine da loja."),
    highlights: Array.isArray(product?.highlights) && product.highlights.length > 0 ? product.highlights : ["Atendimento via WhatsApp"],
    image: resolvedImages[0] || "",
    images: resolvedImages,
    imageItems,
    isVisible: product?.isVisible !== false,
    isAvailable: product?.isAvailable !== false,
  };
}

function normalizeAdminCategories(adminCategories, publicCategories) {
  const fallback = createFallbackAdminCategories(publicCategories);
  if (!Array.isArray(adminCategories) || adminCategories.length === 0) {
    return fallback;
  }

  return adminCategories.map((category, categoryIndex) => {
    const categoryId = normalizeText(category?.id, fallback[categoryIndex]?.id || `category-${categoryIndex + 1}`);
    const subs = Array.isArray(category?.subs)
      ? category.subs
          .map((sub, subIndex) => ({
            id: normalizeText(sub?.id, `${categoryId}-sub-${subIndex + 1}`),
            categoryId,
            name: normalizeText(sub?.name),
            sortOrder: Number(sub?.sortOrder ?? subIndex),
            isActive: sub?.isActive !== false,
          }))
          .filter((sub) => sub.name)
      : [];

    return {
      id: categoryId,
      name: normalizeText(category?.name, fallback[categoryIndex]?.name || "Categoria"),
      sortOrder: Number(category?.sortOrder ?? categoryIndex),
      isActive: category?.isActive !== false,
      subs: subs.length > 0 ? subs : fallback[categoryIndex]?.subs || [],
    };
  });
}

function normalizeCatalogSnapshot(snapshot) {
  const fallback = createDefaultAppCatalog();
  const categories =
    Array.isArray(snapshot?.categories) && snapshot.categories.length > 0
      ? snapshot.categories.map((category) => ({
          name: normalizeText(category?.name),
          subs: Array.isArray(category?.subs) ? category.subs.map((sub) => normalizeText(sub)).filter(Boolean) : [],
        }))
      : fallback.categories;
  const adminCategories = normalizeAdminCategories(snapshot?.adminCategories, categories);
  const productsSource = Array.isArray(snapshot?.products) && snapshot.products.length > 0 ? snapshot.products : fallback.products;
  const attendantsSource = Array.isArray(snapshot?.attendants) ? snapshot.attendants : defaultAttendants;
  const homeHighlights =
    Array.isArray(snapshot?.homeHighlights) && snapshot.homeHighlights.length > 0 ? snapshot.homeHighlights : fallback.homeHighlights;

  return {
    categories: categories.length > 0 ? categories : fallback.categories,
    adminCategories,
    products: productsSource.map((product, index) => normalizeProduct(product, index, categories, adminCategories)),
    attendants: attendantsSource.map((attendant, index) => ({
      id: normalizeText(attendant?.id, `attendant-${index + 1}`),
      name: normalizeText(attendant?.name),
      phone: normalizeText(attendant?.phone),
      sortOrder: Number(attendant?.sortOrder ?? index),
      isActive: attendant?.isActive !== false,
    })),
    homeHighlights,
    contactChannels: sanitizeContactChannels(snapshot?.contactChannels),
    siteSettings: sanitizeSiteSettings(snapshot?.siteSettings),
  };
}

function resolveRuntimeCatalogOverride(snapshot) {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") {
    return snapshot;
  }

  let nextSnapshot = snapshot;

  if (window.__LI_RILKO_TEST_PUBLIC_CATALOG__ && typeof window.__LI_RILKO_TEST_PUBLIC_CATALOG__ === "object") {
    nextSnapshot = {
      ...nextSnapshot,
      ...window.__LI_RILKO_TEST_PUBLIC_CATALOG__,
    };
  }

  if (Array.isArray(window.__LI_RILKO_TEST_ATTENDANTS__)) {
    nextSnapshot = {
      ...nextSnapshot,
      attendants: window.__LI_RILKO_TEST_ATTENDANTS__,
    };
  }

  return nextSnapshot;
}

async function parseJsonResponse(response) {
  return response.json().catch(() => null);
}

async function requestJson(url, options, fallbackMessage) {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      credentials: "same-origin",
      ...options,
    });
    const payload = await parseJsonResponse(response);

    if (!response.ok) {
      const errorMessage = payload && typeof payload.error === "string" ? payload.error : fallbackMessage;
      return errorResult(errorMessage);
    }

    return okResult({ payload });
  } catch {
    return errorResult(fallbackMessage);
  }
}

export function CatalogProvider({ children, initialCatalog, isAdmin = false }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const resolvedInitialCatalog = useMemo(
    () => resolveRuntimeCatalogOverride(initialCatalog),
    [initialCatalog],
  );
  const [catalog, setCatalog] = useState(() => normalizeCatalogSnapshot(resolvedInitialCatalog));
  const [isHydrated, setIsHydrated] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  const [isWhatsAppPickerOpen, setIsWhatsAppPickerOpen] = useState(false);
  const [whatsappPendingMessage, setWhatsappPendingMessage] = useState("");

  const openWhatsAppPicker = useCallback((message = "") => {
    setWhatsappPendingMessage(message);
    setIsWhatsAppPickerOpen(true);
  }, []);

  const closeWhatsAppPicker = useCallback(() => {
    setIsWhatsAppPickerOpen(false);
    setWhatsappPendingMessage("");
  }, []);

  const openEditModal = useCallback((id) => setEditingProductId(String(id || "new")), []);
  const closeEditModal = useCallback(() => setEditingProductId(null), []);

  useEffect(() => {
    setCatalog(normalizeCatalogSnapshot(resolvedInitialCatalog));
    setIsHydrated(true);
  }, [resolvedInitialCatalog]);

  const refreshAdminCatalog = useCallback(async () => {
    const result = await requestJson("/api/admin/bootstrap", { method: "GET" }, "Não foi possível carregar os dados do admin.");
    if (!result.ok) {
      return result;
    }

    setCatalog(normalizeCatalogSnapshot(result.payload?.catalog));
    return okResult();
  }, []);

  useEffect(() => {
    if (!isAdminRoute) {
      setCatalog(normalizeCatalogSnapshot(resolvedInitialCatalog));
      return;
    }

    void refreshAdminCatalog();
  }, [resolvedInitialCatalog, isAdminRoute, refreshAdminCatalog]);

  const productMap = useMemo(() => new Map(catalog.products.map((product) => [product.id, product])), [catalog.products]);

  const publicProducts = useMemo(
    () => catalog.products.filter((product) => product.isVisible !== false),
    [catalog.products],
  );

  const publicProductMap = useMemo(() => new Map(publicProducts.map((product) => [product.id, product])), [publicProducts]);

  const addProduct = useCallback(async (input) => {
    const result = await requestJson(
      "/api/admin/products",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      },
      "Não foi possível criar o produto.",
    );

    if (!result.ok) {
      return result;
    }

    setCatalog(normalizeCatalogSnapshot(result.payload?.catalog));
    return okResult({ id: result.payload?.productId || "" });
  }, []);

  const updateProduct = useCallback(async (productId, input) => {
    const result = await requestJson(
      `/api/admin/products/${encodeURIComponent(productId)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      },
      "Não foi possível atualizar o produto.",
    );

    if (!result.ok) {
      return result;
    }

    setCatalog(normalizeCatalogSnapshot(result.payload?.catalog));
    return okResult();
  }, []);

  const removeProduct = useCallback(async (productId) => {
    const result = await requestJson(
      `/api/admin/products/${encodeURIComponent(productId)}`,
      {
        method: "DELETE",
      },
      "Não foi possível remover o produto.",
    );

    if (!result.ok) {
      return result;
    }

    setCatalog(normalizeCatalogSnapshot(result.payload?.catalog));
    return okResult();
  }, []);

  const toggleProductVisibility = useCallback(
    async (productId) => {
      const product = productMap.get(productId);
      if (!product) {
        return errorResult("Produto não encontrado.");
      }

      return updateProduct(productId, {
        id: product.id,
        name: product.name,
        categoryId: product.categoryId,
        subcategoryId: product.subcategoryId,
        priceCash: product.priceCash,
        priceInstallment: product.priceInstallment,
        oldPrice: product.oldPrice,
        badge: product.badge,
        shortDescription: product.shortDescription,
        highlights: product.highlights,
        isVisible: !product.isVisible,
        isAvailable: product.isAvailable,
        imageItems: product.imageItems,
      });
    },
    [productMap, updateProduct],
  );

  const toggleProductAvailability = useCallback(
    async (productId) => {
      const product = productMap.get(productId);
      if (!product) {
        return errorResult("Produto não encontrado.");
      }

      return updateProduct(productId, {
        id: product.id,
        name: product.name,
        categoryId: product.categoryId,
        subcategoryId: product.subcategoryId,
        priceCash: product.priceCash,
        priceInstallment: product.priceInstallment,
        oldPrice: product.oldPrice,
        badge: product.badge,
        shortDescription: product.shortDescription,
        highlights: product.highlights,
        isVisible: product.isVisible,
        isAvailable: !product.isAvailable,
        imageItems: product.imageItems,
      });
    },
    [productMap, updateProduct],
  );

  const saveCategories = useCallback(async (nextCategories) => {
    const result = await requestJson(
      "/api/admin/categories",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categories: nextCategories }),
      },
      "Não foi possível salvar as categorias.",
    );

    if (!result.ok) {
      return result;
    }

    setCatalog(normalizeCatalogSnapshot(result.payload?.catalog));
    return okResult();
  }, []);

  const saveSiteSettings = useCallback(async (nextSettings) => {
    const result = await requestJson(
      "/api/admin/site-settings",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ siteSettings: nextSettings }),
      },
      "Não foi possível salvar as configurações do site.",
    );

    if (!result.ok) {
      return result;
    }

    setCatalog(normalizeCatalogSnapshot(result.payload?.catalog));
    return okResult();
  }, []);

  const saveContactChannels = useCallback(async (nextChannels) => {
    const result = await requestJson(
      "/api/admin/contact-channels",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contactChannels: nextChannels }),
      },
      "Não foi possível salvar os canais de contato.",
    );

    if (!result.ok) {
      return result;
    }

    setCatalog(normalizeCatalogSnapshot(result.payload?.catalog));
    return okResult();
  }, []);

  const saveAttendants = useCallback(async (nextAttendants) => {
    const result = await requestJson(
      "/api/admin/attendants",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ attendants: nextAttendants }),
      },
      "Não foi possível salvar os atendentes.",
    );

    if (!result.ok) {
      return result;
    }

    setCatalog(normalizeCatalogSnapshot(result.payload?.catalog));
    return okResult();
  }, []);

  const uploadProductImage = useCallback(async (productId, file) => {
    const formData = new FormData();
    formData.set("file", file);

    const result = await requestJson(
      `/api/admin/products/${encodeURIComponent(productId)}/images`,
      {
        method: "POST",
        body: formData,
      },
      "Não foi possível enviar a imagem do produto.",
    );

    if (!result.ok) {
      return result;
    }

    return okResult({ image: result.payload?.image || null });
  }, []);

  const deleteProductImage = useCallback(async (productId, imageId) => {
    const result = await requestJson(
      `/api/admin/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
      {
        method: "DELETE",
      },
      "Não foi possível excluir a imagem do produto.",
    );

    if (!result.ok) {
      return result;
    }

    return okResult();
  }, []);

  const value = useMemo(
    () => ({
      isAdmin,
      isHydrated,
      editingProductId,
      openEditModal,
      closeEditModal,
      isWhatsAppPickerOpen,
      whatsappPendingMessage,
      openWhatsAppPicker,
      closeWhatsAppPicker,
      categories: catalog.categories,
      adminCategories: catalog.adminCategories,
      products: catalog.products,
      publicProducts,
      productMap,
      publicProductMap,
      attendants: catalog.attendants,
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
      saveAttendants,
      uploadProductImage,
      deleteProductImage,
      refreshAdminCatalog,
    }),
    [
      isAdmin,
      isHydrated,
      editingProductId,
      openEditModal,
      closeEditModal,
      isWhatsAppPickerOpen,
      whatsappPendingMessage,
      openWhatsAppPicker,
      closeWhatsAppPicker,
      addProduct,
      catalog.adminCategories,
      catalog.attendants,
      catalog.categories,
      catalog.contactChannels,
      catalog.homeHighlights,
      catalog.products,
      catalog.siteSettings,
      deleteProductImage,
      isHydrated,
      productMap,
      publicProductMap,
      publicProducts,
      refreshAdminCatalog,
      removeProduct,
      saveAttendants,
      saveCategories,
      saveContactChannels,
      saveSiteSettings,
      toggleProductAvailability,
      toggleProductVisibility,
      updateProduct,
      uploadProductImage,
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
