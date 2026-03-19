import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  isAdminSessionValidMock,
  getAdminBootstrapSnapshotMock,
  saveAttendantsInCatalogMock,
  CatalogRepositoryValidationError,
  CatalogRepositoryConfigError,
} = vi.hoisted(() => ({
  isAdminSessionValidMock: vi.fn(),
  getAdminBootstrapSnapshotMock: vi.fn(),
  saveAttendantsInCatalogMock: vi.fn(),
  CatalogRepositoryValidationError: class CatalogRepositoryValidationError extends Error {},
  CatalogRepositoryConfigError: class CatalogRepositoryConfigError extends Error {},
}));

vi.mock("@/lib/admin-auth", () => ({
  ADMIN_SESSION_COOKIE: "li_rilko_admin_session",
  isAdminSessionValid: isAdminSessionValidMock,
}));

vi.mock("@/lib/catalog-repository", () => ({
  CatalogRepositoryValidationError,
  CatalogRepositoryConfigError,
  getAdminBootstrapSnapshot: getAdminBootstrapSnapshotMock,
  saveAttendantsInCatalog: saveAttendantsInCatalogMock,
}));

import { GET, PUT } from "@/app/api/admin/attendants/route";

function makeRequest(method, body) {
  return new NextRequest("http://localhost:3000/api/admin/attendants", {
    method,
    headers: {
      cookie: "li_rilko_admin_session=valid-token",
      "content-type": "application/json",
    },
    body,
  });
}

describe("/api/admin/attendants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 sem autenticação válida", async () => {
    isAdminSessionValidMock.mockReturnValue(false);

    const response = await GET(makeRequest("GET"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toContain("Acesso negado");
  });

  it("retorna atendentes no GET autenticado", async () => {
    isAdminSessionValidMock.mockReturnValue(true);
    getAdminBootstrapSnapshotMock.mockResolvedValue({
      attendants: [{ id: "att-1", name: "Ari", phone: "5517999991111" }],
    });

    const response = await GET(makeRequest("GET"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.attendants).toHaveLength(1);
  });

  it("retorna 200 no PUT autenticado", async () => {
    isAdminSessionValidMock.mockReturnValue(true);
    saveAttendantsInCatalogMock.mockResolvedValue({
      catalog: {
        attendants: [{ id: "att-1", name: "Ari", phone: "5517999991111" }],
      },
    });

    const response = await PUT(
      makeRequest(
        "PUT",
        JSON.stringify({
          attendants: [{ id: "att-1", name: "Ari", phone: "5517999991111" }],
        }),
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.attendants).toHaveLength(1);
  });

  it("retorna 400 para erro de validação", async () => {
    isAdminSessionValidMock.mockReturnValue(true);
    saveAttendantsInCatalogMock.mockRejectedValue(new CatalogRepositoryValidationError("Cadastre pelo menos 1 atendente."));

    const response = await PUT(makeRequest("PUT", JSON.stringify({ attendants: [] })));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Cadastre pelo menos 1 atendente");
  });

  it("retorna 503 para erro de configuração", async () => {
    isAdminSessionValidMock.mockReturnValue(true);
    saveAttendantsInCatalogMock.mockRejectedValue(new CatalogRepositoryConfigError("Supabase não configurado."));

    const response = await PUT(makeRequest("PUT", JSON.stringify({ attendants: [] })));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error).toContain("Supabase não configurado");
  });

  it("retorna 500 no GET quando a leitura falha", async () => {
    isAdminSessionValidMock.mockReturnValue(true);
    getAdminBootstrapSnapshotMock.mockRejectedValue(new Error("boom"));

    const response = await GET(makeRequest("GET"));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toContain("Não foi possível carregar atendentes");
  });
});
