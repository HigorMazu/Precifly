import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { wishlistAddSchema } from "@/lib/validators";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: user.userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
              offers: { include: { store: true } },
              _count: { select: { reviews: true } },
            },
          },
        },
      },
    },
  });
  return NextResponse.json(wishlist?.items ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const parsed = wishlistAddSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });

  const wishlist = await prisma.wishlist.findUnique({ where: { userId: user.userId } });
  if (!wishlist) return NextResponse.json({ error: "Wishlist não encontrada" }, { status: 404 });

  const exists = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId: parsed.data.productId } },
  });
  if (exists) return NextResponse.json({ error: "Produto já na wishlist" }, { status: 409 });

  const item = await prisma.wishlistItem.create({
    data: {
      wishlistId: wishlist.id,
      productId: parsed.data.productId,
      targetPrice: parsed.data.targetPrice,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
