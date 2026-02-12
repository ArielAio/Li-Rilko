"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  validateAdminLogin,
} from "@/lib/admin-auth";

const LOGIN_ERROR_STATE = {
  error: "Usuário ou senha inválidos. Verifique os dados e tente novamente.",
};

export async function adminLoginAction(_previousState, formData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!validateAdminLogin(username, password)) {
    return LOGIN_ERROR_STATE;
  }

  const sessionToken = createAdminSessionToken(username);
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  redirect("/admin");
}

export async function adminLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin");
}

