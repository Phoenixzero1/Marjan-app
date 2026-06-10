import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  companyName:     z.string().min(2, "نام شرکت الزامی است"),
  contactName:     z.string().min(2, "نام مسئول الزامی است"),
  phone:           z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر وارد کنید"),
  email:           z.string().email("ایمیل معتبر نیست").optional().or(z.literal("")),
  nationalCode:    z.string().optional(),
  category:        z.string().optional(),
  estimatedAmount: z.string().optional(),
  description:     z.string().min(10, "توضیحات حداقل ۱۰ کاراکتر باشد"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const req_ = await prisma.orgRequest.create({ data });
    return NextResponse.json({ ok: true, id: req_.id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
