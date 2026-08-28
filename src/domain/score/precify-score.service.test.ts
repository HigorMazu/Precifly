import { describe, it, expect } from "vitest";
import { PrecifyScoreService } from "./precify-score.service";

describe("PrecifyScoreService", () => {
  it("score 0-100 range", () => {
    const s = PrecifyScoreService.calculate({
      currentPrice: 100,
      avgPrice: 100,
      minPrice: 90,
      rating: 4.5,
      reviewCount: 100,
      confidenceScore: 0.8,
    });
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.score).toBeLessThanOrEqual(100);
  });

  it("price 11% below avg gives good score", () => {
    const s = PrecifyScoreService.calculate({
      currentPrice: 89,
      avgPrice: 100,
      minPrice: 80,
      rating: 4.7,
      reviewCount: 8421,
      confidenceScore: 0.9,
      hasPromotion: true,
      discountPercent: 11,
    });
    expect(s.score).toBeGreaterThan(80);
    expect(s.classification).toMatch(/Excelente|Ótima/);
    expect(s.reasons.join(" ")).toMatch(/11%/);
  });

  it("zero reviews edge", () => {
    const s = PrecifyScoreService.calculate({
      currentPrice: 100,
      avgPrice: 100,
      minPrice: 100,
      rating: null,
      reviewCount: 0,
      confidenceScore: 0,
    });
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.alerts.length).toBeGreaterThan(0);
  });

  it("extremely low price boost", () => {
    const s = PrecifyScoreService.calculate({
      currentPrice: 10,
      avgPrice: 100,
      minPrice: 10,
      rating: 5,
      reviewCount: 1000,
      confidenceScore: 1,
    });
    expect(s.score).toBeGreaterThan(85);
  });

  it("extremely high price penalty", () => {
    const s = PrecifyScoreService.calculate({
      currentPrice: 200,
      avgPrice: 100,
      minPrice: 90,
      rating: 4.5,
      reviewCount: 100,
      confidenceScore: 0.7,
    });
    expect(s.score).toBeLessThan(70);
    expect(s.alerts.some((a) => a.includes("acima da média"))).toBe(true);
  });

  it("no offer price null", () => {
    const s = PrecifyScoreService.calculate({
      currentPrice: null,
      avgPrice: null,
      minPrice: null,
      rating: 4,
      reviewCount: 10,
      confidenceScore: 0.5,
    });
    expect(s.score).toBeGreaterThanOrEqual(0);
  });
});
