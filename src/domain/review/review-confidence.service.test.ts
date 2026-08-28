import { describe, it, expect } from "vitest";
import { ReviewConfidenceService } from "./review-confidence.service";

describe("ReviewConfidenceService", () => {
  it("zero reviews", () => {
    const r = ReviewConfidenceService.calculate([]);
    expect(r.score).toBe(0);
    expect(r.level).toBe("baixa");
  });
  it("single review low confidence", () => {
    const r = ReviewConfidenceService.calculate([{ rating: 5, createdAt: new Date() }]);
    expect(r.score).toBe(0.15);
  });
  it("many reviews high confidence", () => {
    const reviews = Array.from({ length: 5000 }, () => ({ rating: 5, createdAt: new Date() }));
    // mesclando ratings para evitar penalidade de 95% 5 estrelas
    reviews.forEach((r, i) => (r.rating = i % 10 === 0 ? 4 : 5));
    const res = ReviewConfidenceService.calculate(reviews);
    expect(res.score).toBeGreaterThan(0.7);
  });
  it("thousands varied", () => {
    const reviews = Array.from({ length: 2000 }, (_, i) => ({ rating: (i % 5) + 1, createdAt: new Date(Date.now() - i * 100000) }));
    const res = ReviewConfidenceService.calculate(reviews);
    expect(res.score).toBeGreaterThan(0.5);
  });
  it("polarized distribution penalized", () => {
    const reviews = [...Array(50).fill({ rating: 1, createdAt: new Date() }), ...Array(50).fill({ rating: 5, createdAt: new Date() })];
    const res = ReviewConfidenceService.calculate(reviews);
    expect(res.score).toBeLessThan(0.9);
  });
});
