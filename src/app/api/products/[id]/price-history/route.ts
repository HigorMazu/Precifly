import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PriceStatisticsService } from "@/domain/price/price-statistics.service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findFirst({ where: { OR: [{ id }, { slug: id }] } });
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const history = await prisma.priceHistory.findMany({
    where: { productId: product.id },
    orderBy: { recordedAt: "asc" },
  });

  const offers = await prisma.offer.findMany({ where: { productId: product.id } });
  const currentPrice = offers.length ? Math.min(...offers.map((o) => Number(o.price))) : null;

  const stats = PriceStatisticsService.fromPrismaHistory(history, currentPrice ?? undefined);

  return NextResponse.json({
    history: history.map((h) => ({ price: Number(h.price), date: h.recordedAt, storeId: h.storeId })),
    statistics: stats,
  });
}
