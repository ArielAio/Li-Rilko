import { describe, expect, it } from "vitest";
import { buildWhatsAppMessage } from "@/lib/store-utils";

describe("KNOWN ISSUE: aviso no checkout para item indisponível já no carrinho", () => {
  it("deveria incluir alerta explícito na mensagem quando item está indisponível", () => {
    const message = buildWhatsAppMessage(
      [
        {
          name: "Produto indisponível",
          qty: 1,
          isAvailable: false,
          subtotalCash: 100,
          subtotalInstallment: 120,
        },
      ],
      {
        whatsappIntro: "Olá",
      },
    );

    expect(message.toLowerCase()).toContain("indisponível");
    expect(message.toLowerCase()).toContain("confirm");
  });
});
