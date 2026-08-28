import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PriceStatisticsService } from "@/domain/price/price-statistics.service";
import { ReviewConfidenceService } from "@/domain/review/review-confidence.service";
import { PrecifyScoreService } from "@/domain/score/precify-score.service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { category: true, offers: true, reviewInsight: true },
  });
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const [history, reviews] = await Promise.all([
    prisma.priceHistory.findMany({ where: { productId: product.id }, orderBy: { recordedAt: "asc" } }),
    prisma.review.findMany({ where: { productId: product.id }, select: { rating: true, createdAt: true } }),
  ]);

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

  return NextResponse.json(score);
}
