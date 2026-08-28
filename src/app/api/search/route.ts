import { NextRequest, NextResponse } from "next/server";
import { productQuerySchema } from "@/lib/validators";
import { searchProducts } from "@/services/search.service";
import prisma from "@/lib/prisma";
import { logInfo } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  // converte promotion string
  const parsed = productQuerySchema.safeParse({
    ...raw,
    promotion: raw.promotion ? raw.promotion === "true" : undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const p = parsed.data;

  // log search history opcional
  const query = p.q || "";
  if (query) {
    // não bloqueia
    prisma.searchHistory.create({ data: { query } }).catch(() => {});
  }

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

  logInfo("search", { q: p.q, total: result.pagination.total });

  return NextResponse.json(result);
}
