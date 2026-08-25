/*
  Catálogo local — usado como FALLBACK quando o Supabase não está
  configurado (sem config.js) ou a consulta falha/retorna vazia.
  Quando o Supabase responde com produtos, catalog-loader.js sobrescreve
  a variável PRODUCTS com os dados do banco, no mesmo formato abaixo.
  Isso mantém a home funcionando mesmo offline ou antes de configurar as chaves.
*/

const CATEGORIES = [
  { id: "vestidos", label: "Vestidos", glyph: "V" },
  { id: "casacos", label: "Casacos & Blazers", glyph: "C" },
  { id: "bolsas", label: "Bolsas", glyph: "B" },
  { id: "acessorios", label: "Acessórios", glyph: "A" },
];

let PRODUCTS = [
  {
    id: "p01",
    name: "Vestido Constance",
    category: "vestidos",
    priceCents: 68900,
    description: "Alfaiataria fluida em tafetá, comprimento midi.",
    featured: true,
    swatch: "wine",
    imageUrl: "",
  },
  {
    id: "p02",
    name: "Vestido Waldorf",
    category: "vestidos",
    priceCents: 54900,
    description: "Xadrez príncipe de Gales, decote em V.",
    featured: false,
    swatch: "ink",
    imageUrl: "",
  },
  {
    id: "p03",
    name: "Vestido Serena",
    category: "vestidos",
    priceCents: 72900,
    description: "Seda plissada, para entradas que não passam despercebidas.",
    featured: true,
    swatch: "blush",
    imageUrl: "",
  },
  {
    id: "p04",
    name: "Blazer St. Jude's",
    category: "casacos",
    priceCents: 89900,
    description: "Corte reto, botões dourados, ombros estruturados.",
    featured: true,
    swatch: "ink",
    imageUrl: "",
  },
  {
    id: "p05",
    name: "Trench Lexington",
    category: "casacos",
    priceCents: 104900,
    description: "Gabardine impermeável, cinto de amarrar.",
    featured: false,
    swatch: "gold",
    imageUrl: "",
  },
  {
    id: "p06",
    name: "Casaco Van der Woodsen",
    category: "casacos",
    priceCents: 132900,
    description: "Lã dupla-face, forro em cetim assinado.",
    featured: false,
    swatch: "wine",
    imageUrl: "",
  },
  {
    id: "p07",
    name: "Bolsa Astor",
    category: "bolsas",
    priceCents: 94900,
    description: "Couro estruturado, alça removível, fecho em metal dourado.",
    featured: true,
    swatch: "wine",
    imageUrl: "",
  },
  {
    id: "p08",
    name: "Clutch Blair",
    category: "bolsas",
    priceCents: 45900,
    description: "Cetim bordado à mão, corrente fina.",
    featured: false,
    swatch: "blush",
    imageUrl: "",
  },
  {
    id: "p09",
    name: "Colar Sterling",
    category: "acessorios",
    priceCents: 28900,
    description: "Pérolas naturais, fecho em ouro 18k.",
    featured: false,
    swatch: "gold",
    imageUrl: "",
  },
  {
    id: "p10",
    name: "Óculos Chuck",
    category: "acessorios",
    priceCents: 32900,
    description: "Armação em acetato, lentes degradê.",
    featured: false,
    swatch: "ink",
    imageUrl: "",
  },
];

const TICKER_ITEMS = [
  "Spotted: a nova coleção chegando na vitrine — e sim, é tão boa quanto parece.",
  "Fonte confirma: o trench Lexington já tem fila de espera.",
  "A clutch Blair foi vista em três eventos essa semana. Coincidência? Não achamos.",
  "Só um lembrete: você sabe que ama. XOXO.",
  "Reposição do vestido Constance chega sexta-feira. Corra.",
];
