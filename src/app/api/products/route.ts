import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { productQuerySchema } from "@/lib/validators";
import { searchProducts } from "@/services/search.service";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const parsed = productQuerySchema.safeParse({
    ...raw,
    promotion: raw.promotion ? raw.promotion === "true" : undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const p = parsed.data;
  const result = await searchProducts({
    q: p.q,
    category: p.category,
    store: p.store,
    minPrice: p.minPrice,
    maxPrice: p.maxPrice,
    minRating: p.minRating,
    minReviews: p.minReviews,
    promotion: p.promotion,
    sortBy: p.sortBy,
    page: p.page,
    limit: p.limit,
  });
  return NextResponse.json(result);
}

// POST para criação (admin simples) — requer autenticação futuramente
export async function POST(req: NextRequest) {
  const body = await req.json();
  // validação simples
  if (!body.name || !body.slug || !body.categoryId) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }
  const created = await prisma.product.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description || "",
      brand: body.brand,
      imageUrl: body.imageUrl,
      categoryId: body.categoryId,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
