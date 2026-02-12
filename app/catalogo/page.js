import CatalogPageContent from "@/components/catalog-page-content";
import { categories } from "@/lib/catalog-data";

const validCategorySet = new Set(categories.map((category) => category.name));

export default async function CatalogPage({ searchParams }) {
  const params = await searchParams;
  const categoria = typeof params?.categoria === "string" ? params.categoria : "Todos";
  const sub = typeof params?.sub === "string" ? params.sub : "";

  const initialCategory = validCategorySet.has(categoria) ? categoria : "Todos";
  const initialSub = sub.slice(0, 80);

  return <CatalogPageContent initialCategory={initialCategory} initialSub={initialSub} />;
}
