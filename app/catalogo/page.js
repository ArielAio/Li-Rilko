import CatalogPageContent from "@/components/catalog-page-content";

export default async function CatalogPage({ searchParams }) {
  const params = await searchParams;
  const categoria = typeof params?.categoria === "string" ? params.categoria.slice(0, 80) : "Todos";
  const sub = typeof params?.sub === "string" ? params.sub : "";
  const ordenacao = typeof params?.ordem === "string" ? params.ordem : "relevancia";

  const initialCategory = categoria || "Todos";
  const initialSub = sub.slice(0, 80);
  const initialSort = ordenacao.slice(0, 40);

  return <CatalogPageContent initialCategory={initialCategory} initialSub={initialSub} initialSort={initialSort} />;
}
