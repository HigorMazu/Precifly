import { NextRequest, NextResponse } from "next/server";
import { searchRealProducts } from "@/providers/real-product.provider";
import { logInfo, logError } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "12"), 30);
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

  if (!q.trim()) {
    return NextResponse.json({ query: q, results: [], total: 0, source: "mercadolivre" });
  }

  try {
    const result = await searchRealProducts(q, limit, offset);
    logInfo("real_search", { q, total: result.total });
    return NextResponse.json(result);
  } catch (e: any) {
    logError("real_search_failed", e);
    return NextResponse.json({ error: "Falha ao buscar produtos reais", details: e?.message }, { status: 502 });
  }
}
