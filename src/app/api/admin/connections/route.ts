export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { SERVICE_FIELDS, maskValue } from "@/lib/connections";

const STORE_KEY = "connections_secure";

interface StoredKey { id: string; label: string; service: string; fullKey: string; createdAt: string }
interface SecureStore { keys: StoredKey[]; config: Record<string, Record<string, string>> }

function genId() { return Math.random().toString(36).slice(2, 10); }

async function writeStore(store: SecureStore) {
  await prisma.siteSettings.upsert({
    where: { key: STORE_KEY },
    update: { value: JSON.stringify(store), group: "connections_secure" },
    create: { key: STORE_KEY, value: JSON.stringify(store), group: "connections_secure" },
  });
}

async function readStore(): Promise<SecureStore> {
  const row = await prisma.siteSettings.findUnique({ where: { key: STORE_KEY } });
  const store: SecureStore = { keys: [], config: {} };
  if (row?.value) {
    try { const p = JSON.parse(row.value); store.keys = p.keys ?? []; store.config = p.config ?? {}; } catch { /* corrupt */ }
  }

  // One-time migration: move legacy plaintext keys out of the client-readable setting.
  const legacy = await prisma.siteSettings.findUnique({ where: { key: "connections_apikeys" } });
  if (legacy?.value && legacy.value !== "[]") {
    try {
      const old = JSON.parse(legacy.value) as { id?: string; label?: string; service?: string; fullKey?: string; createdAt?: string }[];
      if (Array.isArray(old) && old.length) {
        const ids = new Set(store.keys.map(k => k.id));
        for (const o of old) {
          if (o.fullKey && o.id && !ids.has(o.id)) {
            store.keys.push({ id: o.id, label: o.label ?? "کلید", service: o.service ?? "", fullKey: o.fullKey, createdAt: o.createdAt ?? new Date().toISOString() });
          }
        }
        await writeStore(store);
      }
    } catch { /* ignore */ }
    // Neutralize the leaky plaintext setting (generic /api/admin/settings returns it).
    await prisma.siteSettings.update({ where: { key: "connections_apikeys" }, data: { value: "[]" } }).catch(() => {});
  }
  return store;
}

// GET — masked keys + config metadata (secrets never returned in full)
export async function GET() {
  if (!(await requirePermission("MANAGE_SETTINGS"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });
  try {
    const store = await readStore();
    const keys = store.keys.map(k => ({ id: k.id, label: k.label, service: k.service, maskedKey: maskValue(k.fullKey), createdAt: k.createdAt }));
    const config: Record<string, Record<string, { set: boolean; value: string; secret: boolean }>> = {};
    for (const [service, fields] of Object.entries(SERVICE_FIELDS)) {
      const saved = store.config[service] ?? {};
      config[service] = {};
      for (const f of fields) {
        const val = (saved[f.key] ?? "").toString();
        config[service][f.key] = f.secret ? { set: !!val, value: "", secret: true } : { set: !!val, value: val, secret: false };
      }
    }
    return NextResponse.json({ keys, config });
  } catch (err) {
    console.error("GET /api/admin/connections failed:", err);
    return NextResponse.json({ keys: [], config: {} });
  }
}

// POST — action-based: addKey | replaceKey | deleteKey | saveConfig | test
export async function POST(req: NextRequest) {
  if (!(await requirePermission("MANAGE_SETTINGS"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const action: string = body.action;

  try {
    const store = await readStore();

    if (action === "addKey") {
      const label = (body.label ?? "").trim();
      const service = (body.service ?? "").trim();
      const key = (body.key ?? "").trim();
      if (!label || !key) return NextResponse.json({ error: "نام و مقدار کلید الزامی است" }, { status: 400 });
      const entry: StoredKey = { id: genId(), label, service: service || label, fullKey: key, createdAt: new Date().toISOString() };
      store.keys.push(entry);
      await writeStore(store);
      return NextResponse.json({ key: { id: entry.id, label: entry.label, service: entry.service, maskedKey: maskValue(entry.fullKey), createdAt: entry.createdAt } }, { status: 201 });
    }

    if (action === "replaceKey") {
      const key = (body.key ?? "").trim();
      if (!key) return NextResponse.json({ error: "مقدار کلید جدید الزامی است" }, { status: 400 });
      const k = store.keys.find(x => x.id === body.id);
      if (!k) return NextResponse.json({ error: "کلید یافت نشد" }, { status: 404 });
      k.fullKey = key; k.createdAt = new Date().toISOString();
      await writeStore(store);
      return NextResponse.json({ key: { id: k.id, label: k.label, service: k.service, maskedKey: maskValue(k.fullKey), createdAt: k.createdAt } });
    }

    if (action === "deleteKey") {
      store.keys = store.keys.filter(x => x.id !== body.id);
      await writeStore(store);
      return NextResponse.json({ success: true });
    }

    if (action === "saveConfig") {
      const service = body.service;
      const fields = SERVICE_FIELDS[service];
      if (!fields) return NextResponse.json({ error: "سرویس نامعتبر" }, { status: 400 });
      const values = body.values ?? {};
      const current = store.config[service] ?? {};
      for (const f of fields) {
        const incoming = (values[f.key] ?? "").toString().trim();
        if (f.secret) { if (incoming) current[f.key] = incoming; } // empty secret = keep existing
        else current[f.key] = incoming;
      }
      store.config[service] = current;
      await writeStore(store);
      return NextResponse.json({ success: true });
    }

    if (action === "test") {
      const fields = SERVICE_FIELDS[body.service];
      if (!fields) return NextResponse.json({ ok: false, message: "سرویس نامعتبر" }, { status: 400 });
      const saved = store.config[body.service] ?? {};
      const missing = fields.filter(f => f.required && !(saved[f.key] ?? "").toString().trim()).map(f => f.label);
      if (missing.length) return NextResponse.json({ ok: false, message: `پیکربندی ناقص: ${missing.join("، ")}` });
      return NextResponse.json({ ok: true, message: "پیکربندی کامل است — فیلدهای لازم تنظیم شده‌اند ✓" });
    }

    return NextResponse.json({ error: "عملیات نامعتبر" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/admin/connections failed:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
