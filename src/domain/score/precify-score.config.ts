/**
 * Configuração centralizada de pesos do Precify Score.
 * Permite evolução e pesos por categoria.
 */

export type ScoreWeights = {
  price: number; // peso preço vs média/mínimo
  rating: number; // peso rating
  volume: number; // peso volume reviews
  confidence: number; // peso confiança
  promotion: number; // peso promoção/oportunidade
  specs: number; // peso especificações (futuro)
};

export type ScoreConfig = {
  default: ScoreWeights;
  byCategory?: Record<string, ScoreWeights>; // slug categoria -> pesos
};

// Pesos devem somar 1. Centralizado.
export const PRECIFY_SCORE_CONFIG: ScoreConfig = {
  default: {
    price: 0.3,
    rating: 0.25,
    volume: 0.15,
    confidence: 0.15,
    promotion: 0.1,
    specs: 0.05,
  },
  byCategory: {
    // exemplo: eletrônicos valorizam mais preço e confiança
    // "smartphones": { price: 0.35, rating: 0.2, volume: 0.15, confidence: 0.15, promotion: 0.1, specs: 0.05 },
  },
};

export function getWeightsForCategory(categorySlug?: string): ScoreWeights {
  if (categorySlug && PRECIFY_SCORE_CONFIG.byCategory?.[categorySlug]) {
    return PRECIFY_SCORE_CONFIG.byCategory[categorySlug];
  }
  return PRECIFY_SCORE_CONFIG.default;
}
