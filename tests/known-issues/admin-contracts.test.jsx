import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CatalogProvider, useCatalog } from "@/components/providers/catalog-provider";

function AdminContractProbe() {
  const { categories, products, saveCategories, removeProduct, resetCatalog } = useCatalog();
  const [result, setResult] = useState("");

  return (
    <div>
      <p data-testid="result">{result}</p>
      <button
        type="button"
        onClick={() => {
          const next = saveCategories(categories);
          setResult(next === undefined ? "__undefined__" : JSON.stringify(next));
        }}
      >
        call-save-categories
      </button>
      <button
        type="button"
        onClick={() => {
          const next = removeProduct(products[0]?.id);
          setResult(next === undefined ? "__undefined__" : JSON.stringify(next));
        }}
      >
        call-remove-product
      </button>
      <button
        type="button"
        onClick={() => {
          const next = resetCatalog();
          setResult(next === undefined ? "__undefined__" : JSON.stringify(next));
        }}
      >
        call-reset-catalog
      </button>
    </div>
  );
}

describe("KNOWN ISSUE: contratos do admin vs provider", () => {
  it("saveCategories deveria retornar { ok: true } para o manager", async () => {
    render(
      <CatalogProvider>
        <AdminContractProbe />
      </CatalogProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "call-save-categories" }));

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('{"ok":true}');
    });
  });

  it("removeProduct deveria retornar objeto com status para o manager", async () => {
    render(
      <CatalogProvider>
        <AdminContractProbe />
      </CatalogProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "call-remove-product" }));

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('{"ok":true}');
    });
  });

  it("resetCatalog deveria retornar objeto com status para o manager", async () => {
    render(
      <CatalogProvider>
        <AdminContractProbe />
      </CatalogProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "call-reset-catalog" }));

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('{"ok":true}');
    });
  });
});
