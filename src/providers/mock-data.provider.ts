/**
 * Mock Data Providers — arquitetura parece integração real,
 * mas dados são mock/seed. Nunca apresentar mock como dado real.
 */

export type MockStore = { id: string; name: string; slug: string; logoUrl?: string; website?: string };
export type MockProductSeed = {
  name: string;
  slug: string;
  description: string;
  brand: string;
  categorySlug: string;
  imageUrl: string;
  specs: { key: string; value: string }[];
  offers: { storeSlug: string; price: number; url: string; availability: boolean }[];
  reviews: { rating: number; content: string; authorName: string; verifiedPurchase: boolean; daysAgo: number }[];
  priceHistoryDays: number; // gera histórico de N dias com variação
};

export interface ProductDataProvider {
  getProducts(): Promise<MockProductSeed[]>;
}
export interface PriceDataProvider {
  getPriceHistory(productSlug: string): Promise<{ price: number; date: Date }[]>;
}
export interface ReviewDataProvider {
  getReviews(productSlug: string): Promise<{ rating: number; content: string }[]>;
}

// Implementação mock centralizada

export class MockProductDataProvider implements ProductDataProvider {
  async getProducts(): Promise<MockProductSeed[]> {
    // Dados mockados são apenas para seed; em produção viriam de integração.
    return MOCK_PRODUCTS;
  }
}

export const MOCK_STORES: MockStore[] = [
  { id: "store-1", name: "Amazon", slug: "amazon", website: "https://amazon.com.br" },
  { id: "store-2", name: "Magazine Luiza", slug: "magalu", website: "https://magazineluiza.com.br" },
  { id: "store-3", name: "Kabum", slug: "kabum", website: "https://kabum.com.br" },
  { id: "store-4", name: "Americanas", slug: "americanas", website: "https://americanas.com.br" },
];

