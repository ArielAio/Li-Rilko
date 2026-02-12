"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useCatalog } from "@/components/providers/catalog-provider";

const CART_STORAGE_KEY = "li-rilko-cart-v1";

const CartContext = createContext(null);

function sanitizeCart(rawCart, productMap) {
  if (!rawCart || typeof rawCart !== "object") {
    return {};
  }

  return Object.entries(rawCart).reduce((acc, [productId, qty]) => {
    if (!productMap.has(productId)) {
      return acc;
    }

    const parsedQty = Number(qty);
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      return acc;
    }

    acc[productId] = Math.min(99, Math.floor(parsedQty));
    return acc;
  }, {});
}

export function CartProvider({ children }) {
  const { productMap, isHydrated: isCatalogHydrated } = useCatalog();
  const [cartMap, setCartMap] = useState({});
  const [isHydrated, setIsHydrated] = useState(false);
  const hasLoadedFromStorageRef = useRef(false);

  useEffect(() => {
    if (!isCatalogHydrated || hasLoadedFromStorageRef.current) {
      return;
    }

    hasLoadedFromStorageRef.current = true;

    try {
      const serialized = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!serialized) {
        setIsHydrated(true);
        return;
      }

      const parsed = JSON.parse(serialized);
      setCartMap(sanitizeCart(parsed, productMap));
    } catch {
      setCartMap({});
    } finally {
      setIsHydrated(true);
    }
  }, [isCatalogHydrated, productMap]);

  useEffect(() => {
    if (!isHydrated || !isCatalogHydrated) {
      return;
    }

    setCartMap((prev) => sanitizeCart(prev, productMap));
  }, [isHydrated, isCatalogHydrated, productMap]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartMap));
  }, [cartMap, isHydrated]);

  const items = useMemo(() => {
    return Object.entries(cartMap)
      .map(([id, qty]) => {
        const product = productMap.get(id);
        if (!product) {
          return null;
        }

        const normalizedQty = Number(qty) || 0;

        return {
          ...product,
          qty: normalizedQty,
          subtotal: normalizedQty * product.price,
        };
      })
      .filter(Boolean);
  }, [cartMap, productMap]);

  const count = useMemo(() => items.reduce((acc, item) => acc + item.qty, 0), [items]);
  const total = useMemo(() => items.reduce((acc, item) => acc + item.subtotal, 0), [items]);

  function addItem(productId, amount = 1) {
    const product = productMap.get(productId);
    if (!product || product.isAvailable === false || product.isVisible === false) {
      return false;
    }

    setCartMap((prev) => {
      const currentQty = prev[productId] || 0;
      const qty = Math.max(0, Math.min(99, Math.floor(currentQty + amount)));
      if (qty === 0) {
        return prev;
      }

      return {
        ...prev,
        [productId]: qty,
      };
    });

    return true;
  }

  function decreaseItem(productId, amount = 1) {
    if (!productMap.has(productId)) {
      return;
    }

    setCartMap((prev) => {
      const currentQty = prev[productId] || 0;
      const qty = Math.max(0, Math.min(99, Math.floor(currentQty - amount)));
      if (qty === 0) {
        const { [productId]: _removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [productId]: qty,
      };
    });
  }

  function removeItem(productId) {
    setCartMap((prev) => {
      if (!prev[productId]) {
        return prev;
      }

      const { [productId]: _removed, ...rest } = prev;
      return rest;
    });
  }

  function clearCart() {
    setCartMap({});
  }

  const value = useMemo(
    () => ({
      items,
      count,
      total,
      addItem,
      decreaseItem,
      removeItem,
      clearCart,
    }),
    [items, count, total],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart precisa ser usado dentro de CartProvider.");
  }

  return context;
}
