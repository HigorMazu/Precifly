import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      category: true,
      specs: true,
      offers: { include: { store: true } },
      reviewInsight: true,
      _count: { select: { reviews: true } },
    },
  });
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const reviewsAgg = await prisma.review.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return NextResponse.json({
    ...product,
    avgRating: reviewsAgg._avg.rating,
    reviewCount: reviewsAgg._count.rating,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await prisma.product.update({ where: { id }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
