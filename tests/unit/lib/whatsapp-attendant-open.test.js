// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { openWhatsAppLink } from "@/lib/whatsapp-attendant-flow";

describe("openWhatsAppLink", () => {
  it("não abre quando link é inválido", () => {
    expect(openWhatsAppLink("")).toBe(false);
  });

  it("abre nova aba quando link é válido", () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue({});

    const result = openWhatsAppLink("https://wa.me/5517999991111?text=Oi");

    expect(result).toBe(true);
    expect(openSpy).toHaveBeenCalledTimes(1);
  });
});
