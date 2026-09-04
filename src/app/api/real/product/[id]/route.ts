import { NextRequest, NextResponse } from "next/server";
import { getRealProduct } from "@/providers/real-product.provider";
import { logError } from "@/lib/logger";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const product = await getRealProduct(id);
    return NextResponse.json(product);
  } catch (e: any) {
    logError("real_product_failed", e);
    return NextResponse.json({ error: "Produto real não encontrado", details: e?.message }, { status: 404 });
  }
}
