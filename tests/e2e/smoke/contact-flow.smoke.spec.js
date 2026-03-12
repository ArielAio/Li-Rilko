import { test, expect } from "@playwright/test";
import { applyRuntimeMocks, getOpenedLinks } from "./runtime-mocks";

test.describe("Smoke: fluxo de atendimento", () => {
  test("modo blocked mantém WhatsApp indisponível", async ({ page }) => {
    await applyRuntimeMocks(page, {
      attendants: [],
    });

    await page.goto("/contato");

    const primaryBlockedLink = page.getByRole("main").getByRole("link", { name: "WhatsApp indisponível" });

    await expect(primaryBlockedLink).toBeVisible();
    await primaryBlockedLink.click();
    await expect(page.getByText("Nenhum atendente com número válido")).toBeVisible();

    const links = await getOpenedLinks(page);
    expect(links).toHaveLength(0);
  });

  test("modo direct abre WhatsApp sem picker", async ({ page }) => {
    await applyRuntimeMocks(page, {
      attendants: [{ name: "Ari", phone: "5517999991111" }],
    });

    await page.goto("/contato");

    await page.getByRole("link", { name: "Iniciar conversa no WhatsApp" }).click();
    await expect(page.getByText("Abrindo atendimento")).toBeVisible();

    const links = await getOpenedLinks(page);
    expect(links).toHaveLength(1);
    expect(links[0]).toContain("https://wa.me/5517999991111");
  });

  test("modo picker exige escolha de atendente antes de abrir WhatsApp", async ({ page }) => {
    await applyRuntimeMocks(page, {
      attendants: [
        { name: "Ari", phone: "5517999991111" },
        { name: "Siconeli", phone: "5517999992222" },
      ],
    });

    await page.goto("/contato");

    await page.getByRole("link", { name: "Iniciar conversa no WhatsApp" }).click();
    await expect(page.getByRole("dialog", { name: "Escolher atendente do WhatsApp" })).toBeVisible();

    await page.getByRole("button", { name: /Iniciar conversa/ }).first().click();

    const links = await getOpenedLinks(page);
    expect(links).toHaveLength(1);
    expect(links[0]).toContain("https://wa.me/");
  });
});
