export const defaultCategories = [
  { name: "Smartphones", subs: ["iPhone", "Celular (outros)"] },
  { name: "Apple", subs: ["Apple Watch", "iPad e MacBook"] },
  { name: "Acessorios", subs: ["Capinhas", "Peliculas", "Cabos e carregadores"] },
  { name: "Importados", subs: ["Perfumes", "Maquiagem", "Bijuterias", "Mochilas"] },
  { name: "Mobilidade", subs: ["Moto eletrica"] },
  { name: "Outros", subs: ["Itens variados"] },
];

function buildImageUrl(seed, width = 1200, height = 1200) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

function buildGallery(seed) {
  return [buildImageUrl(`${seed}-1`), buildImageUrl(`${seed}-2`), buildImageUrl(`${seed}-3`)];
}

const productImageSeeds = {
  "iphone-13-128gb": "smartphone-premium-red",
  "iphone-12-128gb": "smartphone-minimal-black",
  "apple-watch-series-8": "watch-tech-modern",
  "ipad-9-geracao-64gb": "tablet-clean-desk",
  "pelicula-3d-premium": "accessory-glass-shield",
  "capinha-anti-impacto": "phone-case-texture",
  "perfume-importado-100ml": "perfume-luxury-bottle",
  "kit-maquiagem-pro": "makeup-kit-color",
  "mochila-urban-tech": "urban-backpack-style",
  "moto-eletrica-compact": "electric-bike-city",
  "garrafa-termica-1l": "thermal-bottle-clean",
  "bijuteria-luxury-set": "jewelry-premium-light",
};

const baseProducts = [
  {
    id: "iphone-13-128gb",
    name: "iPhone 13 128GB",
    category: "Smartphones",
    sub: "iPhone",
    price: 2899,
    oldPrice: 3149,
    badge: "Oferta da semana",
    shortDescription: "Desempenho premium, cameras avancadas e design elegante.",
    highlights: ["Tela Super Retina", "Chip A15 Bionic", "Excelente revenda"],
  },
  {
    id: "iphone-12-128gb",
    name: "iPhone 12 128GB",
    category: "Smartphones",
    sub: "iPhone",
    price: 2499,
    oldPrice: 2799,
    badge: "Ultimas unidades",
    shortDescription: "Excelente custo-beneficio para quem busca iPhone original.",
    highlights: ["Face ID", "5G", "Otima performance"],
  },
  {
    id: "apple-watch-series-8",
    name: "Apple Watch Series 8",
    category: "Apple",
    sub: "Apple Watch",
    price: 2199,
    oldPrice: 2450,
    badge: "Mais vendido",
    shortDescription: "Monitoramento completo de saude e estilo para o dia a dia.",
    highlights: ["Saude e treino", "GPS", "Acabamento premium"],
  },
  {
    id: "ipad-9-geracao-64gb",
    name: "iPad 9a Geracao 64GB",
    category: "Apple",
    sub: "iPad e MacBook",
    price: 2590,
    oldPrice: 2890,
    badge: "Novo lote",
    shortDescription: "Tela ampla e fluida para produtividade e entretenimento.",
    highlights: ['Tela de 10,2"', "Chip A13", "Ideal para estudos"],
  },
  {
    id: "pelicula-3d-premium",
    name: "Pelicula 3D Premium",
    category: "Acessorios",
    sub: "Peliculas",
    price: 39.9,
    oldPrice: 49.9,
    badge: "Leve 2 com desconto",
    shortDescription: "Protecao reforcada e acabamento transparente de alta qualidade.",
    highlights: ["Cobertura 3D", "Alta transparencia", "Toque preciso"],
  },
  {
    id: "capinha-anti-impacto",
    name: "Capinha Anti-impacto",
    category: "Acessorios",
    sub: "Capinhas",
    price: 49.9,
    oldPrice: 59.9,
    badge: "Protecao reforcada",
    shortDescription: "Absorcao de impacto com visual moderno e premium.",
    highlights: ["Bordas reforcadas", "Leve", "Design elegante"],
  },
  {
    id: "perfume-importado-100ml",
    name: "Perfume Importado 100ml",
    category: "Importados",
    sub: "Perfumes",
    price: 249,
    oldPrice: 289,
    badge: "Linha premium",
    shortDescription: "Fragrancia marcante com alta fixacao e excelente projecao.",
    highlights: ["Alta fixacao", "Assinatura sofisticada", "100ml"],
  },
  {
    id: "kit-maquiagem-pro",
    name: "Kit Maquiagem Pro",
    category: "Importados",
    sub: "Maquiagem",
    price: 129,
    oldPrice: 149,
    badge: "Acabamento profissional",
    shortDescription: "Selecao completa para looks do basico ao sofisticado.",
    highlights: ["Paleta versatil", "Otima pigmentacao", "Uso diario"],
  },
  {
    id: "mochila-urban-tech",
    name: "Mochila Urban Tech",
    category: "Importados",
    sub: "Mochilas",
    price: 189,
    oldPrice: 229,
    badge: "Visual executivo",
    shortDescription: "Mochila resistente com compartimentos inteligentes.",
    highlights: ["Compartimento notebook", "Design urbano", "Material resistente"],
  },
  {
    id: "moto-eletrica-compact",
    name: "Moto Eletrica Compact",
    category: "Mobilidade",
    sub: "Moto eletrica",
    price: 6990,
    oldPrice: 7590,
    badge: "Pre-venda",
    shortDescription: "Mobilidade urbana com economia e visual moderno.",
    highlights: ["Baixo consumo", "Visual premium", "Uso urbano"],
  },
  {
    id: "garrafa-termica-1l",
    name: "Garrafa Termica 1L",
    category: "Outros",
    sub: "Itens variados",
    price: 69.9,
    oldPrice: 89.9,
    badge: "Destaque da semana",
    shortDescription: "Mantem temperatura por horas com design elegante.",
    highlights: ["1 litro", "Vedacao segura", "Acabamento premium"],
  },
  {
    id: "bijuteria-luxury-set",
    name: "Bijuteria Luxury Set",
    category: "Importados",
    sub: "Bijuterias",
    price: 119,
    oldPrice: 149,
    badge: "Colecao nova",
    shortDescription: "Pecas sofisticadas para elevar o visual de qualquer producao.",
    highlights: ["Brilho intenso", "Leve e confortavel", "Mix versatil"],
  },
];

