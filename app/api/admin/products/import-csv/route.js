import { adminJson, requireAdminRequest } from "@/lib/admin-route";
import { parseProductsCsvImport } from "@/lib/products-csv-import";
import {
  CatalogRepositoryConfigError,
  CatalogRepositoryValidationError,
  importProductsCsvInCatalog,
} from "@/lib/catalog-repository";

export const runtime = "nodejs";

function getUploadedFile(formData) {
  const file = formData.get("file");
  if (!file || typeof file.text !== "function") {
    throw new CatalogRepositoryValidationError("Selecione um arquivo CSV valido para importar.");
  }

  return file;
}

export async function POST(request) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return adminJson({ error: "Nao foi possivel ler o formulario de importacao." }, 400);
  }

  try {
    const file = getUploadedFile(formData);
    const csvContent = await file.text();
    const parsedImport = parseProductsCsvImport(csvContent, {
      imagesMode: "blank",
      missingPriceMode: "skip",
    });
    const result = await importProductsCsvInCatalog(parsedImport);

    return adminJson({
      catalog: result.catalog,
      summary: result.summary,
    });
  } catch (error) {
    if (error instanceof CatalogRepositoryValidationError) {
      return adminJson({ error: error.message }, 400);
    }

    if (error instanceof CatalogRepositoryConfigError) {
      return adminJson({ error: error.message }, 503);
    }

    return adminJson({ error: "Erro interno ao importar o CSV." }, 500);
  }
}