export const MOCK_PRODUCTS: MockProductSeed[] = [
  {
    name: "Smartphone Galaxy S24 Ultra 256GB",
    slug: "smartphone-galaxy-s24-ultra-256gb",
    description: "Smartphone premium com câmera 200MP, S Pen integrada e Snapdragon 8 Gen 3. Tela AMOLED 6.8\" 120Hz.",
    brand: "Samsung",
    categorySlug: "smartphones",
    imageUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600",
    specs: [
      { key: "Tela", value: "6.8\" Dynamic AMOLED 2X 120Hz" },
      { key: "Processador", value: "Snapdragon 8 Gen 3" },
      { key: "RAM", value: "12GB" },
      { key: "Armazenamento", value: "256GB" },
      { key: "Câmera", value: "200MP + 12MP + 10MP + 50MP" },
      { key: "Bateria", value: "5000mAh" },
    ],
    offers: [
      { storeSlug: "amazon", price: 5299, url: "https://amazon.com.br/s24ultra", availability: true },
      { storeSlug: "magalu", price: 5499, url: "https://magazineluiza.com.br/s24ultra", availability: true },
      { storeSlug: "kabum", price: 5199, url: "https://kabum.com.br/s24ultra", availability: true },
    ],
    reviews: Array.from({ length: 8421 }, (_, i) => ({
      rating: i < 6000 ? 5 : i < 7500 ? 4 : i < 8000 ? 3 : i < 8300 ? 2 : 1,
      content: "Ótimo celular, superou expectativas. Bateria dura muito.",
      authorName: `Usuario ${i + 1}`,
      verifiedPurchase: i % 3 !== 0,
      daysAgo: Math.floor(Math.random() * 400),
    })).slice(0, 120), // para seed limitamos a 120 para não estourar
    priceHistoryDays: 90,
  },
  {
    name: "Notebook MacBook Air M2 256GB",
    slug: "notebook-macbook-air-m2-256gb",
    description: "MacBook Air com chip M2, 8GB RAM, tela Liquid Retina 13.6\" e até 18h de bateria.",
    brand: "Apple",
    categorySlug: "notebooks",
    imageUrl: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600",
    specs: [
      { key: "Tela", value: "13.6\" Liquid Retina" },
      { key: "Processador", value: "Apple M2" },
      { key: "RAM", value: "8GB" },
      { key: "Armazenamento", value: "256GB SSD" },
      { key: "Bateria", value: "Até 18h" },
    ],
    offers: [
      { storeSlug: "amazon", price: 7499, url: "https://amazon.com.br/m2", availability: true },
      { storeSlug: "magalu", price: 7899, url: "https://magazineluiza.com.br/m2", availability: false },
    ],
    reviews: Array.from({ length: 50 }, (_, i) => ({
      rating: i < 40 ? 5 : i < 46 ? 4 : 3,
      content: i % 2 === 0 ? "Leve, rápido e bateria excelente." : "Tela linda, mas preço elevado.",
      authorName: `Cliente ${i + 1}`,
      verifiedPurchase: true,
      daysAgo: Math.floor(Math.random() * 200),
    })),
    priceHistoryDays: 90,
  },
  {
    name: "Fone de Ouvido Sony WH-1000XM5",
    slug: "fone-sony-wh-1000xm5",
    description: "Fone com cancelamento de ruído líder de mercado, 30h bateria, Alexa/Google.",
    brand: "Sony",
    categorySlug: "audio",
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600",
    specs: [
      { key: "Cancelamento", value: "Ativo ANC" },
      { key: "Bateria", value: "30h" },
      { key: "Conectividade", value: "Bluetooth 5.2" },
      { key: "Peso", value: "250g" },
    ],
    offers: [
      { storeSlug: "amazon", price: 1899, url: "https://amazon.com.br/xm5", availability: true },
      { storeSlug: "kabum", price: 1799, url: "https://kabum.com.br/xm5", availability: true },
      { storeSlug: "americanas", price: 1999, url: "https://americanas.com.br/xm5", availability: true },
    ],
    reviews: Array.from({ length: 312 }, (_, i) => ({
      rating: i < 200 ? 5 : i < 270 ? 4 : i < 295 ? 3 : i < 305 ? 2 : 1,
      content: i % 3 === 0 ? "Cancelamento incrível!" : i % 3 === 1 ? "Confortável para uso longo." : "Microfone deixa a desejar em chamadas.",
      authorName: `Reviewer ${i + 1}`,
      verifiedPurchase: i % 4 !== 0,
      daysAgo: Math.floor(Math.random() * 600),
    })).slice(0, 80),
    priceHistoryDays: 90,
  },
  {
    name: "Smart TV LG 55\" OLED C3 4K",
    slug: "smart-tv-lg-55-oled-c3-4k",
    description: "TV OLED evo 55\" 4K 120Hz, webOS 23, Dolby Vision, 4x HDMI 2.1.",
    brand: "LG",
    categorySlug: "tvs",
    imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f367d8?w=600",
    specs: [
      { key: "Tela", value: "55\" OLED 4K 120Hz" },
      { key: "Sistema", value: "webOS 23" },
      { key: "HDMI", value: "4x HDMI 2.1" },
      { key: "Áudio", value: "Dolby Atmos" },
    ],
    offers: [
      { storeSlug: "magalu", price: 4599, url: "https://magazineluiza.com.br/lgc3", availability: true },
      { storeSlug: "amazon", price: 4699, url: "https://amazon.com.br/lgc3", availability: true },
    ],
    reviews: Array.from({ length: 89 }, (_, i) => ({
      rating: i < 60 ? 5 : i < 75 ? 4 : i < 82 ? 3 : 2,
      content: "Imagem perfeita, pretos infinitos.",
      authorName: `Comprador ${i + 1}`,
      verifiedPurchase: true,
      daysAgo: Math.floor(Math.random() * 300),
    })),
    priceHistoryDays: 90,
  },
  {
    name: "Cadeira Gamer ThunderX3 TGC12",
    slug: "cadeira-gamer-thunderx3-tgc12",
    description: "Cadeira ergonômica, couro sintético, ajuste lombar, até 120kg, reclinável 180º.",
    brand: "ThunderX3",
    categorySlug: "cadeiras",
    imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600",
    specs: [
      { key: "Material", value: "Couro sintético" },
      { key: "Peso suportado", value: "120kg" },
      { key: "Reclínio", value: "180º" },
      { key: "Apoio", value: "Lombar ajustável" },
    ],
    offers: [{ storeSlug: "kabum", price: 899, url: "https://kabum.com.br/cadeira", availability: true }],
    reviews: Array.from({ length: 7 }, (_, i) => ({
      rating: i < 4 ? 5 : i < 6 ? 4 : 1,
      content: i === 6 ? "Quebrou em 2 meses, apoio frágil." : "Confortável e bonita.",
      authorName: `User ${i + 1}`,
      verifiedPurchase: true,
      daysAgo: Math.floor(Math.random() * 100),
    })),
    priceHistoryDays: 60,
  },
];
