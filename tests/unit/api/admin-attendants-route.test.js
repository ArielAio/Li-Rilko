import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  isAdminSessionValidMock,
  readAttendantsFromRepositoryFileMock,
  updateAttendantsInRepositoryMock,
  AttendantsValidationError,
  AttendantsGitHubSyncError,
} = vi.hoisted(() => ({
  isAdminSessionValidMock: vi.fn(),
  readAttendantsFromRepositoryFileMock: vi.fn(),
  updateAttendantsInRepositoryMock: vi.fn(),
  AttendantsValidationError: class AttendantsValidationError extends Error {},
  AttendantsGitHubSyncError: class AttendantsGitHubSyncError extends Error {},
}));

vi.mock("@/lib/admin-auth", () => ({
  ADMIN_SESSION_COOKIE: "li_rilko_admin_session",
  isAdminSessionValid: isAdminSessionValidMock,
}));

vi.mock("@/lib/attendants-store", () => ({
  AttendantsValidationError,
  AttendantsGitHubSyncError,
  readAttendantsFromRepositoryFile: readAttendantsFromRepositoryFileMock,
  updateAttendantsInRepository: updateAttendantsInRepositoryMock,
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
    readAttendantsFromRepositoryFileMock.mockResolvedValue([
      {
        name: "Ari",
        phone: "5517999991111",
      },
    ]);

    const response = await GET(makeRequest("GET"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.attendants).toHaveLength(1);
  });

  it("retorna 400 para JSON inválido no PUT", async () => {
    isAdminSessionValidMock.mockReturnValue(true);

    const response = await PUT(makeRequest("PUT", "{invalid-json"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Payload inválido");
  });

  it("retorna 200 com metadados de PR ao salvar atendentes", async () => {
    isAdminSessionValidMock.mockReturnValue(true);
    updateAttendantsInRepositoryMock.mockResolvedValue({
      attendants: [{ name: "Ari", phone: "5517999991111" }],
      commitSha: "abc123",
      pullRequestUrl: "https://github.com/ArielAio/Li-Rilko/pull/42",
      pullRequestNumber: 42,
      workBranch: "bot/attendants-admin",
      unchanged: false,
      autoMergeRequested: true,
      autoMergeStatusMessage: "Auto-merge solicitado com método squash.",
    });

    const response = await PUT(
      makeRequest(
        "PUT",
        JSON.stringify({
          attendants: [{ name: "Ari", phone: "5517999991111" }],
        }),
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.attendants).toHaveLength(1);
    expect(payload.commitSha).toBe("abc123");
    expect(payload.pullRequestUrl).toContain("/pull/42");
    expect(payload.pullRequestNumber).toBe(42);
    expect(payload.workBranch).toBe("bot/attendants-admin");
    expect(payload.unchanged).toBe(false);
    expect(payload.autoMergeRequested).toBe(true);
    expect(payload.autoMergeStatusMessage).toContain("squash");
  });

  it("retorna 400 para erro de validação", async () => {
    isAdminSessionValidMock.mockReturnValue(true);
    updateAttendantsInRepositoryMock.mockRejectedValue(new AttendantsValidationError("Cadastre pelo menos 1 atendente."));

    const response = await PUT(
      makeRequest(
        "PUT",
        JSON.stringify({
          attendants: [],
        }),
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Cadastre pelo menos 1 atendente");
  });

  it("retorna 400 para telefone duplicado", async () => {
    isAdminSessionValidMock.mockReturnValue(true);
    updateAttendantsInRepositoryMock.mockRejectedValue(
      new AttendantsValidationError("O número do atendente 2 está duplicado com o atendente 1."),
    );

    const response = await PUT(
      makeRequest(
        "PUT",
        JSON.stringify({
          attendants: [
            { name: "Ari", phone: "5517999991111" },
            { name: "Siconeli", phone: "5517999991111" },
          ],
        }),
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("duplicado");
  });

  it("retorna 502 para erro de sync com GitHub", async () => {
    isAdminSessionValidMock.mockReturnValue(true);
    updateAttendantsInRepositoryMock.mockRejectedValue(new AttendantsGitHubSyncError("Falha na API do GitHub"));

    const response = await PUT(
      makeRequest(
        "PUT",
        JSON.stringify({
          attendants: [{ name: "Ari", phone: "5517999991111" }],
        }),
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload.error).toContain("Falha na API do GitHub");
  });

  it("retorna 500 para erro inesperado", async () => {
    isAdminSessionValidMock.mockReturnValue(true);
    updateAttendantsInRepositoryMock.mockRejectedValue(new Error("boom"));

    const response = await PUT(
      makeRequest(
        "PUT",
        JSON.stringify({
          attendants: [{ name: "Ari", phone: "5517999991111" }],
        }),
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toContain("Erro interno");
  });
});
