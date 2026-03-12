import { describe, expect, it } from "vitest";
import {
  formatBrazilPhoneInput,
  formatCurrencyInput,
  formatCurrencyInputForEdit,
  parseCurrencyInputToNumber,
  toCanonicalBrazilWhatsAppPhone,
} from "@/lib/admin-input-formatters";

describe("lib/admin-input-formatters", () => {
  it("faz parse de moeda pt-BR", () => {
    expect(parseCurrencyInputToNumber("R$ 1.234,56")).toBe(1234.56);
    expect(parseCurrencyInputToNumber("89,9")).toBe(89.9);
    expect(parseCurrencyInputToNumber("")).toBe(0);
  });

  it("formata moeda para exibição e edição", () => {
    expect(formatCurrencyInput("1234.5")).toContain("1.234,50");
    expect(formatCurrencyInputForEdit("R$ 99,00")).toBe("99,00");
  });

  it("normaliza WhatsApp para formato canônico", () => {
    expect(toCanonicalBrazilWhatsAppPhone("(17) 99999-1234")).toBe("5517999991234");
    expect(toCanonicalBrazilWhatsAppPhone("5517999991234")).toBe("5517999991234");
    expect(toCanonicalBrazilWhatsAppPhone("123")).toBe("");
  });

  it("formata telefone brasileiro para input", () => {
    expect(formatBrazilPhoneInput("5517999991234")).toBe("(17) 99999-1234");
    expect(formatBrazilPhoneInput("1799991234")).toBe("(17) 9999-1234");
  });
});
