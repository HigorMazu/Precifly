import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const wishlist = await prisma.wishlist.findUnique({ where: { userId: user.userId } });
  if (!wishlist) return NextResponse.json({ error: "Wishlist não encontrada" }, { status: 404 });

  await prisma.wishlistItem.delete({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
  });
  return NextResponse.json({ success: true });
}
