import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findFirst({ where: { OR: [{ id }, { slug: id }] } });
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  const offers = await prisma.offer.findMany({
    where: { productId: product.id },
    include: { store: true },
    orderBy: { price: "asc" },
  });
  return NextResponse.json(offers);
}
