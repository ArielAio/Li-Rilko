import CatalogPageContent from "@/components/catalog-page-content";

export default async function CatalogPage({ searchParams }) {
  const params = await searchParams;
  const categoria = typeof params?.categoria === "string" ? params.categoria.slice(0, 80) : "Todos";
  const sub = typeof params?.sub === "string" ? params.sub : "";

  const initialCategory = categoria || "Todos";
  const initialSub = sub.slice(0, 80);

  return <CatalogPageContent initialCategory={initialCategory} initialSub={initialSub} />;
}
