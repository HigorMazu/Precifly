import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ReviewConfidenceService } from "@/domain/review/review-confidence.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findFirst({ where: { OR: [{ id }, { slug: id }] } });
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50);

  const [reviews, total, insight, allForConfidence] = await Promise.all([
    prisma.review.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where: { productId: product.id } }),
    prisma.reviewInsight.findUnique({ where: { productId: product.id } }),
    prisma.review.findMany({ where: { productId: product.id }, select: { rating: true, createdAt: true } }),
  ]);

  const confidence = ReviewConfidenceService.calculate(allForConfidence);
  const avgRating = allForConfidence.length ? allForConfidence.reduce((s, r) => s + r.rating, 0) / allForConfidence.length : null;

  // distribuição
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  allForConfidence.forEach((r) => distribution[r.rating]++);

  return NextResponse.json({
    reviews,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    insight,
    confidence,
    avgRating,
    distribution,
    totalReviews: total,
  });
}
