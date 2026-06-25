"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AdminCard, AdminCardHeader, AdminBtn, AdminField, AdminInput, AdminTextarea, AdminToggle,
  AdminTable, AdminTh, AdminTd, AdminTr, AdminBadge, AdminEmptyState,
  AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";

type SettingsTab = "general" | "payment" | "seo" | "security";
interface Props { tab: SettingsTab }

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{children}</div>
);

interface SecLog { id: string; level: string; action: string; ipAddress: string | null; createdAt: string; user: { firstName: string; lastName: string } | null; }

const LEVEL_V: Record<string, "info" | "warning" | "danger" | "purple"> = {
  INFO: "info", WARNING: "warning", ERROR: "danger", CRITICAL: "purple",
};

function SecurityReport() {
  const [logs, setLogs] = useState<SecLog[]>([]);
  const [loading, setLoading] = useState(true);
  const fmtDate = (s: string) => new Date(s).toLocaleDateString("fa-IR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    fetch("/api/admin/logs?limit=20").then(r => r.json()).then(d => setLogs(d.logs ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <AdminCard>
      <AdminCardHeader title="گزارش امنیتی اخیر" icon="ti-shield-check" />
      {loading && <AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." />}
      {!loading && logs.length === 0 && <AdminEmptyState icon="ti-file-off" title="رویداد امنیتی ثبت نشده" />}
      {!loading && logs.length > 0 && (
        <AdminTable style={{ marginTop: 14 }}>
          <thead>
            <tr>
              <AdminTh>رویداد</AdminTh>
              <AdminTh>سطح</AdminTh>
              <AdminTh>IP</AdminTh>
              <AdminTh>کاربر</AdminTh>
              <AdminTh>زمان</AdminTh>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <AdminTr key={log.id}>
                <AdminTd style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 700 }}>{log.action}</AdminTd>
                <AdminTd><AdminBadge variant={LEVEL_V[log.level] ?? "info"} size="xs">{log.level}</AdminBadge></AdminTd>
                <AdminTd style={{ direction: "ltr", fontFamily: "monospace", fontSize: 11 }}>{log.ipAddress ?? "—"}</AdminTd>
                <AdminTd style={{ fontSize: 11 }}>{log.user ? `${log.user.firstName} ${log.user.lastName}` : "ناشناس"}</AdminTd>
                <AdminTd style={{ fontSize: 11, whiteSpace: "nowrap" }}>{fmtDate(log.createdAt)}</AdminTd>
              </AdminTr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </AdminCard>
  );
}

export default function SettingsManager({ tab }: Props) {
  const { toast, showToast } = useAdminToast();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const groups: Record<SettingsTab, string[]> = {
    general:  ["general", "shipping", "contact"],
    payment:  ["payment"],
    seo:      ["seo"],
    security: ["security"],
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fetches = groups[tab].map(g => fetch(`/api/admin/settings?group=${g}`).then(r => r.json()));
      const results = await Promise.all(fetches);
      const merged: Record<string, string> = {};
      for (const r of results) Object.assign(merged, r.map ?? {});
      setVals(merged);
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const set = (key: string, value: string) => setVals(prev => ({ ...prev, [key]: value }));
  const get = (key: string, fallback = "") => vals[key] ?? fallback;

  async function uploadLogo(file: File) {
    setLogoUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("folder", "logos");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) { set("site_logo", data.url); showToast("success", "لوگو آپلود شد"); }
      else showToast("error", data.error ?? "خطا در آپلود لوگو");
    } finally { setLogoUploading(false); }
  }

  async function save(groupName: string, keys: string[]) {
    setSaving(true);
    try {
      const settings = Object.fromEntries(keys.map(k => [k, String(get(k) ?? "")]));
      const res = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings, group: groupName }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) showToast("success", "تنظیمات ذخیره شد");
      else showToast("error", data.error ?? `خطا در ذخیره (${res.status})`);
    } finally { setSaving(false); }
  }

  const SaveBtn = ({ groupName, keys }: { groupName: string; keys: string[] }) => (
    <AdminBtn variant="primary" icon="ti-device-floppy" loading={saving} onClick={() => save(groupName, keys)} style={{ alignSelf: "flex-start" }}>
      {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
    </AdminBtn>
  );

  if (loading) return (
    <div style={{ textAlign: "center", padding: "4rem", color: "var(--text3)" }}>
      <i className="ti ti-loader-2" style={{ fontSize: 36, display: "block", marginBottom: 8 }} />در حال بارگذاری...
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <AdminToast toast={toast} />

      {/* ── GENERAL TAB ── */}
      {tab === "general" && (
        <>
          <AdminCard>
            <AdminCardHeader title="اطلاعات فروشگاه" icon="ti-building-store" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
              <Row>
                <AdminField label="نام تجاری (برند)" hint="در نوار بالا، فوتر، فاکتورها و همه‌جا نمایش داده می‌شود">
                  <AdminInput value={get("site_name")} onChange={v => set("site_name", v)} />
                </AdminField>
                <AdminField label="ایمیل">
                  <AdminInput value={get("site_email")} onChange={v => set("site_email", v)} style={{ direction: "ltr" }} />
                </AdminField>
              </Row>

              {/* Logo */}
              <AdminField label="لوگوی سایت" hint="فرمت‌های مجاز: JPG، PNG، WebP — حداکثر ۵ مگابایت">
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  {get("site_logo") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={get("site_logo")} alt="logo" style={{ height: 44, maxWidth: 140, objectFit: "contain", borderRadius: 7, border: "1.5px solid var(--border)", padding: 4, background: "#fff" }} />
                  ) : (
                    <div style={{ height: 44, width: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", border: "1.5px dashed var(--border)", borderRadius: 7, fontSize: 12, color: "var(--text3)" }}>بدون لوگو</div>
                  )}
                  <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = ""; }} />
                  <AdminBtn icon="ti-upload" loading={logoUploading} onClick={() => logoInputRef.current?.click()}>
                    {logoUploading ? "در حال آپلود..." : "آپلود لوگو"}
                  </AdminBtn>
                  {get("site_logo") && <AdminBtn icon="ti-trash" variant="danger" onClick={() => set("site_logo", "")}>حذف</AdminBtn>}
                </div>
              </AdminField>

              <Row>
                <AdminField label="تلفن">
                  <AdminInput value={get("site_phone")} onChange={v => set("site_phone", v)} style={{ direction: "ltr" }} />
                </AdminField>
                <AdminField label="شهر">
                  <AdminInput value={get("site_city", "")} onChange={v => set("site_city", v)} />
                </AdminField>
              </Row>
              <AdminField label="آدرس">
                <AdminInput value={get("site_address")} onChange={v => set("site_address", v)} />
              </AdminField>
              <AdminField label="درباره ما (خلاصه)">
                <AdminTextarea value={get("site_about", "")} onChange={v => set("site_about", v)} rows={3} />
              </AdminField>
              <SaveBtn groupName="general" keys={["site_name", "site_logo", "site_email", "site_phone", "site_city", "site_address", "site_about"]} />
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="اطلاعات تماس و فوتر" icon="ti-phone" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
              <Row>
                <AdminField label="تلفن (هدر و فوتر)">
                  <AdminInput value={get("site_phone", "۰۲۱-۴۴۵۵۶۶۷۷")} onChange={v => set("site_phone", v)} />
                </AdminField>
                <AdminField label="واتساپ">
                  <AdminInput value={get("site_whatsapp", "")} onChange={v => set("site_whatsapp", v)} />
                </AdminField>
              </Row>
              <Row>
                <AdminField label="ایمیل">
                  <AdminInput value={get("site_email", "")} onChange={v => set("site_email", v)} style={{ direction: "ltr" }} />
                </AdminField>
                <AdminField label="آدرس">
                  <AdminInput value={get("site_address", "")} onChange={v => set("site_address", v)} />
                </AdminField>
              </Row>
              <AdminField label="متن فوتر (کپی‌رایت)">
                <AdminInput value={get("site_footer_text", "© ۱۴۰۴ Marjan")} onChange={v => set("site_footer_text", v)} />
              </AdminField>
              <Row>
                <AdminField label="اینستاگرام (لینک)">
                  <AdminInput value={get("social_instagram", "#")} onChange={v => set("social_instagram", v)} style={{ direction: "ltr" }} />
                </AdminField>
                <AdminField label="تلگرام (لینک)">
                  <AdminInput value={get("social_telegram", "#")} onChange={v => set("social_telegram", v)} style={{ direction: "ltr" }} />
                </AdminField>
              </Row>
              <Row>
                <AdminField label="لینکدین (لینک)">
                  <AdminInput value={get("social_linkedin", "#")} onChange={v => set("social_linkedin", v)} style={{ direction: "ltr" }} />
                </AdminField>
                <AdminField label="واتساپ (لینک)">
                  <AdminInput value={get("social_whatsapp", "#")} onChange={v => set("social_whatsapp", v)} style={{ direction: "ltr" }} />
                </AdminField>
              </Row>
              <SaveBtn groupName="contact" keys={["site_phone", "site_whatsapp", "site_email", "site_address", "site_footer_text", "social_instagram", "social_telegram", "social_linkedin", "social_whatsapp"]} />
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="تنظیمات ارسال" icon="ti-truck-delivery" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
              <Row>
                <AdminField label="حداقل سفارش برای ارسال رایگان (ریال)" hint="اگر ۰ باشد، ارسال رایگان برای همه سفارش‌ها">
                  <AdminInput type="number" value={get("free_shipping_threshold")} onChange={v => set("free_shipping_threshold", v)} style={{ direction: "ltr" }} />
                </AdminField>
                <AdminField label="هزینه پیش‌فرض ارسال (ریال)">
                  <AdminInput type="number" value={get("default_shipping_cost", "50000")} onChange={v => set("default_shipping_cost", v)} style={{ direction: "ltr" }} />
                </AdminField>
              </Row>
              <Row>
                <AdminField label="نرخ مالیات (%)">
                  <AdminInput type="number" value={get("tax_rate")} onChange={v => set("tax_rate", v)} style={{ direction: "ltr" }} />
                </AdminField>
                <AdminField label="روزهای کاری ارسال">
                  <AdminInput value={get("shipping_days", "۲۴ تا ۷۲ ساعت")} onChange={v => set("shipping_days", v)} />
                </AdminField>
              </Row>
              <SaveBtn groupName="shipping" keys={["free_shipping_threshold", "default_shipping_cost", "tax_rate", "shipping_days"]} />
            </div>
          </AdminCard>
        </>
      )}

      {/* ── PAYMENT TAB ── */}
      {tab === "payment" && (
        <>
          <AdminCard>
            <AdminCardHeader title="درگاه زرین‌پال" icon="ti-credit-card" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
              <Row>
                <AdminField label="Merchant ID">
                  <AdminInput value={get("zarinpal_merchant_id", "")} onChange={v => set("zarinpal_merchant_id", v)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" style={{ direction: "ltr", fontFamily: "monospace" }} />
                </AdminField>
                <AdminField label="حالت">
                  <select value={get("zarinpal_mode", "sandbox")} onChange={e => set("zarinpal_mode", e.target.value)} style={{ height: 36, padding: "0 10px", borderRadius: 7, border: "1.5px solid var(--border)", fontFamily: "Vazirmatn", fontSize: 13, width: "100%", background: "#fff" }}>
                    <option value="sandbox">آزمایشی (Sandbox)</option>
                    <option value="production">واقعی (Production)</option>
                  </select>
                </AdminField>
              </Row>
              <AdminToggle checked={get("zarinpal_enabled", "true") === "true"} onChange={v => set("zarinpal_enabled", v ? "true" : "false")} label="درگاه زرین‌پال فعال باشد" />
              <SaveBtn groupName="payment" keys={["zarinpal_merchant_id", "zarinpal_mode", "zarinpal_enabled"]} />
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="تنظیمات کیف پول" icon="ti-wallet" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
              <Row>
                <AdminField label="حداقل شارژ کیف پول (ریال)">
                  <AdminInput type="number" value={get("wallet_min_charge", "50000")} onChange={v => set("wallet_min_charge", v)} style={{ direction: "ltr" }} />
                </AdminField>
                <AdminField label="حداکثر موجودی کیف پول (ریال)">
                  <AdminInput type="number" value={get("wallet_max_balance", "50000000")} onChange={v => set("wallet_max_balance", v)} style={{ direction: "ltr" }} />
                </AdminField>
              </Row>
              <AdminToggle checked={get("wallet_enabled", "true") === "true"} onChange={v => set("wallet_enabled", v ? "true" : "false")} label="کیف پول فعال باشد" />
              <SaveBtn groupName="payment" keys={["wallet_min_charge", "wallet_max_balance", "wallet_enabled"]} />
            </div>
          </AdminCard>
        </>
      )}

      {/* ── SEO TAB ── */}
      {tab === "seo" && (
        <>
          <AdminCard>
            <AdminCardHeader title="متا تگ‌های پیش‌فرض" icon="ti-search" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
              <AdminField label="عنوان پیش‌فرض سایت" hint="در صفحاتی که متا عنوان خاصی ندارند استفاده می‌شود">
                <AdminInput value={get("seo_default_title", "")} onChange={v => set("seo_default_title", v)} placeholder="عنوان | نام فروشگاه" />
              </AdminField>
              <AdminField label="توضیح پیش‌فرض (Meta Description)" hint={`توصیه می‌شود بین ۱۵۰ تا ۱۶۰ کاراکتر باشد (${get("seo_default_desc", "").length} کاراکتر)`}>
                <AdminTextarea value={get("seo_default_desc", "")} onChange={v => set("seo_default_desc", v)} rows={3} placeholder="توضیح کوتاه فروشگاه برای موتورهای جستجو..." />
              </AdminField>
              <AdminField label="کلمات کلیدی (Keywords)">
                <AdminInput value={get("seo_keywords", "")} onChange={v => set("seo_keywords", v)} placeholder="شیرآلات، لوله، اتصالات، تهران" />
              </AdminField>
              <Row>
                <AdminField label="آدرس کانونیکال سایت">
                  <AdminInput value={get("seo_canonical_url", "")} onChange={v => set("seo_canonical_url", v)} placeholder="https://marjan.ir" style={{ direction: "ltr" }} />
                </AdminField>
                <AdminField label="Google Analytics ID">
                  <AdminInput value={get("seo_ga_id", "")} onChange={v => set("seo_ga_id", v)} placeholder="G-XXXXXXXXXX" style={{ direction: "ltr", fontFamily: "monospace" }} />
                </AdminField>
              </Row>
              <SaveBtn groupName="seo" keys={["seo_default_title", "seo_default_desc", "seo_keywords", "seo_canonical_url", "seo_ga_id"]} />
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="Open Graph (شبکه‌های اجتماعی)" icon="ti-share" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
              <Row>
                <AdminField label="عنوان OG">
                  <AdminInput value={get("og_title", "")} onChange={v => set("og_title", v)} />
                </AdminField>
                <AdminField label="تصویر OG (آدرس کامل)">
                  <AdminInput value={get("og_image", "")} onChange={v => set("og_image", v)} placeholder="https://..." style={{ direction: "ltr" }} />
                </AdminField>
              </Row>
              <AdminField label="توضیح OG">
                <AdminTextarea value={get("og_desc", "")} onChange={v => set("og_desc", v)} rows={2} />
              </AdminField>
              <SaveBtn groupName="seo" keys={["og_title", "og_image", "og_desc"]} />
            </div>
          </AdminCard>
        </>
      )}

      {/* ── SECURITY TAB ── */}
      {tab === "security" && (
        <>
          <AdminCard>
            <AdminCardHeader title="تنظیمات امنیتی" icon="ti-lock" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
              <Row>
                <AdminField label="حداکثر تلاش ورود ناموفق" hint="بعد از این تعداد، حساب موقتاً قفل می‌شود">
                  <AdminInput type="number" value={get("max_login_attempts", "5")} onChange={v => set("max_login_attempts", v)} style={{ direction: "ltr" }} />
                </AdminField>
                <AdminField label="مدت قفل حساب (دقیقه)">
                  <AdminInput type="number" value={get("lockout_duration_min", "15")} onChange={v => set("lockout_duration_min", v)} style={{ direction: "ltr" }} />
                </AdminField>
              </Row>
              <Row>
                <AdminField label="مدت اعتبار توکن تأیید ایمیل (ساعت)">
                  <AdminInput type="number" value={get("email_verify_ttl_hours", "24")} onChange={v => set("email_verify_ttl_hours", v)} style={{ direction: "ltr" }} />
                </AdminField>
                <AdminField label="مدت اعتبار توکن بازنشانی رمز (دقیقه)">
                  <AdminInput type="number" value={get("password_reset_ttl_min", "30")} onChange={v => set("password_reset_ttl_min", v)} style={{ direction: "ltr" }} />
                </AdminField>
              </Row>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <AdminToggle checked={get("require_email_verify", "true") === "true"} onChange={v => set("require_email_verify", v ? "true" : "false")} label="تأیید ایمیل هنگام ثبت‌نام اجباری باشد" />
                <AdminToggle checked={get("allow_google_login", "true") === "true"} onChange={v => set("allow_google_login", v ? "true" : "false")} label="ورود با گوگل فعال باشد" />
                <AdminToggle checked={get("allow_guest_checkout", "true") === "true"} onChange={v => set("allow_guest_checkout", v ? "true" : "false")} label="خرید بدون ثبت‌نام مجاز باشد" />
              </div>
              <SaveBtn groupName="security" keys={["max_login_attempts", "lockout_duration_min", "email_verify_ttl_hours", "password_reset_ttl_min", "require_email_verify", "allow_google_login", "allow_guest_checkout"]} />
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="CORS و دسترسی API" icon="ti-api" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
              <AdminField label="دامنه‌های مجاز CORS" hint="هر دامنه در یک خط جداگانه">
                <AdminTextarea value={get("cors_origins", "")} onChange={v => set("cors_origins", v)} rows={3} placeholder={"https://marjan.ir\nhttps://www.marjan.ir"} style={{ direction: "ltr", fontFamily: "monospace" }} />
              </AdminField>
              <AdminField label="IP‌های مسدود شده">
                <AdminTextarea value={get("blocked_ips", "")} onChange={v => set("blocked_ips", v)} rows={3} placeholder="192.168.1.1" style={{ direction: "ltr", fontFamily: "monospace" }} />
              </AdminField>
              <SaveBtn groupName="security" keys={["cors_origins", "blocked_ips"]} />
            </div>
          </AdminCard>

          <SecurityReport />
        </>
      )}
    </div>
  );
}
