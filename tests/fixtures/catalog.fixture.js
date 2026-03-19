import { createDefaultAppCatalog } from "@/lib/app-catalog-data";

export const CART_STORAGE_KEY = "li-rilko-cart-v1";

export function createCatalogFixture(mutator) {
  const catalog = createDefaultAppCatalog();

  if (typeof mutator === "function") {
    mutator(catalog);
  }

  return catalog;
}

export function persistCatalog(catalog) {
  window.__LI_RILKO_TEST_PUBLIC_CATALOG__ = catalog;
}

export function persistCart(cartMap) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartMap));
}
