import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";

// ── Whitelist ──────────────────────────────────────────────────────────────────
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

// ── Magic bytes signatures ─────────────────────────────────────────────────────
const MAGIC: Record<string, (b: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF,
  "image/png":  (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47,
  // WebP: starts with RIFF....WEBP
  "image/webp": (b) =>
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  "application/pdf": (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
};

// ── Dangerous extensions (always blocked regardless of MIME) ───────────────────
const BLOCKED_EXT = new Set([
  "exe","bat","cmd","sh","bash","zsh","ps1","psm1","psd1",
  "php","php3","php4","php5","phtml","phar",
  "js","mjs","cjs","ts","jsx","tsx",
  "py","rb","pl","lua","go","rs",
  "jar","war","class",
  "dll","so","dylib",
  "vbs","wsf","hta",
  "svg", // SVG can embed scripts
]);

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE ?? "5242880"); // 5 MB
const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"];

/** Sanitize folder: only [a-z0-9_-], no path separators, no dots */
function sanitizeFolder(raw: string): string {
  const clean = raw.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return clean || "uploads";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
  }
  if (!ADMIN_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    // Sanitize folder — prevent path traversal
    const rawFolder = (formData.get("folder") as string) || "uploads";
    const folder = sanitizeFolder(rawFolder);

    if (!file) {
      return NextResponse.json({ error: "فایلی انتخاب نشده" }, { status: 400 });
    }

    // ── 1. Size check BEFORE reading into memory ───────────────────────────────
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `حجم فایل نباید بیشتر از ${Math.round(MAX_SIZE / 1024 / 1024)} مگابایت باشد` },
        { status: 400 }
      );
    }

    // ── 2. MIME type whitelist ────────────────────────────────────────────────
    if (!ALLOWED_MIME[file.type]) {
      return NextResponse.json(
        { error: "نوع فایل مجاز نیست. فقط JPEG، PNG، WebP و PDF قبول می‌شود." },
        { status: 400 }
      );
    }

    // ── 3. Extension blacklist (from original filename) ───────────────────────
    const originalExt = (file.name.split(".").pop() ?? "").toLowerCase();
    if (BLOCKED_EXT.has(originalExt)) {
      return NextResponse.json(
        { error: `پسوند .${originalExt} مجاز نیست` },
        { status: 400 }
      );
    }

    // ── 4. Read bytes and check magic signature ────────────────────────────────
    const bytes = await file.arrayBuffer();
    const buf = new Uint8Array(bytes);

    const checkMagic = MAGIC[file.type];
    if (checkMagic && !checkMagic(buf)) {
      return NextResponse.json(
        { error: "محتوای فایل با نوع اعلام‌شده مطابقت ندارد (magic bytes mismatch)" },
        { status: 400 }
      );
    }

    // ── 5. Virus scan placeholder ─────────────────────────────────────────────
    // TODO: pipe `buf` to ClamAV / VirusTotal API before saving
    console.warn(`[Upload][VirusScan] Skipped for ${file.name} (${file.size} bytes) — integrate ClamAV here`);

    // ── 6. UUID filename — derived ext from MIME, never from user input ────────
    const safeExt = ALLOWED_MIME[file.type]; // e.g. "jpg", "png", "pdf"
    const filename = `${crypto.randomUUID()}.${safeExt}`;

    // ── 7. Write to disk ──────────────────────────────────────────────────────
    const uploadDir = path.join(process.cwd(), "public", folder);
    // Extra guard: resolved path must stay inside public/
    const publicRoot = path.join(process.cwd(), "public");
    if (!uploadDir.startsWith(publicRoot)) {
      return NextResponse.json({ error: "مسیر آپلود غیرمجاز" }, { status: 400 });
    }

    await mkdir(uploadDir, { recursive: true });
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

    audit({
      userId: session.user.id,
      action: "MEDIA_UPLOAD",
      entity: "Media",
      entityId: media.id,
      newValue: { filename: media.filename, url: media.url, size: media.size, folder, originalName: file.name },
      ip: getClientIp(req),
      ua: req.headers.get("user-agent"),
    });

    return NextResponse.json({ url, media }, { status: 201 });
  } catch (err) {
    console.error("[Upload Error]", err);
    return NextResponse.json({ error: "خطا در آپلود فایل" }, { status: 500 });
  }
}
