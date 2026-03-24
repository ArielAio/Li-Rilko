"use client";

import { useActionState, useState } from "react";
import { adminLoginAction } from "@/app/admin/actions";
import { IconUser } from "@/components/icons";
import TransitionLink from "@/components/transition-link";

const INITIAL_STATE = {
  error: "",
};

export default function AdminLoginForm({ showFallbackWarning = false }) {
  const [state, formAction, isPending] = useActionState(adminLoginAction, INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotState, setShowForgotState] = useState(false);

  return (
    <article className="vg-admin-login-wrapper">
      <div className="vg-secure-logo">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      
      <div className="vg-admin-login-header">
        <h1>Admin Li Rilko</h1>
        <p>Acesso Restrito ao Portal Seguro</p>
      </div>

      {showForgotState ? (
        <div className="vg-admin-login-card">
          <div className="vg-admin-form-inner" style={{ textAlign: "center", padding: "1rem 0" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: "0 auto", color: "var(--muted)" }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <h2 style={{ fontSize: "1.1rem", marginTop: "1rem" }}>Redefinição de Senha</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: "1.5" }}>
              Por questões de segurança, entre em contato com os administradores ou o desenvolvedor do sistema para redefinir as credenciais de acesso.
            </p>
            <button type="button" className="vg-secure-submit" style={{ marginTop: "1rem" }} onClick={() => setShowForgotState(false)}>
              VOLTAR AO LOGIN
            </button>
          </div>
        </div>
      ) : (
        <div className="vg-admin-login-card">
          <form action={formAction} className="vg-admin-form-inner">
            <label className="vg-secure-field">
              <span className="vg-secure-label">USUÁRIO</span>
              <div className="vg-secure-input-wrap">
                <IconUser className="vg-secure-icon" />
                <input name="username" type="text" autoComplete="username" placeholder="Identificador admin" required />
              </div>
            </label>

            <label className="vg-secure-field">
              <div className="vg-secure-label-row">
                <span className="vg-secure-label">SENHA</span>
                <button type="button" className="vg-forgot-link" onClick={() => setShowForgotState(true)}>Esqueceu?</button>
              </div>
              <div className="vg-secure-input-wrap">
                <svg className="vg-secure-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  autoComplete="current-password" 
                  placeholder="••••••••" 
                  required 
                />
                <button 
                  type="button" 
                  className="vg-secure-eye" 
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Ver senha"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPassword ? (
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/>
                    ) : (
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                    )}
                  </svg>
                </button>
              </div>
            </label>

            {state?.error ? <p className="vg-secure-error">{state.error}</p> : null}
            {showFallbackWarning && (
              <p className="vg-secure-error">Configure ADMIN_USERNAME e ADMIN_PASSWORD no deploy.</p>
            )}

            <button type="submit" className="vg-secure-submit" disabled={isPending}>
              {isPending ? "ENTRANDO..." : "ENTRAR"} <span className="arrow">→</span>
            </button>

            <div className="vg-secure-status">
              <span className="dot"></span>
              <span>SISTEMA ONLINE & CRIPTOGRAFADO</span>
            </div>
          </form>
        </div>
      )}

      <div className="vg-admin-login-footer" style={{ justifyContent: "center" }}>
        <TransitionLink href="/" className="vg-support-btn">
          VER CATÁLOGO
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </TransitionLink>
      </div>
      <span className="vg-secure-version">V-2.4.0_SECURE</span>
    </article>
  );
}
