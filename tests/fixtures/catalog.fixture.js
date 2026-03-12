import { createDefaultCatalog } from "@/lib/catalog-data";

export const CATALOG_STORAGE_KEY = "li-rilko-catalog-v1";
export const CART_STORAGE_KEY = "li-rilko-cart-v1";

export function createCatalogFixture(mutator) {
  const catalog = createDefaultCatalog();

  if (typeof mutator === "function") {
    mutator(catalog);
  }

  return catalog;
}

export function persistCatalog(catalog) {
  window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalog));
}

export function persistCart(cartMap) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartMap));
}
