import { describe, expect, it } from "vitest";
import { sanitizeAttendants } from "@/lib/attendants-utils";

describe("KNOWN ISSUE: política de duplicidade de atendentes", () => {
  it("não deveria permitir dois atendentes com mesmo número", () => {
    const attendants = sanitizeAttendants([
      { name: "Ari", phone: "5517999991111" },
      { name: "Siconeli", phone: "(17) 99999-1111" },
    ]);

    expect(attendants).toHaveLength(1);
  });
});
