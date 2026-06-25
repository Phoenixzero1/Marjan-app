export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  const faqs = await prisma.faq.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(faqs);
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  const body = await req.json();
  const faq = await prisma.faq.create({ data: { question: body.question, answer: body.answer, sortOrder: body.sortOrder ?? 0, isActive: body.isActive ?? true } });
  return NextResponse.json(faq);
}
