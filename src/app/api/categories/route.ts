import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET() {
  const cats = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(cats);
}
