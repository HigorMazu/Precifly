/**
 * PriceStatisticsService
 * Calcula estatísticas de preço a partir de histórico.
 * Cada alteração/coleta de preço gera histórico.
 */
export type PricePoint = { price: number; date: Date };

export type PriceStatistics = {
  current: number | null;
  min: number | null;
  max: number | null;
  avg: number | null;
  avg7: number | null;
  avg30: number | null;
  avg90: number | null;
  count: number;
};

export class PriceStatisticsService {
  static compute(history: PricePoint[], currentPrice?: number): PriceStatistics {
    if (history.length === 0 && currentPrice === undefined) {
      return { current: null, min: null, max: null, avg: null, avg7: null, avg30: null, avg90: null, count: 0 };
    }

    const allPrices = [...history.map((h) => h.price)];
    // currentPrice é considerado o preço atual; se não estiver no histórico, inclui para média? Não, histórico já reflete ofertas.
    const current = currentPrice ?? (history.length > 0 ? history[history.length - 1].price : null);

    if (allPrices.length === 0) {
      return { current, min: current, max: current, avg: current, avg7: current, avg30: current, avg90: current, count: 0 };
    }

    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    const avg = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;

    const now = new Date();
    const avgForDays = (days: number): number | null => {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - days);
      const filtered = history.filter((h) => h.date >= cutoff).map((h) => h.price);
      if (filtered.length === 0) return null;
      return filtered.reduce((a, b) => a + b, 0) / filtered.length;
    };

    return {
      current,
      min,
      max,
      avg,
      avg7: avgForDays(7),
      avg30: avgForDays(30),
      avg90: avgForDays(90),
      count: history.length,
    };
  }

  /**
   * Versão que recebe Decimal/string do Prisma
   */
  static fromPrismaHistory(
    history: { price: string | number | { toNumber: () => number }; recordedAt: Date }[],
    currentPrice?: number,
  ): PriceStatistics {
    const points: PricePoint[] = history.map((h) => ({
      price: typeof h.price === "object" && "toNumber" in h.price ? (h.price as { toNumber: () => number }).toNumber() : Number(h.price),
      date: h.recordedAt,
    }));
    return this.compute(points, currentPrice);
  }
}
