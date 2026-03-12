import { describe, expect, it } from "vitest";
import { sanitizeAttendants, validateAttendantsInput } from "@/lib/attendants-utils";

describe("lib/attendants-utils", () => {
  it("deduplica atendentes com mesmo telefone canônico", () => {
    const attendants = sanitizeAttendants([
      { name: "Ari", phone: "5517999991111" },
      { name: "Siconeli", phone: "(17) 99999-1111" },
      { name: "Maria", phone: "5517999992222" },
    ]);

    expect(attendants).toHaveLength(2);
    expect(attendants.map((item) => item.phone)).toEqual(["5517999991111", "5517999992222"]);
  });

  it("bloqueia validação com telefone duplicado", () => {
    const result = validateAttendantsInput([
      { name: "Ari", phone: "5517999991111" },
      { name: "Siconeli", phone: "(17) 99999-1111" },
    ]);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("duplicado");
    expect(result.error).toContain("2");
  });

  it("aceita lista válida sem duplicidade", () => {
    const result = validateAttendantsInput([
      { name: "Ari", phone: "5517999991111" },
      { name: "Siconeli", phone: "5517999992222" },
    ]);

    expect(result.ok).toBe(true);
    expect(result.attendants).toHaveLength(2);
  });
});
