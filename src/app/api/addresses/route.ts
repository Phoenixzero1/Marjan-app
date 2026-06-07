export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addressSchema = z.object({
  label: z.string().default("Ø®Ø§Ù†Ù‡"),
  fullName: z.string().min(2, "Ù†Ø§Ù… Ùˆ Ù†Ø§Ù… Ø®Ø§Ù†ÙˆØ§Ø¯Ú¯ÛŒ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª"),
  phone: z.string().regex(/^09\d{9}$/, "Ø´Ù…Ø§Ø±Ù‡ Ù…ÙˆØ¨Ø§ÛŒÙ„ Ù…Ø¹ØªØ¨Ø± Ù†ÛŒØ³Øª"),
  province: z.string().min(1, "Ø§Ø³ØªØ§Ù† Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª"),
  city: z.string().min(1, "Ø´Ù‡Ø± Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª"),
  address: z.string().min(5, "Ø¢Ø¯Ø±Ø³ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª"),
  postalCode: z.string().regex(/^\d{10}$/, "Ú©Ø¯ Ù¾Ø³ØªÛŒ Ø¨Ø§ÛŒØ¯ Û±Û° Ø±Ù‚Ù… Ø¨Ø§Ø´Ø¯"),
  isDefault: z.boolean().optional().default(false),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Ù„Ø·ÙØ§Ù‹ ÙˆØ§Ø±Ø¯ Ø´ÙˆÛŒØ¯" }, { status: 401 });

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ addresses });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Ù„Ø·ÙØ§Ù‹ ÙˆØ§Ø±Ø¯ Ø´ÙˆÛŒØ¯" }, { status: 401 });

  const body = await req.json();
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const data = parsed.data;

  // If this is set as default, clear others
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }

  const count = await prisma.address.count({ where: { userId: session.user.id } });
  if (count >= 5) {
    return NextResponse.json({ error: "Ø­Ø¯Ø§Ú©Ø«Ø± Ûµ Ø¢Ø¯Ø±Ø³ Ù…ÛŒâ€ŒØªÙˆØ§Ù†ÛŒØ¯ Ø°Ø®ÛŒØ±Ù‡ Ú©Ù†ÛŒØ¯" }, { status: 400 });
  }

  const address = await prisma.address.create({
    data: { ...data, userId: session.user.id },
  });

  return NextResponse.json({ address }, { status: 201 });
}
