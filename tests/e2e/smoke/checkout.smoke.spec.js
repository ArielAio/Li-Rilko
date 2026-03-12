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
    await page.getByRole("link", { name: "Ir para o carrinho" }).first().click();

    await expect(page.getByRole("heading", { name: "Seu carrinho" })).toBeVisible();

    const increaseButton = page.getByRole("button", { name: /Aumentar/ }).first();
    await expect(increaseButton).toBeVisible();
    await increaseButton.click();
    await page.getByRole("link", { name: "Finalizar no WhatsApp" }).click();

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
    await page.getByRole("link", { name: "Finalizar no WhatsApp" }).click();

    await expect(page.getByText("Carrinho vazio")).toBeVisible();

    const links = await getOpenedLinks(page);
    expect(links).toHaveLength(0);
  });
});
