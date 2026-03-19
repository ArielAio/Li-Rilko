import { adminJson, requireAdminRequest } from "@/lib/admin-route";
import {
  CatalogRepositoryConfigError,
  CatalogRepositoryValidationError,
  deleteProductFromCatalog,
  updateProductInCatalog,
} from "@/lib/catalog-repository";

export const runtime = "nodejs";

export async function PUT(request, context) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return adminJson({ error: "Payload inválido. Envie JSON no formato correto." }, 400);
  }

  try {
    const result = await updateProductInCatalog(id, payload);
    return adminJson({ catalog: result.catalog });
  } catch (error) {
    if (error instanceof CatalogRepositoryValidationError) {
      return adminJson({ error: error.message }, 400);
    }

    if (error instanceof CatalogRepositoryConfigError) {
      return adminJson({ error: error.message }, 503);
    }

    return adminJson({ error: "Erro interno ao atualizar produto." }, 500);
  }
}

export async function DELETE(request, context) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;

  try {
    const result = await deleteProductFromCatalog(id);
    return adminJson({ catalog: result.catalog });
  } catch (error) {
    if (error instanceof CatalogRepositoryValidationError) {
      return adminJson({ error: error.message }, 400);
    }

    if (error instanceof CatalogRepositoryConfigError) {
      return adminJson({ error: error.message }, 503);
    }

    return adminJson({ error: "Erro interno ao excluir produto." }, 500);
  }
}
