/**
 * PrecifyScoreService
 * Entrada: preço atual, preço médio, mínimo histórico, rating, volume, confiança, insights, specs, promoção
 * Saída: score 0-100, classificação, razões, alertas
 *
 * Lógica no domínio/backend — não repetir no frontend.
 */

import { getWeightsForCategory } from "./precify-score.config";

export type PrecifyScoreInput = {
  currentPrice: number | null;
  avgPrice: number | null;
  minPrice: number | null;
  rating: number | null; // 0-5
  reviewCount: number;
  confidenceScore: number; // 0-1
  hasPromotion?: boolean;
  discountPercent?: number; // 0-100 se promotion
  categorySlug?: string;
  positiveThemes?: string[];
  negativeThemes?: string[];
};

export type PrecifyScoreOutput = {
  score: number; // 0-100
  classification: string;
  reasons: string[];
  alerts: string[];
  breakdown: {
    price: number;
    rating: number;
    volume: number;
    confidence: number;
    promotion: number;
    specs: number;
  };
};

export class PrecifyScoreService {
  static calculate(input: PrecifyScoreInput): PrecifyScoreOutput {
    const weights = getWeightsForCategory(input.categorySlug);

    const reasons: string[] = [];
    const alerts: string[] = [];

    // ---- Price subscore 0-100 ----
    let priceScore = 50; // neutro
    if (input.currentPrice !== null && input.avgPrice !== null && input.avgPrice > 0) {
      const diffVsAvg = (input.avgPrice - input.currentPrice) / input.avgPrice; // positivo = abaixo média
      // diff 0.11 => 11% abaixo média => bom
      // mapeia -0.3 a +0.3 => 0 a 100
      // abaixo da média é bom
      priceScore = Math.max(0, Math.min(100, 50 + diffVsAvg * 200));
      // bonus se é mínimo histórico
      if (input.minPrice !== null && input.currentPrice <= input.minPrice * 1.02) {
        priceScore = Math.min(100, priceScore + 15);
        reasons.push("Preço próximo ao mínimo histórico");
      }
      if (diffVsAvg > 0.05) {
        reasons.push(`Preço ${Math.round(diffVsAvg * 100)}% abaixo da média`);
      } else if (diffVsAvg < -0.1) {
        alerts.push(`Preço ${Math.round(Math.abs(diffVsAvg) * 100)}% acima da média`);
        priceScore = Math.max(0, priceScore - 10);
      } else {
        reasons.push("Preço próximo à média histórica");
      }
    } else if (input.currentPrice !== null && input.minPrice !== null) {
      if (input.currentPrice <= input.minPrice * 1.05) {
        priceScore = 85;
        reasons.push("Preço próximo ao menor valor registrado");
      }
    }

    // ---- Rating subscore 0-100 ----
    let ratingScore = 50;
    if (input.rating !== null) {
      ratingScore = (input.rating / 5) * 100;
      if (input.rating >= 4.7 && input.reviewCount >= 100) {
        reasons.push(`${input.rating.toFixed(1)} estrelas em ${input.reviewCount.toLocaleString("pt-BR")} avaliações`);
      } else if (input.rating >= 4.5) {
        reasons.push(`Boa avaliação: ${input.rating.toFixed(1)} estrelas`);
      } else if (input.rating < 3.5) {
        alerts.push(`Avaliação baixa: ${input.rating.toFixed(1)} estrelas`);
      }
    } else {
      ratingScore = 30;
      alerts.push("Sem avaliações suficientes");
    }

    // ---- Volume subscore ----
    let volumeScore = 0;
    if (input.reviewCount === 0) volumeScore = 0;
    else if (input.reviewCount < 10) volumeScore = 20;
    else if (input.reviewCount < 50) volumeScore = 50;
    else if (input.reviewCount < 200) volumeScore = 70;
    else if (input.reviewCount < 1000) volumeScore = 85;
    else volumeScore = 95;
    if (input.reviewCount >= 1000) reasons.push(`Volume alto de avaliações (${input.reviewCount.toLocaleString("pt-BR")})`);

    // ---- Confidence subscore ----
    const confidenceScore = input.confidenceScore * 100;
    if (input.confidenceScore >= 0.8) reasons.push("Alta confiança nas avaliações");
    else if (input.confidenceScore < 0.35) alerts.push("Baixa confiança nas avaliações — interprete com cautela");

    // ---- Promotion subscore ----
    let promotionScore = 50;
    if (input.hasPromotion) {
      const disc = input.discountPercent ?? 0;
      promotionScore = Math.min(100, 60 + disc * 1.5);
      if (disc > 15) reasons.push(`Promoção ativa com ${disc}% de desconto`);
      else if (disc > 0) reasons.push("Promoção ativa");
      else reasons.push("Oferta com disponibilidade");
    } else {
      promotionScore = 45;
    }

    // ---- Specs subscore ----
    const specsScore = 60; // placeholder neutro até ter lógica de comparação de specs

    // ---- Alertas de insights ----
    if (input.negativeThemes && input.negativeThemes.length > 0) {
      // pega até 2 negativos para alerta
      input.negativeThemes.slice(0, 2).forEach((t) => alerts.push(t));
    }
    if (input.positiveThemes && input.positiveThemes.length > 0 && input.rating !== null && input.rating >= 4.3) {
      // já coberto em reasons, mas adiciona um positivo
      // não duplica
    }

    // ---- Cálculo final ----
    const total =
      priceScore * weights.price +
      ratingScore * weights.rating +
      volumeScore * weights.volume +
      confidenceScore * weights.confidence +
      promotionScore * weights.promotion +
      specsScore * weights.specs;

    const score = Math.round(Math.max(0, Math.min(100, total)));

    let classification: string;
    if (score >= 90) classification = "Excelente compra";
    else if (score >= 80) classification = "Ótima compra";
    else if (score >= 65) classification = "Boa compra";
    else if (score >= 50) classification = "Compra razoável";
    else if (score >= 35) classification = "Compra com ressalvas";
    else classification = "Não recomendado";

    // garante pelo menos 1 reason
    if (reasons.length === 0) reasons.push("Análise baseada nos dados disponíveis");

    return {
      score,
      classification,
      reasons: reasons.slice(0, 4),
      alerts: alerts.slice(0, 3),
      breakdown: {
        price: Math.round(priceScore),
        rating: Math.round(ratingScore),
        volume: Math.round(volumeScore),
        confidence: Math.round(confidenceScore),
        promotion: Math.round(promotionScore),
        specs: Math.round(specsScore),
      },
    };
  }
}
