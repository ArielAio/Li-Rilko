import { describe, expect, it } from "vitest";
import { resolveAttendantFlow } from "@/lib/attendants-data";
import { resolveWhatsAppAttendantAction } from "@/lib/whatsapp-attendant-flow";

describe("attendant flow", () => {
  it("retorna blocked sem atendentes válidos", () => {
    const flow = resolveAttendantFlow([]);

    expect(flow.mode).toBe("blocked");
    expect(flow.attendants).toEqual([]);
  });

  it("retorna direct com um atendente", () => {
    const flow = resolveAttendantFlow([
      {
        name: "Ari",
        phone: "5517999991111",
      },
    ]);

    expect(flow.mode).toBe("direct");
    expect(flow.attendant?.name).toBe("Ari");
  });

  it("retorna picker com múltiplos atendentes", () => {
    const flow = resolveAttendantFlow([
      {
        name: "Ari",
        phone: "5517999991111",
      },
      {
        name: "Siconeli",
        phone: "5517999992222",
      },
    ]);

    expect(flow.mode).toBe("picker");
    expect(flow.attendants).toHaveLength(2);
  });

  it("resolve ação direta com link válido", () => {
    const action = resolveWhatsAppAttendantAction(
      [
        {
          name: "Ari",
          phone: "5517999991111",
        },
      ],
      "Olá, pedido de teste",
    );

    expect(action.mode).toBe("direct");
    expect(action.link).toContain("https://wa.me/5517999991111");
    expect(action.link).toContain("text=Ol%C3%A1%2C%20pedido%20de%20teste");
  });

  it("bloqueia ação direta quando telefone é inválido", () => {
    const action = resolveWhatsAppAttendantAction(
      [
        {
          name: "Ari",
          phone: "123",
        },
      ],
      "mensagem",
    );

    expect(action.mode).toBe("blocked");
    expect(action.link).toBeNull();
  });
});
