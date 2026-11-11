import type { Seller, Product, Review } from "./types";

const reviewsJoao: Review[] = [
  {
    id: "r1",
    author: "Carlos M.",
    rating: 5,
    date: "2026-07-12",
    comment: "Produto conforme anunciado, entrega rápida e vendedor muito atencioso.",
    productName: "Bicicleta Dobrável Elétrica",
  },
  {
    id: "r2",
    author: "Ana P.",
    rating: 4,
    date: "2026-06-28",
    comment: "Tudo certo, recomendo!",
    productName: "Mountain Bike Elétrica",
  },
  {
    id: "r3",
    author: "Rafael S.",
    rating: 5,
    date: "2026-06-02",
    comment: "Comprei com a garantia da OLX e foi perfeito.",
    productName: "Scooter Elétrica",
  },
];

export const sellers: Seller[] = [
  {
    id: "s1",
    name: "João Silva",
    avatarInitials: "JS",
    location: "São Paulo, SP",
    online: true,
    since: "2021",
    rating: 4.8,
    reviewsCount: 127,
    verified: true,
    reviews: reviewsJoao,
  },
  {
    id: "s2",
    name: "TechStore Brasil",
    avatarInitials: "TS",
    location: "Balneário Camboriú, SC",
    online: false,
    since: "2019",
    rating: 4.9,
    reviewsCount: 542,
    verified: true,
    reviews: reviewsJoao.slice(0, 2),
  },
];

