import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createCatalogFixture } from "@/tests/fixtures/catalog.fixture";
import { CatalogProvider, useCatalog } from "@/components/providers/catalog-provider";

function ContractProbe() {
  const {
    attendants,
    categories,
    contactChannels,
    products,
    saveAttendants,
    saveCategories,
    removeProduct,
    toggleProductVisibility,
    toggleProductAvailability,
    saveContactChannels,
    saveSiteSettings,
  } = useCatalog();

  const [result, setResult] = useState("idle");
  const firstProduct = products[0] || null;

  return (
    <div>
      <p data-testid="result">{result}</p>
      <p data-testid="products-count">{products.length}</p>
      <p data-testid="first-visible">{String(firstProduct?.isVisible ?? "none")}</p>
      <p data-testid="first-available">{String(firstProduct?.isAvailable ?? "none")}</p>

      <button
        type="button"
        onClick={async () => {
          const next = await saveCategories(
            categories.map((category, index) => ({
              id: `category-${index + 1}`,
              name: category.name,
              subs: category.subs.map((sub, subIndex) => ({
                id: `category-${index + 1}-sub-${subIndex + 1}`,
                name: sub,
              })),
            })),
          );
          setResult(JSON.stringify(next));
        }}
      >
        save-categories-success
      </button>

      <button
        type="button"
        onClick={async () => {
          const next = await saveCategories("invalid");
          setResult(JSON.stringify(next));
        }}
      >
        save-categories-invalid
      </button>

      <button
        type="button"
        onClick={async () => {
          const next = await removeProduct(firstProduct?.id);
          setResult(JSON.stringify(next));
        }}
      >
        remove-product-success
      </button>

      <button
        type="button"
        onClick={async () => {
          const next = await removeProduct("missing-product");
          setResult(JSON.stringify(next));
        }}
      >
        remove-product-missing
      </button>

      <button
        type="button"
        onClick={async () => {
          const next = await toggleProductVisibility(firstProduct?.id);
          setResult(JSON.stringify(next));
        }}
      >
        toggle-visibility-success
      </button>

      <button
        type="button"
        onClick={async () => {
          const next = await toggleProductVisibility("missing-product");
          setResult(JSON.stringify(next));
        }}
      >
        toggle-visibility-missing
      </button>

      <button
        type="button"
        onClick={async () => {
          const next = await toggleProductAvailability(firstProduct?.id);
          setResult(JSON.stringify(next));
        }}
      >
        toggle-availability-success
      </button>

      <button
        type="button"
        onClick={async () => {
          const next = await toggleProductAvailability("missing-product");
          setResult(JSON.stringify(next));
        }}
      >
        toggle-availability-missing
      </button>

      <button
        type="button"
        onClick={async () => {
          const next = await saveContactChannels(contactChannels);
          setResult(JSON.stringify(next));
        }}
      >
        save-contact-channels-success
      </button>

      <button
        type="button"
        onClick={async () => {
          const next = await saveSiteSettings({ whatsappIntro: "novo intro" });
          setResult(JSON.stringify(next));
        }}
      >
        save-site-settings-success
      </button>

      <button
        type="button"
        onClick={async () => {
          const next = await saveAttendants(attendants);
          setResult(JSON.stringify(next));
        }}
      >
        save-attendants-success
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

describe("CatalogProvider admin mutator contract", () => {
  it("retorna { ok: true } em saveCategories sucesso", async () => {
    const catalog = createCatalogFixture();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeFetchResponse({ catalog })));

    render(
      <CatalogProvider initialCatalog={catalog}>
        <ContractProbe />
      </CatalogProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "save-categories-success" }));

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('{"ok":true}');
    });
  });

  it("retorna erro em saveCategories inválido", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeFetchResponse({ error: "Formato de categorias inválido." }, 400),
      ),
    );

    render(
      <CatalogProvider initialCatalog={createCatalogFixture()}>
        <ContractProbe />
      </CatalogProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "save-categories-invalid" }));

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('"ok":false');
      expect(screen.getByTestId("result")).toHaveTextContent("Formato de categorias inválido");
    });
  });

  it("retorna { ok: true } em removeProduct e diminui lista", async () => {
    const initialCatalog = createCatalogFixture();
    const nextCatalog = createCatalogFixture((draft) => {
      draft.products.shift();
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeFetchResponse({ catalog: nextCatalog })));

    render(
      <CatalogProvider initialCatalog={initialCatalog}>
        <ContractProbe />
      </CatalogProvider>,
    );

    const before = Number(screen.getByTestId("products-count").textContent);

    fireEvent.click(screen.getByRole("button", { name: "remove-product-success" }));

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('{"ok":true}');
      expect(Number(screen.getByTestId("products-count").textContent)).toBe(before - 1);
    });
  });

  it("retorna erro em removeProduct ausente", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeFetchResponse({ error: "Produto não encontrado." }, 400),
      ),
    );

    render(
      <CatalogProvider initialCatalog={createCatalogFixture()}>
        <ContractProbe />
      </CatalogProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "remove-product-missing" }));

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('"ok":false');
      expect(screen.getByTestId("result")).toHaveTextContent("Produto não encontrado");
    });
  });

  it("retorna { ok: true } ao alternar visibilidade e disponibilidade", async () => {
    const initialCatalog = createCatalogFixture();
    const hiddenCatalog = createCatalogFixture((draft) => {
      draft.products[0].isVisible = false;
    });
    const unavailableCatalog = createCatalogFixture((draft) => {
      draft.products[0].isAvailable = false;
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeFetchResponse({ catalog: hiddenCatalog }))
      .mockResolvedValueOnce(makeFetchResponse({ catalog: unavailableCatalog }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CatalogProvider initialCatalog={initialCatalog}>
        <ContractProbe />
      </CatalogProvider>,
    );

    const visibleBefore = screen.getByTestId("first-visible").textContent;
    const availableBefore = screen.getByTestId("first-available").textContent;

    fireEvent.click(screen.getByRole("button", { name: "toggle-visibility-success" }));
    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('{"ok":true}');
      expect(screen.getByTestId("first-visible").textContent).not.toBe(visibleBefore);
    });

    fireEvent.click(screen.getByRole("button", { name: "toggle-availability-success" }));
    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('{"ok":true}');
      expect(screen.getByTestId("first-available").textContent).not.toBe(availableBefore);
    });
  });

  it("retorna erro ao alternar produto ausente", async () => {
    render(
      <CatalogProvider initialCatalog={createCatalogFixture()}>
        <ContractProbe />
      </CatalogProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "toggle-visibility-missing" }));
    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('"ok":false');
      expect(screen.getByTestId("result")).toHaveTextContent("Produto não encontrado");
    });

    fireEvent.click(screen.getByRole("button", { name: "toggle-availability-missing" }));
    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('"ok":false');
      expect(screen.getByTestId("result")).toHaveTextContent("Produto não encontrado");
    });
  });

  it("retorna { ok: true } em saveContactChannels, saveSiteSettings e saveAttendants", async () => {
    const catalog = createCatalogFixture();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeFetchResponse({ catalog }))
      .mockResolvedValueOnce(makeFetchResponse({ catalog }))
      .mockResolvedValueOnce(makeFetchResponse({ catalog }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CatalogProvider initialCatalog={catalog}>
        <ContractProbe />
      </CatalogProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "save-contact-channels-success" }));
    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('{"ok":true}');
    });

    fireEvent.click(screen.getByRole("button", { name: "save-site-settings-success" }));
    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('{"ok":true}');
    });

    fireEvent.click(screen.getByRole("button", { name: "save-attendants-success" }));
    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('{"ok":true}');
    });
  });
});
