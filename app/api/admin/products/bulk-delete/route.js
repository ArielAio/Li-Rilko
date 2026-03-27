import { adminJson, requireAdminRequest } from "@/lib/admin-route";
import {
  CatalogRepositoryConfigError,
  CatalogRepositoryValidationError,
  deleteProductsFromCatalog,
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
    return adminJson({ error: "Payload invalido. Envie uma lista de produtos para excluir." }, 400);
  }

  try {
    const result = await deleteProductsFromCatalog(payload?.productIds);
    return adminJson({
      catalog: result.catalog,
      removedCount: result.removedCount,
    });
  } catch (error) {
    if (error instanceof CatalogRepositoryValidationError) {
      return adminJson({ error: error.message }, 400);
    }

    if (error instanceof CatalogRepositoryConfigError) {
      return adminJson({ error: error.message }, 503);
    }

    return adminJson({ error: "Erro interno ao excluir os produtos selecionados." }, 500);
  }
}
