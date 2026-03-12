import { describe, expect, it } from "vitest";
import {
  buildAttendantWhatsAppLink,
  buildFloatingWhatsAppLink,
  buildWhatsAppMessage,
  formatCurrency,
  resolveProductPrices,
} from "@/lib/store-utils";

describe("lib/store-utils", () => {
  it("formata moeda em BRL", () => {
    const formatted = formatCurrency(1234.56);

    expect(formatted).toContain("1.234,56");
    expect(formatted).toContain("R$");
  });

  it("resolve preços com fallback seguro", () => {
    expect(resolveProductPrices({ priceInstallment: 199, priceCash: 179 })).toEqual({
      priceCash: 179,
      priceInstallment: 199,
    });

    expect(resolveProductPrices({ price: 99 })).toEqual({
      priceCash: 99,
      priceInstallment: 99,
    });

    expect(resolveProductPrices({ priceInstallment: "invalid" })).toEqual({
      priceCash: 0,
      priceInstallment: 0,
    });
  });

  it("gera mensagem de carrinho vazio", () => {
    const message = buildWhatsAppMessage([], {
      whatsappIntro: "Olá!",
    });

    expect(message).toContain("Olá!");
    expect(message).toContain("(sem itens selecionados ainda)");
  });

  it("gera mensagem com itens e totais", () => {
    const message = buildWhatsAppMessage(
      [
        {
          name: "Produto A",
          qty: 2,
          subtotalCash: 200,
          subtotalInstallment: 220,
        },
        {
          name: "Produto B",
          qty: 1,
          subtotalCash: 50,
          subtotalInstallment: 60,
        },
      ],
      {
        whatsappIntro: "Olá, quero fechar esse pedido",
      },
    );

    expect(message).toContain("• Produto A (2x)");
    expect(message).toContain("• Produto B (1x)");
    expect(message).toContain("Total à vista:");
    expect(message).toContain("Total a prazo:");
  });

  it("inclui aviso quando há item indisponível", () => {
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

  it("não inclui alerta quando todos os itens estão disponíveis", () => {
    const message = buildWhatsAppMessage(
      [
        {
          name: "Produto disponível",
          qty: 1,
          isAvailable: true,
          subtotalCash: 100,
          subtotalInstallment: 120,
        },
      ],
      {
        whatsappIntro: "Olá",
      },
    );

    expect(message.toLowerCase()).not.toContain("itens indisponíveis");
  });

  it("gera link do atendente apenas com número válido", () => {
    const validLink = buildAttendantWhatsAppLink("Oi teste", {
      phone: "(17) 99999-1234",
    });

    expect(validLink).toContain("https://wa.me/5517999991234");
    expect(validLink).toContain("text=Oi%20teste");

    const invalidLink = buildAttendantWhatsAppLink("Oi", {
      phone: "123",
    });

    expect(invalidLink).toBeNull();
  });

  it("gera link do widget flutuante com mensagem configurada", () => {
    const link = buildFloatingWhatsAppLink(
      {
        whatsappFloatingMessage: "Olá, vim do site",
      },
      "+55 (17) 99888-0000",
    );

    expect(link).toContain("https://wa.me/5517998880000");
    expect(link).toContain("text=Ol%C3%A1%2C%20vim%20do%20site");
  });
});
