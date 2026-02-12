import { cookies } from "next/headers";
import AdminDashboard from "@/components/admin/admin-dashboard";
import AdminLoginForm from "@/components/admin/admin-login-form";
import {
  ADMIN_SESSION_COOKIE,
  isAdminSessionValid,
  isUsingFallbackAdminCredentials,
  isUsingFallbackSessionSecret,
} from "@/lib/admin-auth";

export const metadata = {
  title: "Admin | Li Rilko Imports",
  description: "Acesso administrativo para operação da loja Li Rilko Imports.",
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? "";
  const isAuthenticated = isAdminSessionValid(sessionToken);

  if (isAuthenticated) {
    return <AdminDashboard />;
  }

  const showFallbackWarning = isUsingFallbackAdminCredentials() || isUsingFallbackSessionSecret();

  return (
    <section className="section admin-login-section">
      <div className="shell-container">
        <AdminLoginForm showFallbackWarning={showFallbackWarning} />
      </div>
    </section>
  );
}

