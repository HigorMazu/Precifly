import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const alert = await prisma.priceAlert.findUnique({ where: { id } });
  if (!alert || alert.userId !== user.userId) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.priceAlert.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
