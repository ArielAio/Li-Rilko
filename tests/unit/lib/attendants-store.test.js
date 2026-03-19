import { beforeEach, describe, expect, it, vi } from "vitest";

const { readFileMock } = vi.hoisted(() => ({
  readFileMock: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  readFile: readFileMock,
}));

import { defaultAttendants } from "@/lib/attendants-data";
import { readAttendantsFromRepositoryFile } from "@/lib/attendants-store";

describe("lib/attendants-store readAttendantsFromRepositoryFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna atendentes saneados do arquivo local", async () => {
    readFileMock.mockResolvedValue(`{
  "attendants": [
    { "name": "  Ari  ", "phone": "(17) 99999-1111" },
    { "name": "A", "phone": "5517999992222" },
    { "name": "Siconeli", "phone": "5517999991111" }
  ]
}`);

    const attendants = await readAttendantsFromRepositoryFile();

    expect(attendants).toEqual([
      {
        name: "Ari",
        phone: "5517999991111",
      },
    ]);
  });

  it("faz fallback para os atendentes padrão quando o arquivo não pode ser lido", async () => {
    readFileMock.mockRejectedValue(new Error("boom"));

    const attendants = await readAttendantsFromRepositoryFile();

    expect(attendants).toEqual(defaultAttendants);
  });

  it("faz fallback para os atendentes padrão quando o JSON está inválido", async () => {
    readFileMock.mockResolvedValue("{invalid-json");

    const attendants = await readAttendantsFromRepositoryFile();

    expect(attendants).toEqual(defaultAttendants);
  });
});
