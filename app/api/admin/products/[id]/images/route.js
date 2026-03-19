import { adminJson, requireAdminRequest } from "@/lib/admin-route";
import {
  CatalogRepositoryConfigError,
  CatalogRepositoryValidationError,
  uploadProductImageAsset,
} from "@/lib/catalog-repository";

export const runtime = "nodejs";

export async function POST(request, context) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;
  let formData;

  try {
    formData = await request.formData();
  } catch {
    return adminJson({ error: "Payload inválido. Envie multipart/form-data corretamente." }, 400);
  }

  const file = formData.get("file");

  try {
    const image = await uploadProductImageAsset(id, file);
    return adminJson({ image });
  } catch (error) {
    if (error instanceof CatalogRepositoryValidationError) {
      return adminJson({ error: error.message }, 400);
    }

    if (error instanceof CatalogRepositoryConfigError) {
      return adminJson({ error: error.message }, 503);
    }

    return adminJson({ error: "Erro interno ao enviar imagem do produto." }, 500);
  }
}
