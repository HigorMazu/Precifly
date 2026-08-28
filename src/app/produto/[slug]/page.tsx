import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatBRL } from "@/lib/utils";
import ScoreBadge from "@/components/ScoreBadge";
import PriceChart from "@/components/PriceChart";
import { PriceStatisticsService } from "@/domain/price/price-statistics.service";
import { ReviewConfidenceService } from "@/domain/review/review-confidence.service";
import { PrecifyScoreService } from "@/domain/score/precify-score.service";
import ProductActions from "./ProductActions";

export const dynamic = "force-dynamic";

export default async function ProdutoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: { category: true, specs: true, offers: { include: { store: true } }, reviewInsight: true },
  });
  if (!product) notFound();

  const [history, reviews] = await Promise.all([
    prisma.priceHistory.findMany({ where: { productId: product.id }, orderBy: { recordedAt: "asc" } }),
    prisma.review.findMany({ where: { productId: product.id }, select: { rating: true, createdAt: true } }),
  ]);

  const reviewsFull = await prisma.review.findMany({ where: { productId: product.id }, orderBy: { createdAt: "desc" }, take: 5 });

  const currentPrice = product.offers.length ? Math.min(...product.offers.map((o) => Number(o.price))) : null;
  const stats = PriceStatisticsService.fromPrismaHistory(history, currentPrice ?? undefined);
  const confidence = ReviewConfidenceService.calculate(reviews);
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  const hasPromotion = product.offers.some((o) => o.availability) && currentPrice !== null && stats.avg !== null && currentPrice < stats.avg * 0.95;
  const discountPercent = hasPromotion && stats.avg ? Math.round(((stats.avg - currentPrice!) / stats.avg) * 100) : undefined;

  const score = PrecifyScoreService.calculate({
    currentPrice,
    avgPrice: stats.avg,
    minPrice: stats.min,
    rating: avgRating,
    reviewCount: reviews.length,
    confidenceScore: confidence.score,
    hasPromotion,
    discountPercent,
    categorySlug: product.category.slug,
    positiveThemes: product.reviewInsight?.positiveThemes ?? [],
    negativeThemes: product.reviewInsight?.negativeThemes ?? [],
  });

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => distribution[r.rating]++);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* Esquerda */}
        <div>
          <div className="rounded-3xl bg-white border p-6 flex flex-col sm:flex-row gap-6">
            <div className="h-64 w-full sm:w-64 bg-zinc-50 rounded-2xl overflow-hidden flex-shrink-0">
              {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" /> : <div className="h-full flex items-center justify-center text-zinc-400">Sem imagem</div>}
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold tracking-wide text-violet-600 uppercase">{product.category.name} • {product.brand}</span>
              <h1 className="text-2xl font-black leading-tight mt-1">{product.name}</h1>
              <p className="text-sm text-zinc-600 mt-2">{product.description}</p>

              <div className="mt-4 flex flex-wrap gap-3">
                <div className="rounded-2xl bg-zinc-900 text-white px-4 py-3">
                  <div className="text-xs text-white/70">Menor preço</div>
                  <div className="text-xl font-black">{currentPrice ? formatBRL(currentPrice) : "Indisponível"}</div>
                  {stats.min && currentPrice && <div className="text-xs text-white/70">Mín histórico: {formatBRL(stats.min)} • Média: {stats.avg ? formatBRL(stats.avg) : "—"}</div>}
                </div>
                <div className="rounded-2xl border px-4 py-3">
                  <div className="text-xs text-zinc-500">Avaliação</div>
                  <div className="font-bold">{avgRating ? `${avgRating.toFixed(1)} ★` : "—"} <span className="font-normal text-zinc-500">({reviews.length})</span></div>
                  <div className="text-xs">Confiança: <span className="font-bold capitalize">{confidence.level}</span> ({Math.round(confidence.score * 100)}%)</div>
                </div>
              </div>

              <ProductActions productId={product.id} productSlug={product.slug} productName={product.name} />
            </div>
          </div>

          {/* Ofertas */}
          <div className="mt-6 rounded-3xl bg-white border p-6">
            <h2 className="font-bold">Ofertas disponíveis</h2>
            <div className="mt-4 grid gap-3">
              {product.offers.length === 0 ? <p className="text-sm text-zinc-500">Nenhuma oferta cadastrada.</p> : product.offers.sort((a,b)=>Number(a.price)-Number(b.price)).map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-2xl border p-4 hover:bg-zinc-50">
                  <div>
                    <div className="font-bold">{o.store.name}</div>
                    <div className="text-xs text-zinc-500">{o.availability ? "Disponível" : "Indisponível"} • {o.store.website}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-lg">{formatBRL(Number(o.price))}</div>
                    <a href={o.url} target="_blank" className="text-xs font-bold text-violet-600 hover:underline">Ver oferta →</a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico */}
          <div className="mt-6">
            <h2 className="font-bold mb-3">Histórico de preço</h2>
            <PriceChart history={history.map((h) => ({ date: h.recordedAt.toISOString(), price: Number(h.price) }))} stats={stats} />
          </div>

          {/* Especificações */}
          <div className="mt-6 rounded-3xl bg-white border p-6">
            <h2 className="font-bold">Especificações</h2>
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {product.specs.map((s) => (
                <div key={s.id} className="rounded-xl bg-zinc-50 px-4 py-3">
                  <dt className="text-zinc-500 text-xs uppercase tracking-wide">{s.key}</dt>
                  <dd className="font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Direita - Score + Reviews */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-white border p-6">
            <h2 className="font-bold">Precify Score</h2>
            <div className="mt-4">
              <ScoreBadge score={score.score} classification={score.classification} />
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-bold">Por que esse score?</h3>
              <ul className="space-y-1.5">
                {score.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm"><span className="text-emerald-600">✓</span> {r}</li>
                ))}
              </ul>
              {score.alerts.length > 0 && (
                <>
                  <h3 className="text-sm font-bold mt-4">Atenção</h3>
                  <ul className="space-y-1.5">
                    {score.alerts.map((a, i) => (
                      <li key={i} className="flex gap-2 text-sm text-amber-700"><span>⚠</span> {a}</li>
                    ))}
                  </ul>
                </>
              )}
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                {Object.entries(score.breakdown).map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-zinc-50 px-2 py-2 text-center">
                    <div className="text-zinc-500 capitalize">{k}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white border p-6">
            <h2 className="font-bold">Avaliações</h2>
            <div className="mt-3">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black">{avgRating ? avgRating.toFixed(1) : "—"}</span>
                <span className="text-sm text-zinc-500 mb-1">de 5 • {reviews.length} avaliações</span>
              </div>
              <div className="mt-3 space-y-1">
                {[5,4,3,2,1].map((s) => {
                  const count = distribution[s] || 0;
                  const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={s} className="flex items-center gap-2 text-xs">
                      <span className="w-6">{s}★</span>
                      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 rounded-xl bg-violet-50 border border-violet-200 px-3 py-2 text-xs">
                <span className="font-bold">Confiança {confidence.level}</span> — {Math.round(confidence.score*100)}% • {confidence.reasons.join(" • ")}
              </div>
              {product.reviewInsight && (
                <div className="mt-4 text-sm">
                  <p className="text-zinc-600">{product.reviewInsight.summary}</p>
                  {product.reviewInsight.positiveThemes.length > 0 && <p className="mt-2"><span className="font-bold text-emerald-700">Vantagens:</span> {product.reviewInsight.positiveThemes.join(", ")}</p>}
                  {product.reviewInsight.negativeThemes.length > 0 && <p className="mt-1"><span className="font-bold text-amber-700">Reclamações:</span> {product.reviewInsight.negativeThemes.join(", ")}</p>}
                </div>
              )}
              <div className="mt-4 space-y-3">
                {reviewsFull.map((r) => (
                  <div key={r.id} className="rounded-xl border p-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold">{r.rating}★</span>
                      <span className="text-zinc-500">{new Date(r.createdAt).toLocaleDateString("pt-BR")}</span>
                      {r.verifiedPurchase && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Compra verificada</span>}
                    </div>
                    <p className="text-sm mt-1">{r.content}</p>
                    <p className="text-xs text-zinc-500 mt-1">— {r.authorName}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
