import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CatalogProvider, useCatalog } from "@/components/providers/catalog-provider";

function ContractProbe() {
  const {
    products,
    categories,
    contactChannels,
    saveCategories,
    removeProduct,
    resetCatalog,
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
        onClick={() => {
          const next = saveCategories(categories);
          setResult(JSON.stringify(next));
        }}
      >
        save-categories-success
      </button>

      <button
        type="button"
        onClick={() => {
          const next = saveCategories("invalid");
          setResult(JSON.stringify(next));
        }}
      >
        save-categories-invalid
      </button>

      <button
        type="button"
        onClick={() => {
          const next = removeProduct(firstProduct?.id);
          setResult(JSON.stringify(next));
        }}
      >
        remove-product-success
      </button>

      <button
        type="button"
        onClick={() => {
          const next = removeProduct("missing-product");
          setResult(JSON.stringify(next));
        }}
      >
        remove-product-missing
      </button>

      <button
        type="button"
        onClick={() => {
          const next = resetCatalog();
          setResult(JSON.stringify(next));
        }}
      >
        reset-catalog-success
      </button>

      <button
        type="button"
        onClick={() => {
          const next = toggleProductVisibility(firstProduct?.id);
          setResult(JSON.stringify(next));
        }}
      >
        toggle-visibility-success
      </button>

      <button
        type="button"
        onClick={() => {
          const next = toggleProductVisibility("missing-product");
          setResult(JSON.stringify(next));
        }}
      >
        toggle-visibility-missing
      </button>

      <button
        type="button"
        onClick={() => {
          const next = toggleProductAvailability(firstProduct?.id);
          setResult(JSON.stringify(next));
        }}
      >
        toggle-availability-success
      </button>

      <button
        type="button"
        onClick={() => {
          const next = toggleProductAvailability("missing-product");
          setResult(JSON.stringify(next));
        }}
      >
        toggle-availability-missing
      </button>

      <button
        type="button"
        onClick={() => {
          const next = saveContactChannels(contactChannels);
          setResult(JSON.stringify(next));
        }}
      >
        save-contact-channels-success
      </button>

      <button
        type="button"
        onClick={() => {
          const next = saveSiteSettings({ whatsappIntro: "novo intro" });
          setResult(JSON.stringify(next));
        }}
      >
        save-site-settings-success
      </button>
    </div>
  );
}

describe("CatalogProvider admin mutator contract", () => {
  it("retorna { ok: true } em saveCategories sucesso", async () => {
    render(
      <CatalogProvider>
        <ContractProbe />
      </CatalogProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "save-categories-success" }));

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('{"ok":true}');
    });
  });

  it("retorna erro em saveCategories inválido", async () => {
    render(
      <CatalogProvider>
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
    render(
      <CatalogProvider>
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
    render(
      <CatalogProvider>
        <ContractProbe />
      </CatalogProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "remove-product-missing" }));

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('"ok":false');
      expect(screen.getByTestId("result")).toHaveTextContent("Produto não encontrado");
    });
  });

  it("retorna { ok: true } em resetCatalog", async () => {
    render(
      <CatalogProvider>
        <ContractProbe />
      </CatalogProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "reset-catalog-success" }));

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent('{"ok":true}');
    });
  });

  it("retorna { ok: true } ao alternar visibilidade e disponibilidade", async () => {
    render(
      <CatalogProvider>
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
      <CatalogProvider>
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

  it("retorna { ok: true } em saveContactChannels e saveSiteSettings", async () => {
    render(
      <CatalogProvider>
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
  });
});
