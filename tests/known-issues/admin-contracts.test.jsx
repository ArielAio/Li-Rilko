import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createCatalogFixture } from "@/tests/fixtures/catalog.fixture";
import { CatalogProvider, useCatalog } from "@/components/providers/catalog-provider";

function AdminContractProbe() {
  const { attendants, categories, products, saveAttendants, saveCategories, removeProduct } = useCatalog();
  const [result, setResult] = useState("");

  return (
    <div>
      <p data-testid="result">{result}</p>
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
        call-save-categories
      </button>
      <button
        type="button"
        onClick={async () => {
          const next = await removeProduct(products[0]?.id);
          setResult(JSON.stringify(next));
        }}
      >
        call-remove-product
      </button>
      <button
        type="button"
        onClick={async () => {
          const next = await saveAttendants(attendants);
          setResult(JSON.stringify(next));
        }}
      >
        call-save-attendants
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

describe("KNOWN ISSUE: contratos do admin vs provider", () => {
  it("saveCategories deveria retornar { ok: true } para o manager", async () => {
    const catalog = createCatalogFixture();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeFetchResponse({ catalog })));

    render(
      <CatalogProvider initialCatalog={catalog}>
        <AdminContractProbe />
      </CatalogProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "call-save-categories" }));

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('{"ok":true}');
    });
  });

  it("removeProduct deveria retornar objeto com status para o manager", async () => {
    const catalog = createCatalogFixture((draft) => {
      draft.products.shift();
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeFetchResponse({ catalog })));

    render(
      <CatalogProvider initialCatalog={createCatalogFixture()}>
        <AdminContractProbe />
      </CatalogProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "call-remove-product" }));

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('{"ok":true}');
    });
  });

  it("saveAttendants deveria retornar objeto com status para o manager", async () => {
    const catalog = createCatalogFixture();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeFetchResponse({ catalog })));

    render(
      <CatalogProvider initialCatalog={catalog}>
        <AdminContractProbe />
      </CatalogProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "call-save-attendants" }));

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('{"ok":true}');
    });
  });
});
