import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isAdminSessionValid } from "@/lib/admin-auth";

export function adminJson(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export function requireAdminRequest(request) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? "";

  if (isAdminSessionValid(sessionToken)) {
    return null;
  }

  return adminJson({ error: "Acesso negado. Faça login no painel admin." }, 401);
}
