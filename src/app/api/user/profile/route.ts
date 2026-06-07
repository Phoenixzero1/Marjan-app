export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  firstName: z.string().min(2, "Ù†Ø§Ù… Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª"),
  lastName: z.string().min(2, "Ù†Ø§Ù… Ø®Ø§Ù†ÙˆØ§Ø¯Ú¯ÛŒ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª"),
  email: z.string().email("Ø§ÛŒÙ…ÛŒÙ„ Ù…Ø¹ØªØ¨Ø± Ù†ÛŒØ³Øª").optional().or(z.literal("")),
  nationalCode: z.string().length(10, "Ú©Ø¯ Ù…Ù„ÛŒ Ø¨Ø§ÛŒØ¯ Û±Û° Ø±Ù‚Ù… Ø¨Ø§Ø´Ø¯").optional().or(z.literal("")),
  companyName: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Ù„Ø·ÙØ§Ù‹ ÙˆØ§Ø±Ø¯ Ø´ÙˆÛŒØ¯" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      avatarUrl: true, nationalCode: true, companyName: true, city: true,
      postalCode: true, role: true, status: true, createdAt: true, lastLoginAt: true,
      _count: { select: { orders: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "Ú©Ø§Ø±Ø¨Ø± ÛŒØ§ÙØª Ù†Ø´Ø¯" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Ù„Ø·ÙØ§Ù‹ ÙˆØ§Ø±Ø¯ Ø´ÙˆÛŒØ¯" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { firstName, lastName, email, nationalCode, companyName, city, postalCode } = parsed.data;

  try {
    if (email) {
      const existing = await prisma.user.findFirst({ where: { email, id: { not: session.user.id } } });
      if (existing) return NextResponse.json({ error: "Ø§ÛŒÙ† Ø§ÛŒÙ…ÛŒÙ„ ØªÙˆØ³Ø· Ú©Ø§Ø±Ø¨Ø± Ø¯ÛŒÚ¯Ø±ÛŒ Ø§Ø³ØªÙØ§Ø¯Ù‡ Ø´Ø¯Ù‡ Ø§Ø³Øª" }, { status: 409 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { firstName, lastName, email: email || null, nationalCode: nationalCode || null, companyName: companyName || null, city: city || null, postalCode: postalCode || null },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
    });

    return NextResponse.json({ user, message: "Ù¾Ø±ÙˆÙØ§ÛŒÙ„ Ø¨Ø§ Ù…ÙˆÙÙ‚ÛŒØª Ø¨Ø±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø´Ø¯" });
  } catch {
    return NextResponse.json({ error: "Ø®Ø·Ø§ Ø¯Ø± Ø¨Ø±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ù¾Ø±ÙˆÙØ§ÛŒÙ„" }, { status: 500 });
  }
}
