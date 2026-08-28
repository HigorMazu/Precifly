import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { id: true, name: true, email: true } });
  return NextResponse.json({ user: dbUser });
}
