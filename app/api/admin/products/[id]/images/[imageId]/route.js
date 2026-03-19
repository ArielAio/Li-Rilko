import { adminJson, requireAdminRequest } from "@/lib/admin-route";
import {
  CatalogRepositoryConfigError,
  CatalogRepositoryValidationError,
  deleteProductImageAsset,
} from "@/lib/catalog-repository";

export const runtime = "nodejs";

export async function DELETE(request, context) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { id, imageId } = await context.params;

  try {
    await deleteProductImageAsset(id, imageId);
    return adminJson({ ok: true });
  } catch (error) {
    if (error instanceof CatalogRepositoryValidationError) {
      return adminJson({ error: error.message }, 400);
    }

    if (error instanceof CatalogRepositoryConfigError) {
      return adminJson({ error: error.message }, 503);
    }

    return adminJson({ error: "Erro interno ao excluir imagem do produto." }, 500);
  }
}
