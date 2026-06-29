"use client";
import { useState, useEffect, useCallback } from "react";
import {
  AdminPageHeader, AdminBtn, AdminCard, AdminCardHeader, AdminBadge,
  AdminEmptyState, AdminModal, AdminField, AdminInput, AdminToggle,
  AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";
import { SERVICE_FIELDS } from "@/lib/connections";

interface ApiKey { id: string; label: string; service: string; maskedKey: string; createdAt: string; }
type ConfigMeta = Record<string, Record<string, { set: boolean; value: string; secret: boolean }>>;

interface ConnectionsState {
  zarinpal: boolean; idpay: boolean; nextpay: boolean;
  kavenegar: boolean; ghasedak: boolean;
  tipax: boolean; pishro: boolean;
  instagram: boolean; telegram: boolean; whatsapp: boolean; linkedin: boolean;
}
const DEFAULT_STATE: ConnectionsState = { zarinpal: false, idpay: false, nextpay: false, kavenegar: false, ghasedak: false, tipax: false, pishro: false, instagram: false, telegram: false, whatsapp: false, linkedin: false };

const GRID: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 16, marginBottom: 16 };

// ─── Per-service configuration + test ──────────────────────────────────────
function ServiceConfigPanel({ service, meta, onSaved }: {
  service: string; meta?: Record<string, { set: boolean; value: string; secret: boolean }>; onSaved: () => void;
}) {
  const fields = SERVICE_FIELDS[service] ?? [];
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map(f => [f.key, f.secret ? "" : (meta?.[f.key]?.value ?? "")]))
  );
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const save = async () => {
    setSaving(true); setResult(null);
    try {
      const res = await fetch("/api/admin/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "saveConfig", service, values: draft }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setResult({ ok: false, msg: d.error ?? "خطا در ذخیره" }); return; }
      setResult({ ok: true, msg: "پیکربندی ذخیره شد" });
      setDraft(d => Object.fromEntries(fields.map(f => [f.key, f.secret ? "" : (d[f.key] ?? "")])));
      onSaved();
    } catch { setResult({ ok: false, msg: "خطای سرور" }); }
    finally { setSaving(false); }
  };

  const test = async () => {
    setTesting(true); setResult(null);
    try {
      const res = await fetch("/api/admin/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "test", service }) });
      const d = await res.json().catch(() => ({}));
      setResult({ ok: !!d.ok, msg: d.message ?? "—" });
    } catch { setResult({ ok: false, msg: "خطای سرور" }); }
    finally { setTesting(false); }
  };

  return (
    <div style={{ background: "var(--bg)", borderRadius: 10, padding: 14, border: "1px solid var(--border)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 10 }}>
        {fields.map(f => {
          const isSet = meta?.[f.key]?.set;
          return (
            <AdminField key={f.key} label={f.label} style={{ marginBottom: 0 }}>
              <AdminInput
                value={draft[f.key] ?? ""}
                onChange={v => setDraft(d => ({ ...d, [f.key]: v }))}
                type={f.secret ? "password" : "text"}
                placeholder={f.secret && isSet ? "•••• ذخیره‌شده — برای تغییر وارد کنید" : (f.placeholder ?? "")}
                style={f.secret ? { direction: "ltr" } : undefined}
              />
            </AdminField>
          );
        })}
      </div>
      {result && (
        <div style={{ fontSize: 12, fontWeight: 700, color: result.ok ? "#1a7a4a" : "#c0392b", marginBottom: 8 }}>
          <i className={`ti ${result.ok ? "ti-circle-check" : "ti-alert-circle"}`} style={{ marginLeft: 4 }} />{result.msg}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <AdminBtn size="sm" variant="primary" icon="ti-device-floppy" loading={saving} onClick={save}>ذخیره پیکربندی</AdminBtn>
        <AdminBtn size="sm" icon={testing ? "ti-loader-2" : "ti-plug-connected"} loading={testing} onClick={test}>تست اتصال</AdminBtn>
      </div>
    </div>
  );
}

// ─── One connection row (toggle + expandable config) ────────────────────────
function ConnRow({ serviceKey, icon, iconBg, name, description, checked, onToggle, saving, activeLabel = "فعال", inactiveLabel = "غیرفعال", expanded, onToggleExpand, configMeta, onConfigSaved }: {
  serviceKey: string; icon: string; iconBg: string; name: string; description: string;
  checked: boolean; onToggle: () => void; saving?: boolean; activeLabel?: string; inactiveLabel?: string;
  expanded: boolean; onToggleExpand: () => void;
  configMeta?: Record<string, { set: boolean; value: string; secret: boolean }>; onConfigSaved: () => void;
}) {
  const hasConfig = (SERVICE_FIELDS[serviceKey]?.length ?? 0) > 0;
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <i className={`ti ${icon}`} style={{ fontSize: 22, color: "#fff" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{name}</span>
            <AdminBadge variant={checked ? "success" : "neutral"} size="xs">{checked ? activeLabel : inactiveLabel}</AdminBadge>
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>{description}</div>
        </div>
        {hasConfig && (
          <button onClick={onToggleExpand} title="پیکربندی"
            style={{ background: expanded ? "rgba(10,42,94,0.10)" : "transparent", border: "1px solid var(--border)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "var(--text2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className={`ti ti-settings`} style={{ fontSize: 15 }} />
          </button>
        )}
        <div style={{ opacity: saving ? 0.5 : 1, flexShrink: 0 }}>
          <AdminToggle checked={checked} onChange={() => !saving && onToggle()} />
        </div>
      </div>
      {expanded && hasConfig && (
        <div style={{ padding: "0 20px 16px" }}>
          <ServiceConfigPanel service={serviceKey} meta={configMeta} onSaved={onConfigSaved} />
        </div>
      )}
    </div>
  );
}

// ─── Stored API key row (write-only — secret is never sent to the client) ───
function ApiKeyRow({ entry, onDelete, onReplace }: { entry: ApiKey; onDelete: (id: string) => void; onReplace: (id: string) => void; }) {
  return (
    <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{entry.label}</div>
            {entry.service && entry.service !== entry.label && <AdminBadge variant="info" size="xs">{entry.service}</AdminBadge>}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text3)", direction: "ltr", textAlign: "left" }}>{entry.maskedKey || "••••••••"}</div>
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3 }}>به‌روزرسانی: {new Date(entry.createdAt).toLocaleDateString("fa-IR")}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <AdminBtn size="sm" icon="ti-refresh" onClick={() => onReplace(entry.id)}>جایگزینی</AdminBtn>
          <AdminBtn size="sm" icon="ti-trash" variant="danger" onClick={() => { if (confirm(`حذف کلید "${entry.label}"؟`)) onDelete(entry.id); }}>حذف</AdminBtn>
        </div>
      </div>
    </div>
  );
}

export default function ConnectionsManager() {
  const { toast, showToast } = useAdminToast();
  const [connState, setConnState] = useState<ConnectionsState>(DEFAULT_STATE);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [config, setConfig] = useState<ConfigMeta>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newService, setNewService] = useState("");
  const [newKey, setNewKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [formErr, setFormErr] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/settings?group=connections").then(r => r.json()).catch(() => ({})),
      fetch("/api/admin/connections").then(r => r.json()).catch(() => ({})),
    ]).then(([settings, conn]) => {
      const map: Record<string, string> = settings?.map ?? {};
      if (map.connections_toggles) { try { setConnState(prev => ({ ...prev, ...JSON.parse(map.connections_toggles) })); } catch { /* bad json */ } }
      setApiKeys(conn?.keys ?? []);
      setConfig(conn?.config ?? {});
    }).finally(() => setLoading(false));
  }, []);

  const reloadConn = useCallback(() => {
    fetch("/api/admin/connections").then(r => r.json()).then(d => { setApiKeys(d.keys ?? []); setConfig(d.config ?? {}); }).catch(() => {});
  }, []);

  const saveToggles = useCallback(async (next: ConnectionsState, key: string) => {
    setSaving(key);
    try {
      await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group: "connections", settings: { connections_toggles: JSON.stringify(next) } }) });
      showToast("success", "تغییر ذخیره شد");
    } catch { showToast("error", "خطا در ذخیره"); }
    finally { setSaving(null); }
  }, [showToast]);

  const toggle = (key: keyof ConnectionsState) => {
    const next = { ...connState, [key]: !connState[key] };
    setConnState(next); saveToggles(next, key);
  };

  const addKey = async () => {
    if (!newLabel.trim()) { setFormErr("نام کلید را وارد کنید"); return; }
    if (!newKey.trim()) { setFormErr("مقدار کلید را وارد کنید"); return; }
    try {
      const res = await fetch("/api/admin/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "addKey", label: newLabel.trim(), service: newService.trim(), key: newKey.trim() }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setFormErr(d.error ?? "خطا در ذخیره"); return; }
      setApiKeys(p => [...p, d.key]);
      setShowAddModal(false); setNewLabel(""); setNewService(""); setNewKey(""); setFormErr("");
      showToast("success", "کلید API اضافه شد");
    } catch { setFormErr("خطای سرور"); }
  };

  const deleteKey = async (id: string) => {
    try {
      await fetch("/api/admin/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deleteKey", id }) });
      setApiKeys(p => p.filter(k => k.id !== id));
      showToast("success", "کلید حذف شد");
    } catch { showToast("error", "خطا در حذف"); }
  };

  const replaceKey = async (id: string) => {
    const v = window.prompt("کلید جدید را وارد کنید (مقدار قبلی جایگزین می‌شود):");
    if (!v || !v.trim()) return;
    try {
      const res = await fetch("/api/admin/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "replaceKey", id, key: v.trim() }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { showToast("error", d.error ?? "خطا"); return; }
      setApiKeys(p => p.map(k => k.id === id ? d.key : k));
      showToast("success", "کلید جایگزین شد");
    } catch { showToast("error", "خطای سرور"); }
  };

  if (loading) return <AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری اتصال‌ها..." />;

  const rowProps = (key: keyof ConnectionsState) => ({
    serviceKey: key, checked: connState[key], onToggle: () => toggle(key), saving: saving === key,
    expanded: expanded === key, onToggleExpand: () => setExpanded(e => e === key ? null : key),
    configMeta: config[key], onConfigSaved: reloadConn,
  });

  return (
    <div>
      <AdminToast toast={toast} />
      <AdminPageHeader title="اتصال‌ها" icon="ti-plug" subtitle="سرویس‌های پرداخت، پیامک، ارسال و شبکه‌های اجتماعی. سوییچ‌ها خودکار ذخیره می‌شوند؛ برای هر سرویس روی چرخ‌دنده بزنید تا پیکربندی شود." />

      <div style={GRID}>
        <AdminCard padding={0}>
          <AdminCardHeader title="درگاه‌های پرداخت" icon="ti-credit-card" subtitle="اتصال به درگاه‌های پرداخت برای پردازش تراکنش‌های مالی" />
          <ConnRow {...rowProps("zarinpal")} icon="ti-credit-card" iconBg="linear-gradient(135deg,#7b2ddb 0%,#a855f7 100%)" name="زرین‌پال" description="درگاه پرداخت اینترنتی زرین‌پال" />
          <ConnRow {...rowProps("idpay")} icon="ti-wallet" iconBg="linear-gradient(135deg,#0a2a5e 0%,#1a5fa0 100%)" name="آی‌دی‌پی" description="درگاه پرداخت IDPay" />
          <ConnRow {...rowProps("nextpay")} icon="ti-cash" iconBg="linear-gradient(135deg,#1a7a4a 0%,#27ae60 100%)" name="نکست‌پی" description="درگاه پرداخت NextPay" />
        </AdminCard>

        <AdminCard padding={0}>
          <AdminCardHeader title="سرویس‌های پیامک" icon="ti-message-2" subtitle="ارسال پیامک تأیید، اطلاع‌رسانی و بازاریابی" />
          <ConnRow {...rowProps("kavenegar")} icon="ti-message-2" iconBg="linear-gradient(135deg,#e8920a 0%,#f39c12 100%)" name="کاوه‌نگار" description="پنل پیامک Kavenegar" />
          <ConnRow {...rowProps("ghasedak")} icon="ti-device-mobile-message" iconBg="linear-gradient(135deg,#c0392b 0%,#e74c3c 100%)" name="قاصدک" description="سرویس پیامک Ghasedak" />
        </AdminCard>
      </div>

      <div style={GRID}>
        <AdminCard padding={0}>
          <AdminCardHeader title="شرکت‌های ارسال" icon="ti-truck-delivery" subtitle="یکپارچه‌سازی با پنل شرکت‌های حمل‌ونقل" />
          <ConnRow {...rowProps("tipax")} icon="ti-truck-delivery" iconBg="linear-gradient(135deg,#0a2a5e 0%,#1a5fa0 100%)" name="تیپاکس" description="ارسال سراسری با تیپاکس" />
          <ConnRow {...rowProps("pishro")} icon="ti-package" iconBg="linear-gradient(135deg,#1a7a4a 0%,#27ae60 100%)" name="پیشرو" description="شرکت حمل‌ونقل پیشرو" />
        </AdminCard>

        <AdminCard padding={0}>
          <AdminCardHeader title="شبکه‌های اجتماعی" icon="ti-share" subtitle="اتصال به شبکه‌های اجتماعی برای اشتراک‌گذاری محتوا و پشتیبانی" />
          <ConnRow {...rowProps("instagram")} icon="ti-brand-instagram" iconBg="linear-gradient(135deg,#c13584 0%,#e1306c 100%)" name="اینستاگرام" description="اشتراک‌گذاری محصولات و تخفیف‌ها" activeLabel="متصل" inactiveLabel="قطع" />
          <ConnRow {...rowProps("telegram")} icon="ti-brand-telegram" iconBg="linear-gradient(135deg,#0088cc 0%,#229ed9 100%)" name="تلگرام" description="کانال اطلاع‌رسانی و پشتیبانی" activeLabel="متصل" inactiveLabel="قطع" />
          <ConnRow {...rowProps("whatsapp")} icon="ti-brand-whatsapp" iconBg="linear-gradient(135deg,#25D366 0%,#128C7E 100%)" name="واتس‌اپ" description="پشتیبانی آنلاین از طریق واتس‌اپ" activeLabel="متصل" inactiveLabel="قطع" />
          <ConnRow {...rowProps("linkedin")} icon="ti-brand-linkedin" iconBg="linear-gradient(135deg,#0077B5 0%,#00a0dc 100%)" name="لینکدین" description="شبکه حرفه‌ای کسب‌وکار" activeLabel="متصل" inactiveLabel="قطع" />
        </AdminCard>
      </div>

      <AdminCard padding={0}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <AdminCardHeader title="کلیدهای API" icon="ti-key" subtitle="کلیدها امن در سرور ذخیره می‌شوند و دیگر کامل نمایش داده نمی‌شوند — فقط نسخه ماسک‌شده." />
          <AdminBtn icon="ti-plus" variant="primary" size="sm" onClick={() => setShowAddModal(true)}>افزودن کلید</AdminBtn>
        </div>
        {apiKeys.length === 0
          ? <AdminEmptyState icon="ti-key-off" title="هیچ کلیدی اضافه نشده" subtitle="کلیدهای API درگاه‌های پرداخت، پیامک و سرویس‌های دیگر را اینجا ذخیره کنید" />
          : apiKeys.map(k => <ApiKeyRow key={k.id} entry={k} onDelete={deleteKey} onReplace={replaceKey} />)
        }
      </AdminCard>

      <AdminModal open={showAddModal} onClose={() => { setShowAddModal(false); setNewLabel(""); setNewService(""); setNewKey(""); setFormErr(""); }} title="افزودن کلید API">
        <AdminField label="نام کلید" required>
          <AdminInput value={newLabel} onChange={setNewLabel} placeholder="مثلاً: کلید پرداخت زرین‌پال" />
        </AdminField>
        <AdminField label="سرویس">
          <AdminInput value={newService} onChange={setNewService} placeholder="مثلاً: ZarinPal" />
        </AdminField>
        <AdminField label="مقدار کلید" required hint="کلید فقط همین حالا قابل مشاهده است؛ پس از ذخیره فقط نسخه ماسک‌شده نمایش داده می‌شود.">
          <div style={{ position: "relative" }}>
            <AdminInput value={newKey} onChange={setNewKey} type={showKey ? "text" : "password"} placeholder="کلید API را وارد کنید" style={{ direction: "ltr", fontFamily: "monospace", paddingLeft: 40 }} />
            <button onClick={() => setShowKey(v => !v)} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 16 }}>
              <i className={`ti ${showKey ? "ti-eye-off" : "ti-eye"}`} />
            </button>
          </div>
        </AdminField>
        {formErr && <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 700 }}>{formErr}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <AdminBtn variant="primary" icon="ti-check" onClick={addKey} style={{ flex: 1, justifyContent: "center" }}>ذخیره</AdminBtn>
          <AdminBtn variant="secondary" onClick={() => { setShowAddModal(false); setFormErr(""); }}>انصراف</AdminBtn>
        </div>
      </AdminModal>
    </div>
  );
}
