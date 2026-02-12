"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/app/admin/actions";

const INITIAL_STATE = {
  error: "",
};

export default function AdminLoginForm({ showFallbackWarning = false }) {
  const [state, formAction, isPending] = useActionState(adminLoginAction, INITIAL_STATE);

  return (
    <article className="admin-card admin-login-card reveal">
      <p className="kicker">Acesso restrito</p>
      <h1>Painel administrativo</h1>
      <p>
        Entre com as credenciais de administrador para gerenciar produtos, categorias e dados de contato da loja.
      </p>

      {showFallbackWarning && (
        <p className="admin-warning">
          Ambiente em modo de desenvolvimento: configure <code>ADMIN_USERNAME</code>, <code>ADMIN_PASSWORD</code> e{" "}
          <code>ADMIN_SESSION_SECRET</code> no deploy.
        </p>
      )}

      <form className="admin-form" action={formAction}>
        <label className="admin-field">
          <span>Usuário</span>
          <input name="username" type="text" autoComplete="username" placeholder="admin" required />
        </label>

        <label className="admin-field">
          <span>Senha</span>
          <input name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
        </label>

        {state?.error ? <p className="admin-error">{state.error}</p> : null}

        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? "Entrando..." : "Entrar no painel"}
        </button>
      </form>
    </article>
  );
}
