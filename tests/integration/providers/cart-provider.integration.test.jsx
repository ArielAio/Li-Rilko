import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CartProvider, useCart } from "@/components/providers/cart-provider";
import { CatalogProvider, useCatalog } from "@/components/providers/catalog-provider";
import {
  CART_STORAGE_KEY,
  createCatalogFixture,
  persistCatalog,
  persistCart,
} from "@/tests/fixtures/catalog.fixture";

function ProvidersHarness({ children }) {
  return (
    <CatalogProvider>
      <CartProvider>{children}</CartProvider>
    </CatalogProvider>
  );
}

function CartProbe({ targetProductId }) {
  const { isHydrated } = useCatalog();
  const { count, items, addItem, getItemQty } = useCart();
  const [lastAction, setLastAction] = useState("idle");

  return (
    <div>
      <p data-testid="hydrated">{isHydrated ? "yes" : "no"}</p>
      <p data-testid="count">{count}</p>
      <p data-testid="items">{items.map((item) => `${item.id}:${item.qty}`).join(",")}</p>
      <p data-testid="target-qty">{getItemQty(targetProductId)}</p>
      <p data-testid="last-action">{lastAction}</p>
      <button
        type="button"
        onClick={() => {
          const added = addItem(targetProductId, 1);
          setLastAction(added ? "added" : "blocked");
        }}
      >
        add-one
      </button>
      <button
        type="button"
        onClick={() => {
          const added = addItem(targetProductId, 150);
          setLastAction(added ? "added" : "blocked");
        }}
      >
        add-many
      </button>
    </div>
  );
}

describe("CartProvider integration", () => {
  it("hidrata e sanitiza o carrinho com base no catálogo", async () => {
    const catalog = createCatalogFixture();
    const validId = catalog.products[0].id;
    const invalidId = "produto-inexistente";

    persistCatalog(catalog);
    persistCart({
      [validId]: 2,
      [invalidId]: 5,
      [catalog.products[1].id]: 0,
    });

    render(
      <ProvidersHarness>
        <CartProbe targetProductId={validId} />
      </ProvidersHarness>,
    );

    await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("yes"));
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("2"));

    expect(screen.getByTestId("items")).toHaveTextContent(`${validId}:2`);
    expect(screen.getByTestId("items")).not.toHaveTextContent(invalidId);

    await waitFor(() => {
      const serialized = window.localStorage.getItem(CART_STORAGE_KEY) || "{}";
      expect(JSON.parse(serialized)).toEqual({ [validId]: 2 });
    });
  });

  it("bloqueia adição quando produto está indisponível", async () => {
    const catalog = createCatalogFixture((draft) => {
      draft.products[0].isAvailable = false;
    });
    const targetProductId = catalog.products[0].id;

    persistCatalog(catalog);
    persistCart({});

    render(
      <ProvidersHarness>
        <CartProbe targetProductId={targetProductId} />
      </ProvidersHarness>,
    );

    await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("yes"));

    fireEvent.click(screen.getByRole("button", { name: "add-one" }));

    expect(screen.getByTestId("last-action")).toHaveTextContent("blocked");
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("aplica limite máximo de quantidade (99) e persiste", async () => {
    const catalog = createCatalogFixture();
    const targetProductId = catalog.products[0].id;

    persistCatalog(catalog);
    persistCart({});

    render(
      <ProvidersHarness>
        <CartProbe targetProductId={targetProductId} />
      </ProvidersHarness>,
    );

    await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("yes"));

    fireEvent.click(screen.getByRole("button", { name: "add-many" }));
    fireEvent.click(screen.getByRole("button", { name: "add-one" }));

    await waitFor(() => expect(screen.getByTestId("target-qty")).toHaveTextContent("99"));

    await waitFor(() => {
      const serialized = window.localStorage.getItem(CART_STORAGE_KEY) || "{}";
      expect(JSON.parse(serialized)[targetProductId]).toBe(99);
    });
  });

  it("mantém carrinho após remount (persistência localStorage)", async () => {
    const catalog = createCatalogFixture();
    const targetProductId = catalog.products[0].id;

    persistCatalog(catalog);
    persistCart({});

    const firstRender = render(
      <ProvidersHarness>
        <CartProbe targetProductId={targetProductId} />
      </ProvidersHarness>,
    );

    await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("yes"));

    fireEvent.click(screen.getByRole("button", { name: "add-one" }));
    fireEvent.click(screen.getByRole("button", { name: "add-one" }));
    fireEvent.click(screen.getByRole("button", { name: "add-one" }));

    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("3"));

    firstRender.unmount();

    render(
      <ProvidersHarness>
        <CartProbe targetProductId={targetProductId} />
      </ProvidersHarness>,
    );

    await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("yes"));
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("3"));
  });
});
