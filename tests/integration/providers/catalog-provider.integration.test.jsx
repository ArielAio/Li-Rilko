import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createCatalogFixture } from "@/tests/fixtures/catalog.fixture";
import { CatalogProvider, useCatalog } from "@/components/providers/catalog-provider";

function CatalogProbe() {
  const { isHydrated, categories, products, attendants, addProduct } = useCatalog();
  const [lastResult, setLastResult] = useState("");

  return (
    <div>
      <p data-testid="hydrated">{isHydrated ? "yes" : "no"}</p>
      <p data-testid="categories-count">{categories.length}</p>
      <p data-testid="products-count">{products.length}</p>
      <p data-testid="attendants-count">{attendants.length}</p>
      <p data-testid="last-result">{lastResult}</p>

      <button
        type="button"
        onClick={async () => {
          const result = await addProduct({
            name: "",
            categoryId: "",
            subcategoryId: "",
            imageItems: [],
          });
          setLastResult(JSON.stringify(result));
        }}
      >
        add-invalid
      </button>

      <button
        type="button"
        onClick={async () => {
          const result = await addProduct({
            id: "new-product-id",
            name: "Produto de Teste",
            categoryId: "category-1",
            subcategoryId: "sub-1",
            priceCash: 1999,
            priceInstallment: 2099,
            imageItems: [{ id: "img-1", storagePath: "products/new-product-id/image-1.webp" }],
          });
          setLastResult(JSON.stringify(result));
        }}
      >
        add-valid
      </button>
    </div>
  );
}

function makeFetchResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  };
}

describe("CatalogProvider integration", () => {
  it("usa o snapshot inicial vindo do servidor", async () => {
    const catalog = createCatalogFixture();

    render(
      <CatalogProvider initialCatalog={catalog}>
        <CatalogProbe />
      </CatalogProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("yes"));
    expect(Number(screen.getByTestId("categories-count").textContent)).toBeGreaterThan(0);
    expect(Number(screen.getByTestId("products-count").textContent)).toBeGreaterThan(0);
  });

  it("respeita lista vazia de atendentes no snapshot recebido", async () => {
    const catalog = createCatalogFixture((draft) => {
      draft.attendants = [];
    });

    render(
      <CatalogProvider initialCatalog={catalog}>
        <CatalogProbe />
      </CatalogProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("yes"));
    expect(screen.getByTestId("attendants-count")).toHaveTextContent("0");
  });

  it("retorna erro ao tentar criar produto sem campos obrigatórios", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeFetchResponse({ error: "Nome, categoria e subcategoria são obrigatórios." }, 400),
      ),
    );

    render(
      <CatalogProvider initialCatalog={createCatalogFixture()}>
        <CatalogProbe />
      </CatalogProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("yes"));

    fireEvent.click(screen.getByRole("button", { name: "add-invalid" }));

    await waitFor(() => {
      expect(screen.getByTestId("last-result").textContent).toContain('"ok":false');
      expect(screen.getByTestId("last-result").textContent).toContain("obrigatórios");
    });
  });

  it("cria produto válido e atualiza o provider com o catálogo retornado pela API", async () => {
    const initialCatalog = createCatalogFixture();
    const nextCatalog = createCatalogFixture((draft) => {
      draft.products.unshift({
        id: "new-product-id",
        name: "Produto de Teste",
        category: "Smartphones",
        sub: "iPhone",
        categoryId: "category-1",
        subcategoryId: "sub-1",
        price: 2099,
        priceCash: 1999,
        priceInstallment: 2099,
        oldPrice: 2099,
        badge: "Destaque",
        shortDescription: "Produto de teste",
        highlights: ["Atendimento via WhatsApp"],
        image: "https://example.com/image-1.webp",
        images: ["https://example.com/image-1.webp"],
        imageItems: [
          {
            id: "img-1",
            storagePath: "products/new-product-id/image-1.webp",
            publicUrl: "https://example.com/image-1.webp",
            sortOrder: 0,
          },
        ],
        isVisible: true,
        isAvailable: true,
      });
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeFetchResponse({
          catalog: nextCatalog,
          productId: "new-product-id",
        }),
      ),
    );

    render(
      <CatalogProvider initialCatalog={initialCatalog}>
        <CatalogProbe />
      </CatalogProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("yes"));
    const initialCount = Number(screen.getByTestId("products-count").textContent);

    fireEvent.click(screen.getByRole("button", { name: "add-valid" }));

    await waitFor(() => {
      const resultText = screen.getByTestId("last-result").textContent || "";
      expect(resultText).toContain('"ok":true');
      expect(resultText).toContain("new-product-id");
    });

    await waitFor(() => {
      const nextCount = Number(screen.getByTestId("products-count").textContent);
      expect(nextCount).toBe(initialCount + 1);
    });
  });
});
