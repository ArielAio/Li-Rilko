import { test, expect } from "@playwright/test";
import { applyRuntimeMocks, getOpenedLinks } from "./runtime-mocks";

const CART_STORAGE_KEY = "li-rilko-cart-v1";

async function readCartCount(page) {
  return page.evaluate((storageKey) => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
      if (!parsed || typeof parsed !== "object") {
        return 0;
      }

      return Object.values(parsed).reduce((acc, qty) => {
        const parsedQty = Number(qty);
        if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
          return acc;
        }
        return acc + Math.floor(parsedQty);
      }, 0);
    } catch {
      return 0;
    }
  }, CART_STORAGE_KEY);
}

async function addFirstCatalogItemToCart(page) {
  const addButton = page.getByRole("button", { name: /Adicionar/ }).first();
  await expect(addButton).toBeVisible();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    await addButton.click();
    const count = await readCartCount(page);

    if (count > 0) {
      return;
    }

    await page.waitForTimeout(250);
  }

  throw new Error("Não foi possível adicionar item ao carrinho no catálogo.");
}

test.describe("Smoke: jornada de compra", () => {
  test("adiciona item, ajusta quantidade e finaliza no WhatsApp", async ({ page }) => {
    await applyRuntimeMocks(page, {
      attendants: [{ name: "Ari", phone: "5517999991111" }],
    });

    await page.goto("/catalogo");

    await addFirstCatalogItemToCart(page);

    // Navigate via client-side link to preserve React context state (productMap)
    // page.goto() causes a full reload which creates a race with catalog hydration
    await page.getByRole("link", { name: "Carrinho" }).first().click();
    await page.waitForURL("**/carrinho");

    await expect(page.getByRole("heading", { name: "Revise seu Pedido" })).toBeVisible();

    // Wait for cart items to render (they depend on both localStorage AND productMap)
    const increaseButton = page.getByRole("button", { name: "Aumentar quantidade" }).first();
    await expect(increaseButton).toBeVisible({ timeout: 15000 });
    await increaseButton.click();
    await page.getByRole("button", { name: /Finalizar Compra/ }).click();

    const links = await getOpenedLinks(page);
    expect(links).toHaveLength(1);

    const waUrl = new URL(links[0]);
    const text = decodeURIComponent(waUrl.searchParams.get("text") || "");

    expect(waUrl.hostname).toBe("wa.me");
    expect(text).toContain("Total à vista");
    expect(text).toContain("Total a prazo");
  });

  test("bloqueia finalização quando carrinho está vazio", async ({ page }) => {
    await applyRuntimeMocks(page, {
      attendants: [{ name: "Ari", phone: "5517999991111" }],
    });

    await page.goto("/carrinho");

    // When the cart is empty, the checkout button is not rendered at all
    await expect(page.getByText("Seu carrinho está vazio")).toBeVisible();
    await expect(page.getByRole("button", { name: /Finalizar Compra/ })).not.toBeVisible();

    const links = await getOpenedLinks(page);
    expect(links).toHaveLength(0);
  });
});
