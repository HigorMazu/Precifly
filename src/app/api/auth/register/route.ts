import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });
  await prisma.wishlist.create({ data: { userId: user.id } });

  const token = await createToken({ userId: user.id, email: user.email });
  await setAuthCookie(token);

  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}
