/**
 * ReviewConfidenceService
 * Métrica de confiança 0-1 baseada em:
 * - quantidade (log)
 * - distribuição (entropia/desvio)
 * - recência (tempo médio das avaliações)
 * - consistência (variância)
 *
 * Não rotula automaticamente como fake; apenas estima confiança estatística.
 */

export type ReviewForConfidence = {
  rating: number;
  createdAt: Date;
};

export type ConfidenceResult = {
  score: number; // 0-1
  level: "baixa" | "média" | "alta" | "muito alta";
  reasons: string[];
};

export class ReviewConfidenceService {
  static calculate(reviews: ReviewForConfidence[]): ConfidenceResult {
    if (reviews.length === 0) {
      return { score: 0, level: "baixa", reasons: ["Sem avaliações suficientes"] };
    }
    if (reviews.length === 1) {
      return { score: 0.15, level: "baixa", reasons: ["Apenas 1 avaliação — confiança limitada"] };
    }

    const n = reviews.length;

    // 1) Quantidade: log10 escala — 10 => 0.3, 100 =>0.6, 1000=>0.9, 5000=>1
    const quantityScore = Math.min(1, Math.log10(n + 1) / Math.log10(5000));

    // 2) Distribuição: verifica se há distribuição muito enviesada ou polarizada
    // Conta ratings 1-5
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      dist[r.rating] = (dist[r.rating] || 0) + 1;
    });
    const proportions = Object.values(dist).map((c) => c / n);
    // Entropia normalizada 0-1 (quanto mais uniforme, maior entropia mas não necessariamente melhor; queremos distribuição em sino)
    // Heurística: penaliza distribuição extremamente concentrada em 5 estrelas (>95%) ou polarizada 1 e 5
    let distributionScore = 1;
    const fiveStarRatio = (dist[5] || 0) / n;
    const oneStarRatio = (dist[1] || 0) / n;
    if (fiveStarRatio > 0.95) distributionScore *= 0.6; // suspeita de inflação
    else if (fiveStarRatio > 0.85) distributionScore *= 0.8;
    if (oneStarRatio > 0.4 && fiveStarRatio > 0.4) distributionScore *= 0.7; // polarizada
    // Verifica entropia baixa (<0.5) indica pouca diversidade
    const entropy = -proportions.filter((p) => p > 0).reduce((sum, p) => sum + p * Math.log2(p), 0);
    const maxEntropy = Math.log2(5); // ~2.32
    const normEntropy = entropy / maxEntropy;
    if (normEntropy < 0.4) distributionScore *= 0.8;

    // 3) Recência: avalia se reviews são recentes (últimos 12 meses)
    const now = Date.now();
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    const recentCount = reviews.filter((r) => now - r.createdAt.getTime() < oneYearMs).length;
    const recencyRatio = recentCount / n;
    const recencyScore = 0.5 + recencyRatio * 0.5; // 0.5 a 1

    // 4) Consistência: desvio padrão do rating
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / n;
    const variance = reviews.reduce((s, r) => s + Math.pow(r.rating - avg, 2), 0) / n;
    const std = Math.sqrt(variance);
    // std muito baixo (<0.4) com poucas reviews pode indicar artificial; std muito alto (>1.6) indica inconsistência
    let consistencyScore = 1;
    if (std < 0.35 && n < 50) consistencyScore = 0.7;
    if (std > 1.7) consistencyScore = 0.75;
    else if (std > 1.4) consistencyScore = 0.9;

    // combina com pesos
    const score = Math.min(
      1,
      Math.max(
        0,
        quantityScore * 0.45 + distributionScore * 0.25 + recencyScore * 0.15 + consistencyScore * 0.15,
      ),
    );

    let level: ConfidenceResult["level"];
    if (score < 0.35) level = "baixa";
    else if (score < 0.6) level = "média";
    else if (score < 0.85) level = "alta";
    else level = "muito alta";

    const reasons: string[] = [];
    if (n >= 1000) reasons.push(`${n.toLocaleString("pt-BR")} avaliações — volume muito alto`);
    else if (n >= 100) reasons.push(`${n} avaliações — bom volume`);
    else if (n >= 10) reasons.push(`${n} avaliações — volume moderado`);
    else reasons.push(`${n} avaliações — volume baixo`);

    if (recencyRatio > 0.7) reasons.push("Avaliações recentes");
    else if (recencyRatio < 0.3) reasons.push("Muitas avaliações antigas");

    if (fiveStarRatio > 0.9) reasons.push("Concentração muito alta em 5 estrelas");
    if (std > 1.5) reasons.push("Opiniões bastante divididas");

    return { score: Number(score.toFixed(3)), level, reasons };
  }
}
