import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAdminSessionToken,
  isAdminSessionValid,
  validateAdminLogin,
} from "@/lib/admin-auth";

describe("lib/admin-auth", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_USERNAME", "admin");
    vi.stubEnv("ADMIN_PASSWORD", "secret-123");
    vi.stubEnv("ADMIN_SESSION_SECRET", "super-secret");
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("valida login com credenciais corretas", () => {
    expect(validateAdminLogin("admin", "secret-123")).toBe(true);
    expect(validateAdminLogin("admin", "wrong")).toBe(false);
  });

  it("em produção bloqueia fallback de credenciais", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_USERNAME", "");
    vi.stubEnv("ADMIN_PASSWORD", "");

    expect(validateAdminLogin("admin", "admin123")).toBe(false);
  });

  it("cria sessão válida e expira após max age", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const token = createAdminSessionToken("admin");
    expect(isAdminSessionValid(token)).toBe(true);

    vi.setSystemTime(new Date("2026-01-01T13:00:00.000Z"));
    expect(isAdminSessionValid(token)).toBe(false);
  });

  it("invalida token adulterado", () => {
    const token = createAdminSessionToken("admin");
    const parts = token.split("|");
    const tampered = `${parts[0]}|${parts[1]}|signature-invalida`;

    expect(isAdminSessionValid(tampered)).toBe(false);
  });
});
