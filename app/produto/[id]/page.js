import Link from "next/link";
import { notFound } from "next/navigation";
import ProductDetailActions from "@/components/product-detail-actions";
import { productMap } from "@/lib/catalog-data";
import { formatCurrency } from "@/lib/store-utils";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = productMap.get(id);

  if (!product) {
    return {
      title: "Produto não encontrado | Li Rilko Imports",
    };
  }

  return {
    title: `${product.name} | Li Rilko Imports`,
    description: product.shortDescription,
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = productMap.get(id);

  if (!product) {
    notFound();
  }

  const gallery = (product.images && product.images.length > 0 ? product.images : [product.image]).filter(Boolean);

  return (
    <>
      <section className="section page-hero-small">
        <div className="shell-container">
          <p className="kicker">Detalhe do produto</p>
          <h1>{product.name}</h1>
          <p>{product.shortDescription}</p>
          <div className="breadcrumb-row">
            <Link href="/">Início</Link>
            <span>/</span>
            <Link href="/catalogo">Catálogo</Link>
            <span>/</span>
            <strong>{product.name}</strong>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-container detail-grid">
          <article className="detail-media-card reveal">
            <div className="detail-media-main">
              {gallery[0] ? (
                <img src={gallery[0]} alt={product.name} loading="eager" />
              ) : (
                <span>{product.sub}</span>
              )}
            </div>
            <div className="detail-media-thumbs">
              {gallery.slice(0, 3).map((imageUrl, index) => (
                <div key={`${product.id}-${index}`} className="thumb-card">
                  <img src={imageUrl} alt={`${product.name} - imagem ${index + 1}`} loading="lazy" decoding="async" />
                </div>
              ))}
            </div>
          </article>

          <article className="detail-content-card reveal delay-1">
            <p className="product-badge">{product.badge}</p>
            <h2>{product.name}</h2>
            <p className="detail-category">
              {product.category} • {product.sub}
            </p>
            <p className="detail-description">{product.shortDescription}</p>

            <div className="price-block">
              <small>Preço anterior: {formatCurrency(product.oldPrice)}</small>
              <strong>{formatCurrency(product.price)}</strong>
            </div>

            <ul className="detail-highlights">
              {product.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <ProductDetailActions product={product} />
          </article>
        </div>
      </section>
    </>
  );
}
