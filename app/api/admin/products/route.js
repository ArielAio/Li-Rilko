import { adminJson, requireAdminRequest } from "@/lib/admin-route";
import {
  CatalogRepositoryConfigError,
  CatalogRepositoryValidationError,
  createProductInCatalog,
} from "@/lib/catalog-repository";

export const runtime = "nodejs";

export async function POST(request) {
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
    const result = await createProductInCatalog(payload);
    return adminJson({
      catalog: result.catalog,
      productId: result.productId,
    });
  } catch (error) {
    if (error instanceof CatalogRepositoryValidationError) {
      return adminJson({ error: error.message }, 400);
    }

    if (error instanceof CatalogRepositoryConfigError) {
      return adminJson({ error: error.message }, 503);
    }

    return adminJson({ error: "Erro interno ao criar produto." }, 500);
  }
}
