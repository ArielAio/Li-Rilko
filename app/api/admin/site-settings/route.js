import { adminJson, requireAdminRequest } from "@/lib/admin-route";
import {
  CatalogRepositoryConfigError,
  CatalogRepositoryValidationError,
  saveSiteSettingsInCatalog,
} from "@/lib/catalog-repository";

export const runtime = "nodejs";

export async function PUT(request) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return adminJson({ error: "Payload inválido. Envie JSON no formato correto." }, 400);
  }

  try {
    const result = await saveSiteSettingsInCatalog(payload?.siteSettings);
    return adminJson({ catalog: result.catalog });
  } catch (error) {
    if (error instanceof CatalogRepositoryValidationError) {
      return adminJson({ error: error.message }, 400);
    }

    if (error instanceof CatalogRepositoryConfigError) {
      return adminJson({ error: error.message }, 503);
    }

    return adminJson({ error: "Erro interno ao salvar configurações do site." }, 500);
  }
}
