import { test, expect } from "@playwright/test";
import { applyRuntimeMocks, getOpenedLinks } from "./runtime-mocks";

test.describe("Smoke: jornada de compra", () => {
  test("adiciona item, ajusta quantidade e finaliza no WhatsApp", async ({ page }) => {
    await applyRuntimeMocks(page, {
      attendants: [{ name: "Ari", phone: "5517999991111" }],
    });

    await page.goto("/catalogo");

    await page.getByRole("button", { name: /Adicionar/ }).first().click();
    await expect(page.getByText(/No carrinho:\s*1/i).first()).toBeVisible();
    await page.getByRole("link", { name: "Ir para o carrinho" }).first().click();

    await expect(page.getByRole("heading", { name: "Seu carrinho" })).toBeVisible();

    await page.getByRole("button", { name: /Aumentar/ }).first().click();
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