export const defaultProducts = baseProducts.map((product) => {
  const seed = productImageSeeds[product.id] || product.id;
  const images = buildGallery(seed);
  const priceInstallment = Number(product.priceInstallment ?? product.price ?? 0);
  const priceCash = Number(product.priceCash ?? priceInstallment);

  return {
    ...product,
    price: priceInstallment,
    priceInstallment,
    priceCash,
    image: images[0],
    images,
    isVisible: true,
    isAvailable: true,
  };
});

export const defaultHomeHighlights = [
  {
    title: "Preco e escolha com mais clareza",
    text: "Produtos com nome, categoria e valor visivel para facilitar comparacao e decisao.",
  },
  {
    title: "Atendimento humano no canal certo",
    text: "Negociacao e suporte direto no WhatsApp para avancar da duvida ao fechamento.",
  },
  {
    title: "Carrinho pronto para envio",
    text: "Resumo com itens, quantidades e total para finalizar sem retrabalho.",
  },
];

export const defaultContactChannels = [
  {
    id: "instagram",
    title: "Instagram",
    value: "@lirilkoimportscentro",
    href: "https://www.instagram.com/lirilkoimportscentro/",
  },
  {
    id: "atendimento",
    title: "Atendimento",
    value: "Compra, reserva e suporte pelo WhatsApp",
    href: "#",
  },
  {
    id: "endereco",
    title: "Endereco",
    value: "Fernandopolis - SP",
    href: "#",
  },
];

export const defaultSiteSettings = {
  whatsappIntro: "Ola! Separei esses produtos e gostaria de finalizar a compra. Pode me ajudar?",
  whatsappFloatingMessage: "Ola, estou navegando em sua loja e gostaria de mais informacoes.",
  whatsappAttendants: [],
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createDefaultCatalog() {
  return {
    categories: deepClone(defaultCategories),
    products: deepClone(defaultProducts),
    homeHighlights: deepClone(defaultHomeHighlights),
    contactChannels: deepClone(defaultContactChannels),
    siteSettings: deepClone(defaultSiteSettings),
  };
}

export const categories = deepClone(defaultCategories);
export const products = deepClone(defaultProducts);
export const productMap = new Map(products.map((product) => [product.id, product]));
export const homeHighlights = deepClone(defaultHomeHighlights);
export const contactChannels = deepClone(defaultContactChannels);
export const siteSettings = deepClone(defaultSiteSettings);
