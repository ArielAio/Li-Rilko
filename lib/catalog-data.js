export const categories = [
  { name: "Smartphones", subs: ["iPhone", "Celular (outros)"] },
  { name: "Apple", subs: ["Apple Watch", "iPad e MacBook"] },
  { name: "Acessórios", subs: ["Capinhas", "Películas", "Cabos e carregadores"] },
  { name: "Importados", subs: ["Perfumes", "Maquiagem", "Bijuterias", "Mochilas"] },
  { name: "Mobilidade", subs: ["Moto elétrica"] },
  { name: "Outros", subs: ["Itens variados"] },
];

function buildImageUrl(seed, width = 1200, height = 1200) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

function buildGallery(seed) {
  return [
    buildImageUrl(`${seed}-1`),
    buildImageUrl(`${seed}-2`),
    buildImageUrl(`${seed}-3`),
  ];
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
    shortDescription: "Desempenho premium, câmeras avançadas e design elegante.",
    highlights: ["Tela Super Retina", "Chip A15 Bionic", "Excelente revenda"],
  },
  {
    id: "iphone-12-128gb",
    name: "iPhone 12 128GB",
    category: "Smartphones",
    sub: "iPhone",
    price: 2499,
    oldPrice: 2799,
    badge: "Últimas unidades",
    shortDescription: "Excelente custo-benefício para quem busca iPhone original.",
    highlights: ["Face ID", "5G", "Ótima performance"],
  },
  {
    id: "apple-watch-series-8",
    name: "Apple Watch Series 8",
    category: "Apple",
    sub: "Apple Watch",
    price: 2199,
    oldPrice: 2450,
    badge: "Mais vendido",
    shortDescription: "Monitoramento completo de saúde e estilo para o dia a dia.",
    highlights: ["Saúde e treino", "GPS", "Acabamento premium"],
  },
  {
    id: "ipad-9-geracao-64gb",
    name: "iPad 9ª Geração 64GB",
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
    name: "Película 3D Premium",
    category: "Acessórios",
    sub: "Películas",
    price: 39.9,
    oldPrice: 49.9,
    badge: "Leve 2 com desconto",
    shortDescription: "Proteção reforçada e acabamento transparente de alta qualidade.",
    highlights: ["Cobertura 3D", "Alta transparência", "Toque preciso"],
  },
  {
    id: "capinha-anti-impacto",
    name: "Capinha Anti-impacto",
    category: "Acessórios",
    sub: "Capinhas",
    price: 49.9,
    oldPrice: 59.9,
    badge: "Proteção reforçada",
    shortDescription: "Absorção de impacto com visual moderno e premium.",
    highlights: ["Bordas reforçadas", "Leve", "Design elegante"],
  },
  {
    id: "perfume-importado-100ml",
    name: "Perfume Importado 100ml",
    category: "Importados",
    sub: "Perfumes",
    price: 249,
    oldPrice: 289,
    badge: "Linha premium",
    shortDescription: "Fragrância marcante com alta fixação e excelente projeção.",
    highlights: ["Alta fixação", "Assinatura sofisticada", "100ml"],
  },
  {
    id: "kit-maquiagem-pro",
    name: "Kit Maquiagem Pro",
    category: "Importados",
    sub: "Maquiagem",
    price: 129,
    oldPrice: 149,
    badge: "Acabamento profissional",
    shortDescription: "Seleção completa para looks do básico ao sofisticado.",
    highlights: ["Paleta versátil", "Ótima pigmentação", "Uso diário"],
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
    name: "Moto Elétrica Compact",
    category: "Mobilidade",
    sub: "Moto elétrica",
    price: 6990,
    oldPrice: 7590,
    badge: "Pré-venda",
    shortDescription: "Mobilidade urbana com economia e visual moderno.",
    highlights: ["Baixo consumo", "Visual premium", "Uso urbano"],
  },
  {
    id: "garrafa-termica-1l",
    name: "Garrafa Térmica 1L",
    category: "Outros",
    sub: "Itens variados",
    price: 69.9,
    oldPrice: 89.9,
    badge: "Destaque da semana",
    shortDescription: "Mantém temperatura por horas com design elegante.",
    highlights: ["1 litro", "Vedação segura", "Acabamento premium"],
  },
  {
    id: "bijuteria-luxury-set",
    name: "Bijuteria Luxury Set",
    category: "Importados",
    sub: "Bijuterias",
    price: 119,
    oldPrice: 149,
    badge: "Coleção nova",
    shortDescription: "Peças sofisticadas para elevar o visual de qualquer produção.",
    highlights: ["Brilho intenso", "Leve e confortável", "Mix versátil"],
  },
];

export const products = baseProducts.map((product) => {
  const seed = productImageSeeds[product.id] || product.id;
  const images = buildGallery(seed);

  return {
    ...product,
    image: images[0],
    images,
  };
});

export const productMap = new Map(products.map((product) => [product.id, product]));

export const homeHighlights = [
  {
    title: "Compra rápida e simples",
    text: "Navegação fácil para escolher produtos e fechar o pedido sem complicação.",
  },
  {
    title: "Atendimento próximo",
    text: "Equipe disponível para ajudar na escolha e concluir a compra no WhatsApp.",
  },
  {
    title: "Qualidade e confiança",
    text: "Produtos selecionados com atenção ao preço, procedência e experiência do cliente.",
  },
];

export const contactChannels = [
  {
    title: "WhatsApp",
    value: "Atendimento para orçamento e fechamento",
    href: "https://wa.me/",
  },
  {
    title: "Instagram",
    value: "@lirilkoimports",
    href: "#",
  },
  {
    title: "Endereço",
    value: "Fernandópolis - SP",
    href: "#",
  },
];

export const siteSettings = {
  whatsappPhone: "",
  whatsappIntro: "Olá! Separei esses produtos e gostaria de finalizar a compra. Pode me ajudar?",
  whatsappFloatingMessage: "Olá, estou navegando em sua loja e gostaria de mais informações.",
};
