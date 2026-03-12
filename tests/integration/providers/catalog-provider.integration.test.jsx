import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CatalogProvider, useCatalog } from "@/components/providers/catalog-provider";
import { CATALOG_STORAGE_KEY } from "@/tests/fixtures/catalog.fixture";

function CatalogProbe() {
  const { isHydrated, categories, products, addProduct } = useCatalog();
  const [lastResult, setLastResult] = useState("");

  return (
    <div>
      <p data-testid="hydrated">{isHydrated ? "yes" : "no"}</p>
      <p data-testid="categories-count">{categories.length}</p>
      <p data-testid="products-count">{products.length}</p>
      <p data-testid="last-result">{lastResult}</p>

      <button
        type="button"
        onClick={() => {
          const result = addProduct({
            name: "",
            category: "",
            sub: "",
          });
          setLastResult(JSON.stringify(result));
        }}
      >
        add-invalid
      </button>

      <button
        type="button"
        onClick={() => {
          const result = addProduct({
            name: "Produto de Teste",
            category: "Smartphones",
            sub: "iPhone",
            priceCash: 1999,
            priceInstallment: 2099,
          });
          setLastResult(JSON.stringify(result));
        }}
      >
        add-valid
      </button>
    </div>
  );
}

describe("CatalogProvider integration", () => {
  it("faz fallback para catálogo padrão quando storage é inválido", async () => {
    window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify({ categories: [] }));

    render(
      <CatalogProvider>
        <CatalogProbe />
      </CatalogProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("yes"));
    expect(Number(screen.getByTestId("categories-count").textContent)).toBeGreaterThan(0);
    expect(Number(screen.getByTestId("products-count").textContent)).toBeGreaterThan(0);
  });

  it("retorna erro ao tentar criar produto sem campos obrigatórios", async () => {
    render(
      <CatalogProvider>
        <CatalogProbe />
      </CatalogProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("yes"));

    fireEvent.click(screen.getByRole("button", { name: "add-invalid" }));

    expect(screen.getByTestId("last-result").textContent).toContain("\"ok\":false");
    expect(screen.getByTestId("last-result").textContent).toContain("obrigatório");
  });

  it("cria produto válido e persiste no storage", async () => {
    render(
      <CatalogProvider>
        <CatalogProbe />
      </CatalogProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("yes"));
    const initialCount = Number(screen.getByTestId("products-count").textContent);

    fireEvent.click(screen.getByRole("button", { name: "add-valid" }));

    await waitFor(() => {
      const resultText = screen.getByTestId("last-result").textContent || "";
      expect(resultText).toContain("\"ok\":true");
    });

    await waitFor(() => {
      const nextCount = Number(screen.getByTestId("products-count").textContent);
      expect(nextCount).toBe(initialCount + 1);
    });

    await waitFor(() => {
      const serialized = window.localStorage.getItem(CATALOG_STORAGE_KEY) || "{}";
      const parsed = JSON.parse(serialized);
      expect(Array.isArray(parsed.products)).toBe(true);
      expect(parsed.products.length).toBeGreaterThan(initialCount);
    });
  });
});
