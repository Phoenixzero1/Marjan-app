export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";
import sharp from "sharp";

// â”€â”€ Whitelist â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

// â”€â”€ Magic bytes signatures â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MAGIC: Record<string, (b: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF,
  "image/png":  (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47,
  // WebP: starts with RIFF....WEBP
  "image/webp": (b) =>
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  "application/pdf": (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
};

// â”€â”€ Dangerous extensions (always blocked regardless of MIME) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    return NextResponse.json({ error: "Ù„Ø·ÙØ§Ù‹ ÙˆØ§Ø±Ø¯ Ø´ÙˆÛŒØ¯" }, { status: 401 });
  }
  if (!ADMIN_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Ø¯Ø³ØªØ±Ø³ÛŒ Ù†Ø¯Ø§Ø±ÛŒØ¯" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    // Sanitize folder â€” prevent path traversal
    const rawFolder = (formData.get("folder") as string) || "uploads";
    const folder = sanitizeFolder(rawFolder);

    if (!file) {
      return NextResponse.json({ error: "ÙØ§ÛŒÙ„ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ù†Ø´Ø¯Ù‡" }, { status: 400 });
    }

    // â”€â”€ 1. Size check BEFORE reading into memory â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Ø­Ø¬Ù… ÙØ§ÛŒÙ„ Ù†Ø¨Ø§ÛŒØ¯ Ø¨ÛŒØ´ØªØ± Ø§Ø² ${Math.round(MAX_SIZE / 1024 / 1024)} Ù…Ú¯Ø§Ø¨Ø§ÛŒØª Ø¨Ø§Ø´Ø¯` },
        { status: 400 }
      );
    }

    // â”€â”€ 2. MIME type whitelist â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (!ALLOWED_MIME[file.type]) {
      return NextResponse.json(
        { error: "Ù†ÙˆØ¹ ÙØ§ÛŒÙ„ Ù…Ø¬Ø§Ø² Ù†ÛŒØ³Øª. ÙÙ‚Ø· JPEGØŒ PNGØŒ WebP Ùˆ PDF Ù‚Ø¨ÙˆÙ„ Ù…ÛŒâ€ŒØ´ÙˆØ¯." },
        { status: 400 }
      );
    }

    // â”€â”€ 3. Extension blacklist (from original filename) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const originalExt = (file.name.split(".").pop() ?? "").toLowerCase();
    if (BLOCKED_EXT.has(originalExt)) {
      return NextResponse.json(
        { error: `Ù¾Ø³ÙˆÙ†Ø¯ .${originalExt} Ù…Ø¬Ø§Ø² Ù†ÛŒØ³Øª` },
        { status: 400 }
      );
    }

    // â”€â”€ 4. Read bytes and check magic signature â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const bytes = await file.arrayBuffer();
    const buf = new Uint8Array(bytes);

    const checkMagic = MAGIC[file.type];
    if (checkMagic && !checkMagic(buf)) {
      return NextResponse.json(
        { error: "Ù…Ø­ØªÙˆØ§ÛŒ ÙØ§ÛŒÙ„ Ø¨Ø§ Ù†ÙˆØ¹ Ø§Ø¹Ù„Ø§Ù…â€ŒØ´Ø¯Ù‡ Ù…Ø·Ø§Ø¨Ù‚Øª Ù†Ø¯Ø§Ø±Ø¯ (magic bytes mismatch)" },
        { status: 400 }
      );
    }

    // â”€â”€ 5. Image dimension limit via Sharp (images only, not PDF) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (file.type !== "application/pdf") {
      try {
        const meta = await sharp(Buffer.from(bytes)).metadata();
        const MAX_DIM = 4000;
        if ((meta.width ?? 0) > MAX_DIM || (meta.height ?? 0) > MAX_DIM) {
          return NextResponse.json(
            { error: `Ø§Ø¨Ø¹Ø§Ø¯ ØªØµÙˆÛŒØ± Ù†Ø¨Ø§ÛŒØ¯ Ø¨ÛŒØ´ØªØ± Ø§Ø² ${MAX_DIM}Ã—${MAX_DIM} Ù¾ÛŒÚ©Ø³Ù„ Ø¨Ø§Ø´Ø¯` },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json({ error: "ÙØ§ÛŒÙ„ ØªØµÙˆÛŒØ±ÛŒ Ù…Ø¹ØªØ¨Ø± Ù†ÛŒØ³Øª" }, { status: 400 });
      }
    }

    // â”€â”€ 6. UUID filename â€” derived ext from MIME, never from user input â”€â”€â”€â”€â”€â”€â”€â”€
    const safeExt = ALLOWED_MIME[file.type]; // e.g. "jpg", "png", "pdf"
    const filename = `${crypto.randomUUID()}.${safeExt}`;

    // â”€â”€ 7. Write to disk â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const uploadDir = path.join(process.cwd(), "public", folder);
    // Extra guard: resolved path must stay inside public/
    const publicRoot = path.join(process.cwd(), "public");
    if (!uploadDir.startsWith(publicRoot)) {
      return NextResponse.json({ error: "Ù…Ø³ÛŒØ± Ø¢Ù¾Ù„ÙˆØ¯ ØºÛŒØ±Ù…Ø¬Ø§Ø²" }, { status: 400 });
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
    return NextResponse.json({ error: "Ø®Ø·Ø§ Ø¯Ø± Ø¢Ù¾Ù„ÙˆØ¯ ÙØ§ÛŒÙ„" }, { status: 500 });
  }
}
