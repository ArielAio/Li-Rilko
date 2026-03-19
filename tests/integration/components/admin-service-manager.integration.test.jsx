import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useCatalogMock, useToastMock, showToastMock } = vi.hoisted(() => ({
  useCatalogMock: vi.fn(),
  useToastMock: vi.fn(),
  showToastMock: vi.fn(),
}));

vi.mock("@/components/providers/catalog-provider", () => ({
  useCatalog: useCatalogMock,
}));

vi.mock("@/components/providers/toast-provider", () => ({
  useToast: useToastMock,
}));

import AdminServiceManager from "@/components/admin/managers/admin-service-manager";

describe("AdminServiceManager attendants editable mode", () => {
  beforeEach(() => {
    useCatalogMock.mockReturnValue({
      attendants: [{ id: "att-1", name: "Ari", phone: "5517999991111" }],
      contactChannels: [],
      refreshAdminCatalog: vi.fn(),
      saveAttendants: vi.fn(),
      saveContactChannels: vi.fn(),
      siteSettings: {
        whatsappIntro: "",
        whatsappFloatingMessage: "",
      },
      saveSiteSettings: vi.fn(),
    });

    useToastMock.mockReturnValue({
      showToast: showToastMock,
    });
  });

  it("exibe atendentes carregados e mantém edição habilitada", async () => {
    render(<AdminServiceManager />);

    expect(screen.getByDisplayValue("Ari")).toBeEnabled();
    expect(screen.queryByText(/migração para o supabase/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar atendente" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Salvar atendentes" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Subir" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Descer" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remover" })).toBeDisabled();
  });
});
