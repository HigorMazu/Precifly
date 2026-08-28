import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { alertCreateSchema } from "@/lib/validators";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const alerts = await prisma.priceAlert.findMany({
    where: { userId: user.userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(alerts);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const body = await req.json();
  const parsed = alertCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });

  const alert = await prisma.priceAlert.create({
    data: {
      userId: user.userId,
      productId: parsed.data.productId,
      type: parsed.data.type,
      threshold: parsed.data.threshold,
    },
  });
  return NextResponse.json(alert, { status: 201 });
}
