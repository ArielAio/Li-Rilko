"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createDefaultCatalog } from "@/lib/catalog-data";
import {
  ensureCategoryAndSub,
  normalizeProductInput,
  sanitizeCatalog,
  sanitizeCategories,
  sanitizeContactChannels,
  sanitizeSiteSettings,
  slugify,
} from "@/lib/catalog-normalizer";

const CATALOG_STORAGE_KEY = "li-rilko-catalog-v1";

const CatalogContext = createContext(null);

function readCatalogFromStorage() {
  if (typeof window === "undefined") {
    return createDefaultCatalog();
  }

  try {
    const serialized = window.localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!serialized) {
      return createDefaultCatalog();
    }

    const parsed = JSON.parse(serialized);
    return sanitizeCatalog(parsed);
  } catch {
    return createDefaultCatalog();
  }
}

function persistCatalogToStorage(catalog) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalog));
  } catch {
    // Ignore storage failures to keep browsing flow working.
  }
}

export function CatalogProvider({ children }) {
  const [catalog, setCatalog] = useState(() => createDefaultCatalog());
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setCatalog(readCatalogFromStorage());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    persistCatalogToStorage(catalog);
  }, [catalog, isHydrated]);

  const refreshCatalog = useCallback(async () => {
    const nextCatalog = readCatalogFromStorage();
    setCatalog(nextCatalog);
    return { ok: true };
  }, []);

  const commitMutation = useCallback(async (action, payload = {}) => {
    setIsSyncing(true);

    let mutationResult = { ok: true };

    setCatalog((prev) => {
      switch (action) {
        case "add_product": {
          const normalized = normalizeProductInput(payload);

          if (!normalized.name) {
            mutationResult = { ok: false, error: "Nome do produto é obrigatório." };
            return prev;
          }

          if (!normalized.category) {
            mutationResult = { ok: false, error: "Categoria é obrigatória." };
            return prev;
          }

          if (!normalized.sub) {
            mutationResult = { ok: false, error: "Subcategoria é obrigatória." };
            return prev;
          }

          const taken = new Set(prev.products.map((product) => product.id));
          const baseId = slugify(normalized.name) || `produto-${prev.products.length + 1}`;
          let id = baseId;
          let suffix = 2;

          while (taken.has(id)) {
            id = `${baseId}-${suffix}`;
            suffix += 1;
          }

          mutationResult = { ok: true, id };

          return {
            ...prev,
            categories: ensureCategoryAndSub(prev.categories, normalized.category, normalized.sub),
            products: [{ ...normalized, id }, ...prev.products],
          };
        }

        case "update_product": {
          const productId = String(payload?.productId || "");
          const input = payload?.input || {};
          const current = prev.products.find((product) => product.id === productId);

          if (!current) {
            mutationResult = { ok: false, error: "Produto não encontrado." };
            return prev;
          }

          const normalized = normalizeProductInput(input, current);
          if (!normalized.name || !normalized.category || !normalized.sub) {
            mutationResult = { ok: false, error: "Nome, categoria e subcategoria são obrigatórios." };
            return prev;
          }

          mutationResult = { ok: true };

          return {
            ...prev,
            categories: ensureCategoryAndSub(prev.categories, normalized.category, normalized.sub),
            products: prev.products.map((product) => (product.id === productId ? { ...product, ...normalized } : product)),
          };
        }

        case "remove_product": {
          const productId = String(payload?.productId || "");
          const nextProducts = prev.products.filter((product) => product.id !== productId);

          if (nextProducts.length === prev.products.length) {
            mutationResult = { ok: false, error: "Produto não encontrado." };
            return prev;
          }

          mutationResult = { ok: true };

          return {
            ...prev,
            products: nextProducts,
          };
        }

        case "toggle_product_visibility": {
          const productId = String(payload?.productId || "");
          let touched = false;

          const nextProducts = prev.products.map((product) => {
            if (product.id !== productId) {
              return product;
            }

            touched = true;
            return {
              ...product,
              isVisible: !product.isVisible,
            };
          });

          if (!touched) {
            mutationResult = { ok: false, error: "Produto não encontrado." };
            return prev;
          }

          mutationResult = { ok: true };

          return {
            ...prev,
            products: nextProducts,
          };
        }

        case "toggle_product_availability": {
          const productId = String(payload?.productId || "");
          let touched = false;

          const nextProducts = prev.products.map((product) => {
            if (product.id !== productId) {
              return product;
            }

            touched = true;
            return {
              ...product,
              isAvailable: !product.isAvailable,
            };
          });

          if (!touched) {
            mutationResult = { ok: false, error: "Produto não encontrado." };
            return prev;
          }

          mutationResult = { ok: true };

          return {
            ...prev,
            products: nextProducts,
          };
        }

        case "save_categories": {
          mutationResult = { ok: true };
          return {
            ...prev,
            categories: sanitizeCategories(payload?.categories, prev.categories),
          };
        }

        case "save_site_settings": {
          mutationResult = { ok: true };
          return {
            ...prev,
            siteSettings: sanitizeSiteSettings({
              ...prev.siteSettings,
              ...(payload?.settings || {}),
            }),
          };
        }

        case "save_contact_channels": {
          mutationResult = { ok: true };
          return {
            ...prev,
            contactChannels: sanitizeContactChannels(payload?.channels),
          };
        }

        case "reset_catalog": {
          mutationResult = { ok: true };
          return createDefaultCatalog();
        }

        default: {
          mutationResult = { ok: false, error: "Ação de catálogo inválida." };
          return prev;
        }
      }
    });

    setIsSyncing(false);

    return mutationResult;
  }, []);

  const productMap = useMemo(() => new Map(catalog.products.map((product) => [product.id, product])), [catalog.products]);

  const publicProducts = useMemo(
    () => catalog.products.filter((product) => product.isVisible !== false),
    [catalog.products],
  );

  const publicProductMap = useMemo(() => new Map(publicProducts.map((product) => [product.id, product])), [publicProducts]);

  const addProduct = useCallback(async (input) => commitMutation("add_product", input), [commitMutation]);

  const updateProduct = useCallback(
    async (productId, input) =>
      commitMutation("update_product", {
        productId,
        input,
      }),
    [commitMutation],
  );

  const removeProduct = useCallback(async (productId) => commitMutation("remove_product", { productId }), [commitMutation]);

  const toggleProductVisibility = useCallback(
    async (productId) => commitMutation("toggle_product_visibility", { productId }),
    [commitMutation],
  );

  const toggleProductAvailability = useCallback(
    async (productId) => commitMutation("toggle_product_availability", { productId }),
    [commitMutation],
  );

  const saveCategories = useCallback(
    async (categories) =>
      commitMutation("save_categories", {
        categories,
      }),
    [commitMutation],
  );

  const saveSiteSettings = useCallback(
    async (settings) =>
      commitMutation("save_site_settings", {
        settings,
      }),
    [commitMutation],
  );

  const saveContactChannels = useCallback(
    async (channels) =>
      commitMutation("save_contact_channels", {
        channels,
      }),
    [commitMutation],
  );

  const resetCatalog = useCallback(async () => commitMutation("reset_catalog", {}), [commitMutation]);

  const value = useMemo(
    () => ({
      isHydrated,
      isSyncing,
      categories: catalog.categories,
      products: catalog.products,
      publicProducts,
      productMap,
      publicProductMap,
      homeHighlights: catalog.homeHighlights,
      contactChannels: catalog.contactChannels,
      siteSettings: catalog.siteSettings,
      refreshCatalog,
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
      isSyncing,
      productMap,
      publicProductMap,
      publicProducts,
      refreshCatalog,
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
