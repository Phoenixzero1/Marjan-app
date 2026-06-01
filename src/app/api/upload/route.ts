import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE ?? "5242880"); // 5 MB default

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
  }

  const adminRoles = ["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"];
  if (!adminRoles.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "فایلی انتخاب نشده" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "نوع فایل مجاز نیست. فقط JPEG، PNG، WebP، GIF و PDF قبول می‌شود." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `حجم فایل نباید بیشتر از ${Math.round(MAX_SIZE / 1024 / 1024)} مگابایت باشد` }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const timestamp = Date.now();
    const filename = `${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", folder);

    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));

    const url = `/${folder}/${filename}`;

    const media = await prisma.media.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url,
        folder,
        uploadedBy: session.user.id,
      },
    });

    return NextResponse.json({ url, media }, { status: 201 });
  } catch (err) {
    console.error("[Upload Error]", err);
    return NextResponse.json({ error: "خطا در آپلود فایل" }, { status: 500 });
  }
}