const img = (seed: string, w = 800, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const products: Product[] = [
  {
    id: "p1",
    slug: "bicicleta-dobravel-eletrica",
    title: "Bicicleta Dobrável Elétrica",
    price: 2899.9,
    installments: "12x sem juros",
    category: "Bicicletas Elétricas",
    condition: "Novo",
    location: "São Paulo, SP",
    images: [img("bike1"), img("bike1b"), img("bike1c"), img("bike1d")],
    description:
      "Bicicleta dobrável elétrica com autonomia de 40km, motor 250W e bateria removível. Ideal para o deslocamento urbano, leve e prática para guardar em qualquer lugar.",
    details: [
      { label: "Potência Motor", value: "250W" },
      { label: "Autonomia", value: "40 km" },
      { label: "Peso", value: "18 kg" },
      { label: "Condição", value: "Novo" },
    ],
    freeShipping: true,
    shippingTime: "2 dias úteis",
    seller: sellers[0],
    badges: ["Frete grátis", "Garantia OLX"],
    createdAt: "2026-07-20",
  },
  {
    id: "p2",
    slug: "mountain-bike-eletrica",
    title: "Mountain Bike Elétrica",
    price: 4499.0,
    installments: "12x sem juros",
    category: "Bicicletas Elétricas",
    condition: "Seminovo",
    location: "Balneário Camboriú, SC",
    images: [img("mtb1"), img("mtb1b"), img("mtb1c")],
    description:
      "Mountain bike elétrica com suspensão dianteira, freios a disco hidráulico e estrutura reforçada para trilhas.",
    details: [
      { label: "Potência Motor", value: "350W" },
      { label: "Suspensão", value: "Dianteira 100mm" },
      { label: "Condição", value: "Seminovo" },
    ],
    freeShipping: true,
    shippingTime: "3 dias úteis",
    seller: sellers[1],
    badges: ["Frete grátis"],
    createdAt: "2026-07-18",
  },
  {
    id: "p3",
    slug: "scooter-eletrica",
    title: "Scooter Elétrica",
    price: 3299.0,
    installments: "10x sem juros",
    category: "Bicicletas Elétricas",
    condition: "Novo",
    location: "São Paulo, SP",
    images: [img("scoot1"), img("scoot1b")],
    description:
      "Scooter elétrica urbana, silenciosa e econômica. Bateria recarregável em 4 horas.",
    details: [
      { label: "Potência Motor", value: "500W" },
      { label: "Velocidade Máx.", value: "25 km/h" },
      { label: "Condição", value: "Novo" },
    ],
    freeShipping: false,
    shippingTime: "5 dias úteis",
    seller: sellers[0],
    badges: ["Garantia OLX"],
    createdAt: "2026-07-15",
  },
  {
    id: "p4",
    slug: "patinete-eletrico",
    title: "Patinete Elétrico",
    price: 1599.0,
    installments: "12x sem juros",
    category: "Bicicletas Elétricas",
    condition: "Novo",
    location: "São Paulo, SP",
    images: [img("pat1"), img("pat1b"), img("pat1c")],
    description:
      "Patinete elétrico dobrável, leve e portátil. Autonomia de 25km e painel digital.",
    details: [
      { label: "Potência Motor", value: "300W" },
      { label: "Autonomia", value: "25 km" },
      { label: "Condição", value: "Novo" },
    ],
    freeShipping: true,
    shippingTime: "2 dias úteis",
    seller: sellers[0],
    badges: ["Frete grátis"],
    createdAt: "2026-07-22",
  },
  {
    id: "p5",
    slug: "maquina-de-lavar",
    title: "Máquina de Lavar",
    price: 1299.0,
    installments: "10x sem juros",
    category: "Eletrodomésticos",
    condition: "Seminovo",
    location: "Balneário Camboriú, SC",
    images: [img("wash1"), img("wash1b")],
    description:
      "Máquina de lavar automática 12kg, baixo consumo de água e energia. Pouco uso.",
    details: [
      { label: "Capacidade", value: "12 kg" },
      { label: "Condição", value: "Seminovo" },
    ],
    freeShipping: false,
    shippingTime: "4 dias úteis",
    seller: sellers[1],
    badges: [],
    createdAt: "2026-07-10",
  },
  {
    id: "p6",
    slug: "televisao-smart-50",
    title: "Televisão Smart 50\"",
    price: 2199.0,
    installments: "12x sem juros",
    category: "Eletrodomésticos",
    condition: "Novo",
    location: "São Paulo, SP",
    images: [img("tv1"), img("tv1b"), img("tv1c")],
    description:
      "TV Smart 50 polegadas 4K com Wi-Fi, controle por voz e apps de streaming.",
    details: [
      { label: "Tela", value: '50" 4K' },
      { label: "Resolução", value: "3840x2160" },
      { label: "Condição", value: "Novo" },
    ],
    freeShipping: true,
    shippingTime: "2 dias úteis",
    seller: sellers[0],
    badges: ["Frete grátis", "Garantia OLX"],
    createdAt: "2026-07-21",
  },
  {
    id: "p7",
    slug: "rodas-originais-vw",
    title: "Rodas originais VW em ótimo estado de conservação",
    price: 1800.0,
    installments: "6x sem juros",
    category: "Peças e Acessórios Automotivos",
    condition: "Usado",
    location: "São Paulo, SP",
    images: [img("wheel1"), img("wheel1b")],
    description:
      "Jogo de rodas originais Volkswagen aro 17, sem amassados, com pneus em bom estado.",
    details: [
      { label: "Aro", value: "17" },
      { label: "Condição", value: "Usado" },
    ],
    freeShipping: false,
    shippingTime: "7 dias úteis",
    seller: sellers[0],
    badges: [],
    createdAt: "2026-07-05",
  },
  {
    id: "p8",
    slug: "equipamento-de-audio",
    title: "Equipamento de Áudio Profissional",
    price: 2650.0,
    installments: "10x sem juros",
    category: "Periféricos",
    condition: "Seminovo",
    location: "Balneário Camboriú, SC",
    images: [img("audio1"), img("audio1b")],
    description:
      "Mixer, caixas acústicas e microfones. Kit completo para eventos.",
    details: [
      { label: "Potência", value: "1200W" },
      { label: "Condição", value: "Seminovo" },
    ],
    freeShipping: false,
    shippingTime: "5 dias úteis",
    seller: sellers[1],
    badges: [],
    createdAt: "2026-07-08",
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q),
  );
}
