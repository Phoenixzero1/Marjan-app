"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type SettingsTab = "general" | "payment" | "seo" | "security";

interface Props { tab: SettingsTab }

type Toast = { msg: string; ok: boolean };

const inp: React.CSSProperties = {
  border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
  padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13,
  color: "var(--text)", outline: "none", background: "#fff",
  boxSizing: "border-box", width: "100%",
};
const lbl: React.CSSProperties = {
  fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5,
};
const hint: React.CSSProperties = { fontSize: 11, color: "var(--text3)", marginTop: 4 };

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
        <i className={`ti ${icon}`} style={{ fontSize: 18 }} />{title}
      </div>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{children}</div>;
}

interface SecLog { id: string; level: string; action: string; ipAddress: string | null; createdAt: string; user: { firstName: string; lastName: string } | null; }

function SecurityReport() {
  const [logs, setLogs] = useState<SecLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/logs?limit=20")
      .then(r => r.json())
      .then(d => setLogs(d.logs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const LEVEL_COLOR: Record<string, { bg: string; color: string }> = {
    INFO: { bg: "#dbeafe", color: "#2563eb" },
    WARNING: { bg: "#fef9c3", color: "#ca8a04" },
    ERROR: { bg: "#fee2e2", color: "#dc2626" },
    CRITICAL: { bg: "#fce7f3", color: "#be185d" },
  };

  const fmtDate = (s: string) => new Date(s).toLocaleDateString("fa-IR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <Section title="گزارش امنیتی" icon="ti-shield-check">
      {loading ? (
        <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text3)" }}>
          <i className="ti ti-loader-2" style={{ fontSize: 24, display: "block", marginBottom: 6 }} />در حال بارگذاری...
        </div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text3)" }}>
          <i className="ti ti-file-off" style={{ fontSize: 32, display: "block", marginBottom: 6 }} />رویداد امنیتی ثبت نشده
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["رویداد", "سطح", "IP", "کاربر", "زمان"].map(h => (
                  <th key={h} style={{ background: "var(--bg)", padding: "8px 10px", fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "2px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const lc = LEVEL_COLOR[log.level] ?? LEVEL_COLOR.INFO;
                return (
                  <tr key={log.id} style={{ borderBottom: i < logs.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 700, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.action}</td>
                    <td style={{ padding: "8px 10px" }}>
                      <span style={{ background: lc.bg, color: lc.color, borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 900 }}>{log.level}</span>
                    </td>
                    <td style={{ padding: "8px 10px", direction: "ltr", fontFamily: "monospace", fontSize: 11, color: "var(--text3)" }}>{log.ipAddress ?? "—"}</td>
                    <td style={{ padding: "8px 10px", fontSize: 11, color: "var(--text3)" }}>{log.user ? `${log.user.firstName} ${log.user.lastName}` : "ناشناس"}</td>
                    <td style={{ padding: "8px 10px", fontSize: 11, color: "var(--text3)", whiteSpace: "nowrap" }}>{fmtDate(log.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

export default function SettingsManager({ tab }: Props) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // Map tab to the groups we load
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
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const set = (key: string, value: string) => setVals(prev => ({ ...prev, [key]: value }));
  const get = (key: string, fallback = "") => vals[key] ?? fallback;

  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  async function uploadLogo(file: File) {
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "logos");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        set("site_logo", data.url);
        showToast("لوگو آپلود شد");
      } else {
        showToast(data.error ?? "خطا در آپلود لوگو", false);
      }
    } finally {
      setLogoUploading(false);
    }
  }

  async function save(groupName: string, keys: string[]) {
    setSaving(true);
    try {
      const settings = Object.fromEntries(keys.map(k => [k, String(get(k) ?? "")]));
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings, group: groupName }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) showToast("تنظیمات ذخیره شد");
      else showToast(data.error ?? `خطا در ذخیره (${res.status})`, false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "var(--text3)" }}>
        <i className="ti ti-loader-2" style={{ fontSize: 36, display: "block", marginBottom: 8 }} />در حال بارگذاری...
      </div>
    );
  }

  const SaveBtn = ({ groupName, keys }: { groupName: string; keys: string[] }) => (
    <button
      onClick={() => save(groupName, keys)}
      disabled={saving}
      style={{ alignSelf: "flex-start", background: saving ? "#aaa" : "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "10px 24px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}
    >
      {saving ? <><i className="ti ti-loader-2" /> در حال ذخیره...</> : <><i className="ti ti-device-floppy" /> ذخیره تنظیمات</>}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.ok ? "#22c55e" : "#ef4444", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}>
          {toast.msg}
        </div>
      )}

      {/* ── GENERAL TAB ── */}
      {tab === "general" && (
        <>
          <Section title="اطلاعات فروشگاه" icon="ti-building-store">
            <Row>
              <div>
                <label style={lbl}>نام تجاری (برند)</label>
                <input value={get("site_name")} onChange={e => set("site_name", e.target.value)} style={inp} />
                <p style={hint}>این نام در نوار بالا، فوتر، عنوان مرورگر، فاکتورها و همه‌جا نمایش داده می‌شود</p>
              </div>
              <div>
                <label style={lbl}>ایمیل</label>
                <input value={get("site_email")} onChange={e => set("site_email", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} />
              </div>
            </Row>
            {/* Logo upload */}
            <div>
              <label style={lbl}>لوگوی سایت</label>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {get("site_logo") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={get("site_logo")} alt="logo" style={{ height: 44, maxWidth: 140, objectFit: "contain", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", padding: 4, background: "#fff" }} />
                ) : (
                  <div style={{ height: 44, width: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)", border: "1.5px dashed var(--border)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--text3)" }}>بدون لوگو</div>
                )}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = ""; }}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                    style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 16px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    {logoUploading ? <><i className="ti ti-loader-2" /> در حال آپلود...</> : <><i className="ti ti-upload" /> آپلود لوگو</>}
                  </button>
                  {get("site_logo") && (
                    <button
                      type="button"
                      onClick={() => set("site_logo", "")}
                      style={{ background: "transparent", color: "#ef4444", border: "1.5px solid #ef4444", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontFamily: "Vazirmatn", fontSize: 12, cursor: "pointer" }}
                    >
                      <i className="ti ti-trash" /> حذف
                    </button>
                  )}
                </div>
              </div>
              <p style={hint}>فرمت‌های مجاز: JPG، PNG، WebP — حداکثر ۵ مگابایت</p>
            </div>
            <Row>
              <div>
                <label style={lbl}>تلفن</label>
                <input value={get("site_phone")} onChange={e => set("site_phone", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} />
              </div>
              <div>
                <label style={lbl}>شهر</label>
                <input value={get("site_city", "")} onChange={e => set("site_city", e.target.value)} style={inp} />
              </div>
            </Row>
            <div>
              <label style={lbl}>آدرس</label>
              <input value={get("site_address")} onChange={e => set("site_address", e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>درباره ما (خلاصه)</label>
              <textarea value={get("site_about", "")} onChange={e => set("site_about", e.target.value)} rows={3} style={{ ...inp, resize: "vertical", lineHeight: 1.7 }} />
            </div>
            <SaveBtn groupName="general" keys={["site_name", "site_logo", "site_email", "site_phone", "site_city", "site_address", "site_about"]} />
          </Section>

          <Section title="اطلاعات تماس و فوتر" icon="ti-phone">
            <Row>
              <div>
                <label style={lbl}>تلفن (نمایش در هدر)</label>
                <input value={get("site_phone", "۰۲۱-۴۴۵۵۶۶۷۷")} onChange={e => set("site_phone", e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>واتساپ</label>
                <input value={get("site_whatsapp", "")} onChange={e => set("site_whatsapp", e.target.value)} style={inp} />
              </div>
            </Row>
            <Row>
              <div>
                <label style={lbl}>ایمیل</label>
                <input value={get("site_email", "")} onChange={e => set("site_email", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} />
              </div>
              <div>
                <label style={lbl}>آدرس</label>
                <input value={get("site_address", "")} onChange={e => set("site_address", e.target.value)} style={inp} />
              </div>
            </Row>
            <Row>
              <div>
                <label style={lbl}>ساعات کاری (هدر)</label>
                <input value={get("site_hours", "شنبه تا پنجشنبه ۸ تا ۱۷")} onChange={e => set("site_hours", e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>متن ارسال رایگان (هدر)</label>
                <input value={get("site_free_shipping_text", "")} onChange={e => set("site_free_shipping_text", e.target.value)} style={inp} />
              </div>
            </Row>
            <div>
              <label style={lbl}>متن فوتر (کپی‌رایت)</label>
              <input value={get("site_footer_text", "© ۱۴۰۴ Marjan")} onChange={e => set("site_footer_text", e.target.value)} style={inp} />
            </div>
            <Row>
              <div>
                <label style={lbl}>اینستاگرام (لینک)</label>
                <input value={get("social_instagram", "#")} onChange={e => set("social_instagram", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} />
              </div>
              <div>
                <label style={lbl}>تلگرام (لینک)</label>
                <input value={get("social_telegram", "#")} onChange={e => set("social_telegram", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} />
              </div>
            </Row>
            <Row>
              <div>
                <label style={lbl}>لینکدین (لینک)</label>
                <input value={get("social_linkedin", "#")} onChange={e => set("social_linkedin", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} />
              </div>
              <div>
                <label style={lbl}>واتساپ (لینک)</label>
                <input value={get("social_whatsapp", "#")} onChange={e => set("social_whatsapp", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} />
              </div>
            </Row>
            <SaveBtn groupName="contact" keys={["site_phone", "site_whatsapp", "site_email", "site_address", "site_hours", "site_free_shipping_text", "site_footer_text", "social_instagram", "social_telegram", "social_linkedin", "social_whatsapp"]} />
          </Section>

          <Section title="تنظیمات ارسال" icon="ti-truck-delivery">
            <Row>
              <div>
                <label style={lbl}>حداقل سفارش برای ارسال رایگان (ریال)</label>
                <input type="number" value={get("free_shipping_threshold")} onChange={e => set("free_shipping_threshold", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} />
                <p style={hint}>اگر ۰ باشد، ارسال رایگان برای همه سفارش‌ها</p>
              </div>
              <div>
                <label style={lbl}>هزینه پیش‌فرض ارسال (ریال)</label>
                <input type="number" value={get("default_shipping_cost", "50000")} onChange={e => set("default_shipping_cost", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} />
              </div>
            </Row>
            <Row>
              <div>
                <label style={lbl}>نرخ مالیات (%)</label>
                <input type="number" min="0" max="100" value={get("tax_rate")} onChange={e => set("tax_rate", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} />
              </div>
              <div>
                <label style={lbl}>روزهای کاری ارسال</label>
                <input value={get("shipping_days", "۲۴ تا ۷۲ ساعت")} onChange={e => set("shipping_days", e.target.value)} style={inp} />
              </div>
            </Row>
            <SaveBtn groupName="shipping" keys={["free_shipping_threshold", "default_shipping_cost", "tax_rate", "shipping_days"]} />
          </Section>
        </>
      )}

      {/* ── PAYMENT TAB ── */}
      {tab === "payment" && (
        <>
          <Section title="درگاه زرین‌پال" icon="ti-credit-card">
            <Row>
              <div>
                <label style={lbl}>Merchant ID</label>
                <input value={get("zarinpal_merchant_id", "")} onChange={e => set("zarinpal_merchant_id", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left", fontFamily: "monospace" }} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
              </div>
              <div>
                <label style={lbl}>حالت</label>
                <select value={get("zarinpal_mode", "sandbox")} onChange={e => set("zarinpal_mode", e.target.value)} style={inp}>
                  <option value="sandbox">آزمایشی (Sandbox)</option>
                  <option value="production">واقعی (Production)</option>
                </select>
              </div>
            </Row>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)" }}>
              <input type="checkbox" id="zarinpal-enabled" checked={get("zarinpal_enabled", "true") === "true"} onChange={e => set("zarinpal_enabled", e.target.checked ? "true" : "false")} style={{ width: 16, height: 16, cursor: "pointer" }} />
              <label htmlFor="zarinpal-enabled" style={{ fontSize: 13, fontWeight: 700, cursor: "pointer" }}>درگاه زرین‌پال فعال باشد</label>
            </div>
            <SaveBtn groupName="payment" keys={["zarinpal_merchant_id", "zarinpal_mode", "zarinpal_enabled"]} />
          </Section>

          <Section title="تنظیمات کیف پول" icon="ti-wallet">
            <Row>
              <div>
                <label style={lbl}>حداقل شارژ کیف پول (ریال)</label>
                <input type="number" value={get("wallet_min_charge", "50000")} onChange={e => set("wallet_min_charge", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} />
              </div>
              <div>
                <label style={lbl}>حداکثر موجودی کیف پول (ریال)</label>
                <input type="number" value={get("wallet_max_balance", "50000000")} onChange={e => set("wallet_max_balance", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} />
              </div>
            </Row>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)" }}>
              <input type="checkbox" id="wallet-enabled" checked={get("wallet_enabled", "true") === "true"} onChange={e => set("wallet_enabled", e.target.checked ? "true" : "false")} style={{ width: 16, height: 16, cursor: "pointer" }} />
              <label htmlFor="wallet-enabled" style={{ fontSize: 13, fontWeight: 700, cursor: "pointer" }}>کیف پول فعال باشد</label>
            </div>
            <SaveBtn groupName="payment" keys={["wallet_min_charge", "wallet_max_balance", "wallet_enabled"]} />
          </Section>
        </>
      )}

      {/* ── SEO TAB ── */}
      {tab === "seo" && (
        <>
          <Section title="متا تگ‌های پیش‌فرض" icon="ti-search">
            <div>
              <label style={lbl}>عنوان پیش‌فرض سایت</label>
              <input value={get("seo_default_title", "")} onChange={e => set("seo_default_title", e.target.value)} style={inp} placeholder="عنوان | نام فروشگاه" />
              <p style={hint}>این عنوان در صفحاتی که متا عنوان خاصی ندارند استفاده می‌شود</p>
            </div>
            <div>
              <label style={lbl}>توضیح پیش‌فرض (Meta Description)</label>
              <textarea value={get("seo_default_desc", "")} onChange={e => set("seo_default_desc", e.target.value)} rows={3} style={{ ...inp, resize: "vertical", lineHeight: 1.7 }} placeholder="توضیح کوتاه فروشگاه برای موتورهای جستجو..." />
              <p style={hint}>توصیه می‌شود بین ۱۵۰ تا ۱۶۰ کاراکتر باشد ({get("seo_default_desc", "").length} کاراکتر)</p>
            </div>
            <div>
              <label style={lbl}>کلمات کلیدی (Keywords)</label>
              <input value={get("seo_keywords", "")} onChange={e => set("seo_keywords", e.target.value)} style={inp} placeholder="شیرآلات، لوله، اتصالات، تهران" />
            </div>
            <Row>
              <div>
                <label style={lbl}>آدرس کانونیکال سایت</label>
                <input value={get("seo_canonical_url", "")} onChange={e => set("seo_canonical_url", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} placeholder="https://marjan.ir" />
              </div>
              <div>
                <label style={lbl}>Google Analytics ID</label>
                <input value={get("seo_ga_id", "")} onChange={e => set("seo_ga_id", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left", fontFamily: "monospace" }} placeholder="G-XXXXXXXXXX" />
              </div>
            </Row>
            <SaveBtn groupName="seo" keys={["seo_default_title", "seo_default_desc", "seo_keywords", "seo_canonical_url", "seo_ga_id"]} />
          </Section>

          <Section title="Open Graph (شبکه‌های اجتماعی)" icon="ti-share">
            <Row>
              <div>
                <label style={lbl}>عنوان OG</label>
                <input value={get("og_title", "")} onChange={e => set("og_title", e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>تصویر OG (آدرس کامل)</label>
                <input value={get("og_image", "")} onChange={e => set("og_image", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} placeholder="https://..." />
              </div>
            </Row>
            <div>
              <label style={lbl}>توضیح OG</label>
              <textarea value={get("og_desc", "")} onChange={e => set("og_desc", e.target.value)} rows={2} style={{ ...inp, resize: "vertical", lineHeight: 1.7 }} />
            </div>
            <SaveBtn groupName="seo" keys={["og_title", "og_image", "og_desc"]} />
          </Section>
        </>
      )}

      {/* ── SECURITY TAB ── */}
      {tab === "security" && (
        <>
          <Section title="تنظیمات امنیتی" icon="ti-lock">
            <Row>
              <div>
                <label style={lbl}>حداکثر تلاش ورود ناموفق</label>
                <input type="number" min="1" max="20" value={get("max_login_attempts", "5")} onChange={e => set("max_login_attempts", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} />
                <p style={hint}>بعد از این تعداد، حساب موقتاً قفل می‌شود</p>
              </div>
              <div>
                <label style={lbl}>مدت قفل حساب (دقیقه)</label>
                <input type="number" min="1" value={get("lockout_duration_min", "15")} onChange={e => set("lockout_duration_min", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} />
              </div>
            </Row>
            <Row>
              <div>
                <label style={lbl}>مدت اعتبار توکن تأیید ایمیل (ساعت)</label>
                <input type="number" min="1" value={get("email_verify_ttl_hours", "24")} onChange={e => set("email_verify_ttl_hours", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} />
              </div>
              <div>
                <label style={lbl}>مدت اعتبار توکن بازنشانی رمز (دقیقه)</label>
                <input type="number" min="5" value={get("password_reset_ttl_min", "30")} onChange={e => set("password_reset_ttl_min", e.target.value)} style={{ ...inp, direction: "ltr", textAlign: "left" }} />
              </div>
            </Row>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { key: "require_email_verify", label: "تأیید ایمیل هنگام ثبت‌نام اجباری باشد" },
                { key: "allow_google_login", label: "ورود با گوگل فعال باشد" },
                { key: "allow_guest_checkout", label: "خرید بدون ثبت‌نام مجاز باشد" },
              ].map(item => (
                <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)" }}>
                  <input type="checkbox" id={item.key} checked={get(item.key, "true") === "true"} onChange={e => set(item.key, e.target.checked ? "true" : "false")} style={{ width: 16, height: 16, cursor: "pointer" }} />
                  <label htmlFor={item.key} style={{ fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{item.label}</label>
                </div>
              ))}
            </div>
            <SaveBtn groupName="security" keys={["max_login_attempts", "lockout_duration_min", "email_verify_ttl_hours", "password_reset_ttl_min", "require_email_verify", "allow_google_login", "allow_guest_checkout"]} />
          </Section>

          <Section title="CORS و دسترسی API" icon="ti-api">
            <div>
              <label style={lbl}>دامنه‌های مجاز CORS</label>
              <textarea value={get("cors_origins", "")} onChange={e => set("cors_origins", e.target.value)} rows={3} style={{ ...inp, direction: "ltr", textAlign: "left", fontFamily: "monospace", lineHeight: 1.7, resize: "vertical" }} placeholder={"https://marjan.ir\nhttps://www.marjan.ir"} />
              <p style={hint}>هر دامنه در یک خط جداگانه</p>
            </div>
            <div>
              <label style={lbl}>IP‌های مسدود شده</label>
              <textarea value={get("blocked_ips", "")} onChange={e => set("blocked_ips", e.target.value)} rows={3} style={{ ...inp, direction: "ltr", textAlign: "left", fontFamily: "monospace", lineHeight: 1.7, resize: "vertical" }} placeholder="192.168.1.1" />
            </div>
            <SaveBtn groupName="security" keys={["cors_origins", "blocked_ips"]} />
          </Section>

          <SecurityReport />
        </>
      )}
    </div>
  );
}
