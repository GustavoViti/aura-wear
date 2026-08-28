/*
  Catálogo local — usado como FALLBACK quando o Supabase não está
  configurado (sem config.js) ou a consulta falha/retorna vazia.
  Quando o Supabase responde com produtos, catalog-loader.js sobrescreve
  a variável PRODUCTS com os dados do banco, no mesmo formato abaixo.
  Isso mantém a home funcionando mesmo offline ou antes de configurar as chaves.
  Preços em priceCents são centavos de dólar (USD).
*/

const CATEGORIES = [
  { id: "saias-calcas", label: "Saias & Calças", glyph: "S" },
  { id: "sapatos", label: "Sapatos", glyph: "S" },
  { id: "vestidos-blusas", label: "Vestidos & Blusas", glyph: "V" },
  { id: "Blazers-casacos", label: "Blazers & Casacos", glyph: "B" },
  { id: "Acessorios", label: "Acessórios", glyph: "A" },
];

let PRODUCTS = [
  {
    id: "p01",
    name: "Saia Constance",
    category: "saias-calcas",
    priceCents: 24900,
    description: "Saia lápis em alfaiataria leve, fenda discreta.",
    featured: true,
    swatch: "wine",
    imageUrl: "",
  },
  {
    id: "p02",
    name: "Calça Waldorf",
    category: "saias-calcas",
    priceCents: 26900,
    description: "Pantalona de cintura alta, caimento fluido.",
    featured: false,
    swatch: "ink",
    imageUrl: "",
  },
  {
    id: "p03",
    name: "Blazer St. Jude's",
    category: "alfaiataria",
    priceCents: 32900,
    description: "Corte reto, botões dourados, ombros estruturados.",
    featured: true,
    swatch: "ink",
    imageUrl: "",
  },
  {
    id: "p04",
    name: "Trench Lexington",
    category: "alfaiataria",
    priceCents: 38900,
    description: "Gabardine impermeável, cinto de amarrar.",
    featured: false,
    swatch: "gold",
    imageUrl: "",
  },
  {
    id: "p05",
    name: "Blusa Serena",
    category: "blusas-tricos",
    priceCents: 18900,
    description: "Seda fluida, gola em laço, para qualquer entrada.",
    featured: true,
    swatch: "blush",
    imageUrl: "",
  },
  {
    id: "p06",
    name: "Tricô Astor",
    category: "blusas-tricos",
    priceCents: 21900,
    description: "Malha canelada, gola alta, edição de inverno.",
    featured: false,
    swatch: "wine",
    imageUrl: "",
  },
  {
    id: "p07",
    name: "Scarpin Chuck",
    category: "sapatos",
    priceCents: 27900,
    description: "Couro envernizado, salto médio, bico fino.",
    featured: false,
    swatch: "ink",
    imageUrl: "",
  },
  {
    id: "p08",
    name: "Bota Sterling",
    category: "sapatos",
    priceCents: 34900,
    description: "Couro estruturado, cadarço lateral, sola tratorada.",
    featured: true,
    swatch: "gold",
    imageUrl: "",
  },
  {
    id: "p09",
    name: "Vestido Van der Woodsen",
    category: "vestidos-blusas",
    priceCents: 42900,
    description: "Seda plissada, para entradas que não passam despercebidas.",
    featured: true,
    swatch: "wine",
    imageUrl: "",
  },
  {
    id: "p10",
    name: "Vestido Blair",
    category: "vestidos-blusas",
    priceCents: 36900,
    description: "Xadrez príncipe de Gales, decote em V.",
    featured: false,
    swatch: "blush",
    imageUrl: "",
  },
];

const TICKER_ITEMS = [
  "Spotted: a nova coleção chegando na vitrine — e sim, é tão boa quanto parece.",
  "Fonte confirma: o trench Lexington já tem fila de espera.",
  "A saia Constance foi vista em três eventos essa semana. Coincidência? Não achamos.",
  "Só um lembrete: você sabe que ama. XOXO.",
  "Reposição do vestido Van der Woodsen chega sexta-feira. Corra.",
];
