import { describe, it, expect } from "vitest";
import { PriceStatisticsService } from "./price-statistics.service";

describe("PriceStatisticsService", () => {
  it("zero history", () => {
    const r = PriceStatisticsService.compute([], undefined);
    expect(r.count).toBe(0);
    expect(r.min).toBeNull();
  });

  it("single point", () => {
    const r = PriceStatisticsService.compute([{ price: 100, date: new Date() }], 100);
    expect(r.min).toBe(100);
    expect(r.max).toBe(100);
    expect(r.avg).toBe(100);
  });

  it("average correctly", () => {
    const hist = [{ price: 100, date: new Date(Date.now() - 1000) }, { price: 200, date: new Date() }];
    const r = PriceStatisticsService.compute(hist, 200);
    expect(r.avg).toBe(150);
    expect(r.min).toBe(100);
    expect(r.max).toBe(200);
  });

  it("avg7 filters correctly", () => {
    const now = new Date();
    const old = new Date(now); old.setDate(old.getDate() - 10);
    const hist = [{ price: 100, date: old }, { price: 200, date: now }];
    const r = PriceStatisticsService.compute(hist, 200);
    expect(r.avg7).toBe(200);
    expect(r.avg30).toBe(150);
  });

  it("price extremely low/high edge", () => {
    const hist = [{ price: 0.01, date: new Date() }, { price: 100000, date: new Date() }];
    const r = PriceStatisticsService.compute(hist);
    expect(r.min).toBe(0.01);
    expect(r.max).toBe(100000);
  });
});
