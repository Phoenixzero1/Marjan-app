import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function generateInvoiceNum(type: "INV" | "LST") {
  const date = new Date();
  const jalali = `1404-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${type}-${jalali}-${random}`;
}

const schema = z.object({
  type: z.union([z.literal("OFFICIAL"), z.literal("CONTRACTOR")]).default("OFFICIAL"),
  sellerName: z.string().optional(),
  sellerPhone: z.string().optional(),
  sellerAddress: z.string().optional(),
  buyerName: z.string().optional(),
  buyerPhone: z.string().optional(),
  buyerAddress: z.string().optional(),
  issueDate: z.string().optional(),
  notes: z.string().optional(),
  discountPct: z.number().default(0),
  taxPct: z.number().default(10),
  items: z.array(z.record(z.string(), z.unknown())),
  subtotal: z.number(),
  totalAmount: z.number(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const invoiceNumber = generateInvoiceNum(data.type === "OFFICIAL" ? "INV" : "LST");

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        type: data.type,
        userId: session?.user?.id ?? null,
        sellerName: data.sellerName,
        sellerPhone: data.sellerPhone,
        sellerAddress: data.sellerAddress,
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone,
        buyerAddress: data.buyerAddress,
        issueDate: data.issueDate,
        notes: data.notes,
        discountPct: data.discountPct,
        taxPct: data.taxPct,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: data.items as any,
        subtotal: data.subtotal,
        totalAmount: data.totalAmount,
      },
    });

    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "نیاز به ورود دارید" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 10;

  const [invoices, total] = await prisma.$transaction([
    prisma.invoice.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ invoices, pagination: { total, page, limit } });
}
