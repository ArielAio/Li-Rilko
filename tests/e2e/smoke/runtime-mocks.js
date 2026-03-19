const CART_STORAGE_KEY = "li-rilko-cart-v1";

export async function applyRuntimeMocks(page, { attendants = [], cartMap = {}, catalog = null } = {}) {
  await page.addInitScript(
    ({ attendants: runtimeAttendants, cartMap: runtimeCartMap, catalog: runtimeCatalog, keys }) => {
      window.localStorage.clear();

      if (runtimeCatalog) {
        window.__LI_RILKO_TEST_PUBLIC_CATALOG__ = runtimeCatalog;
      }

      window.localStorage.setItem(keys.cart, JSON.stringify(runtimeCartMap || {}));

      window.__LI_RILKO_TEST_ATTENDANTS__ = runtimeAttendants;
      window.__LI_RILKO_OPENED_LINKS__ = [];
      window.open = (url) => {
        window.__LI_RILKO_OPENED_LINKS__.push(String(url));
        return {};
      };
    },
    {
      attendants,
      cartMap,
      catalog,
      keys: {
        cart: CART_STORAGE_KEY,
      },
    },
  );
}

export async function getOpenedLinks(page) {
  return page.evaluate(() => window.__LI_RILKO_OPENED_LINKS__ || []);
}
