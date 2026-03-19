import { adminJson, requireAdminRequest } from "@/lib/admin-route";
import { getAdminBootstrapSnapshot } from "@/lib/catalog-repository";

export const runtime = "nodejs";

export async function GET(request) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const catalog = await getAdminBootstrapSnapshot();
    return adminJson({ catalog });
  } catch {
    return adminJson({ error: "Não foi possível carregar os dados administrativos agora." }, 500);
  }
}
