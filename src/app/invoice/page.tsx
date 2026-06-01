"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/utils";

interface InvoiceItem {
  id: string;
  desc: string;
  qty: number;
  unit: string;
  price?: number;
  brand?: string;
  note?: string;
}

function genId() { return Math.random().toString(36).slice(2); }

const contractorItems = {
  pipes: [
    { name: "لوله پلیکا PVC", sizes: ["۵۰", "۷۵", "۱۱۰", "۱۶۰", "۲۰۰", "۳۱۵"], unit: "شاخه" },
    { name: "لوله پوش‌فیت", sizes: ["۵۰", "۱۱۰", "۱۶۰"], unit: "شاخه" },
    { name: "لوله پنج‌لایه", sizes: ["۱۶mm", "۲۰mm", "۲۵mm", "۳۲mm"], unit: "متر" },
    { name: "لوله مانیسمان", sizes: ["۱/۲\"", "۳/۴\"", "۱\"", "۲\"", "۴\""], unit: "شاخه" },
    { name: "لوله گالوانیزه", sizes: ["۱/۲\"", "۱\"", "۲\""], unit: "شاخه" },
    { name: "لوله پلی‌اتیلن", sizes: ["۲۵mm", "۶۳mm", "۱۱۰mm"], unit: "متر" },
  ],
  fittings: [
    { name: "زانو ۹۰°", sizes: ["۱/۲\"", "۳/۴\"", "۱\"", "۲\"", "۱۱۰mm"], unit: "عدد" },
    { name: "زانو ۴۵°", sizes: ["۱/۲\"", "۳/۴\"", "۱\"", "۱۱۰mm"], unit: "عدد" },
    { name: "سه‌راهی", sizes: ["۱/۲\"", "۳/۴\"", "۱\"", "۱۱۰mm", "۱۶۰mm"], unit: "عدد" },
    { name: "بوشن", sizes: ["۱/۲\"", "۳/۴\"", "۱\"", "۲\""], unit: "عدد" },
    { name: "تبدیل", sizes: ["۳/۴-۱/۲", "۱-۳/۴", "۲-۱"], unit: "عدد" },
    { name: "درپوش", sizes: ["۱/۲\"", "۳/۴\"", "۱\"", "۱۱۰mm"], unit: "عدد" },
  ],
  valves: [
    { name: "شیر توپی", sizes: ["۱/۴\"", "۱/۲\"", "۳/۴\"", "۱\"", "۲\"", "۴\""], unit: "عدد" },
    { name: "شیر سوزنی", sizes: ["۱/۲\"", "۳/۴\"", "۱\""], unit: "عدد" },
    { name: "شیر یک‌طرفه", sizes: ["۱/۲\"", "۱\"", "۲\""], unit: "عدد" },
  ],
};

function InvoiceContent() {
  const sp = useSearchParams();
  const defaultType = (sp.get("type") as "official" | "contractor") ?? "official";
  const [activeTab, setActiveTab] = useState<"official" | "contractor">(defaultType);
  const [saved, setSaved] = useState(false);

  // Official invoice state
  const [buyer, setBuyer] = useState("");
  const [invNum, setInvNum] = useState("INV-۱۴۰۴-۰۰۱");
  const [invDate, setInvDate] = useState("۳۰ خرداد ۱۴۰۴");
  const [discountPct, setDiscountPct] = useState(0);
  const [officialItems, setOfficialItems] = useState<InvoiceItem[]>([
    { id: genId(), desc: "شیر توپی برنجی ۱ اینچ — تبریز", qty: 10, unit: "عدد", price: 1394000 },
    { id: genId(), desc: "لوله پلیکا ۱۱۰ — ۶ متری", qty: 5, unit: "شاخه", price: 850000 },
  ]);

  // Contractor invoice state
  const [ctName, setCtName] = useState("");
  const [ctProject, setCtProject] = useState("");
  const [ctDate, setCtDate] = useState("۳۰ خرداد ۱۴۰۴");
  const [ctNum, setCtNum] = useState("LST-۰۰۱");
  const [contractorItems2, setContractorItems2] = useState<InvoiceItem[]>([
    { id: genId(), desc: "زانو ۹۰ پلیمری - ۱/۲ اینچ", qty: 12, unit: "عدد", brand: "لگریس" },
    { id: genId(), desc: "لوله پلیکا PVC - ۱۱۰mm - ۶متری", qty: 8, unit: "شاخه", brand: "پیوند" },
  ]);

  function officialSubtotal() { return officialItems.reduce((s, i) => s + (i.price ?? 0) * i.qty, 0); }
  function officialDiscount() { return Math.round(officialSubtotal() * discountPct / 100); }
  function officialTax() { return Math.round((officialSubtotal() - officialDiscount()) * 0.1); }
  function officialTotal() { return officialSubtotal() - officialDiscount() + officialTax(); }

  function addOfficialRow() {
    setOfficialItems([...officialItems, { id: genId(), desc: "", qty: 1, unit: "عدد", price: 0 }]);
  }
  function removeOfficialRow(id: string) { setOfficialItems(officialItems.filter((i) => i.id !== id)); }
  function updateOfficial(id: string, field: string, value: string | number) {
    setOfficialItems(officialItems.map((i) => i.id === id ? { ...i, [field]: value } : i));
  }

  function addContractorItem(desc: string, unit: string) {
    setContractorItems2([...contractorItems2, { id: genId(), desc, qty: 1, unit, brand: "" }]);
  }
  function removeContractorRow(id: string) { setContractorItems2(contractorItems2.filter((i) => i.id !== id)); }
  function updateContractor(id: string, field: string, value: string | number) {
    setContractorItems2(contractorItems2.map((i) => i.id === id ? { ...i, [field]: value } : i));
  }

  async function handleSave() {
    const items = activeTab === "official" ? officialItems : contractorItems2;
    const subtotal = activeTab === "official" ? officialSubtotal() : 0;
    const totalAmount = activeTab === "official" ? officialTotal() : 0;
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: activeTab.toUpperCase(),
        buyerName: buyer || ctName,
        issueDate: invDate || ctDate,
        items, subtotal, totalAmount, discountPct, taxPct: 10,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const inputStyle: React.CSSProperties = { border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, color: "var(--text)", outline: "none", width: "100%" };
  const tdInputStyle: React.CSSProperties = { border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 8px", fontFamily: "Vazirmatn", fontSize: 13, color: "var(--text)", outline: "none", width: "100%" };

  return (
    <>
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1280, margin: "auto", padding: ".75rem 2rem", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>
          <a href="/" style={{ color: "var(--primary)" }}>خانه</a>
          <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
          <span>فاکتورساز</span>
        </div>
      </div>
      <div style={{ background: "linear-gradient(135deg,var(--primary-dark),var(--primary-mid))", padding: "2.5rem 2rem" }}>
        <div style={{ maxWidth: 1280, margin: "auto" }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 6 }}>فاکتورساز آنلاین</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.65)" }}>فاکتور رسمی یا لیست مجریان — سریع بسازید و چاپ کنید</p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "2rem auto", padding: "0 2rem" }}>
        {/* Type Tabs */}
        <div style={{ display: "flex", gap: 10, marginBottom: "2rem" }}>
          {(["official", "contractor"] as const).map((t) => (
            <div
              key={t}
              onClick={() => setActiveTab(t)}
              style={{ flex: 1, padding: 12, borderRadius: "var(--radius-sm)", border: `2px solid ${activeTab === t ? "var(--primary)" : "var(--border)"}`, background: activeTab === t ? "var(--bg)" : "#fff", cursor: "pointer", textAlign: "center" }}
            >
              <i className={`ti ${t === "official" ? "ti-file-certificate" : "ti-helmet"}`} style={{ fontSize: 24, color: "var(--primary)", display: "block", marginBottom: 6 }} />
              <strong style={{ display: "block", fontSize: 13, fontWeight: 900, color: "var(--text)", marginBottom: 3 }}>
                {t === "official" ? "فاکتور رسمی فروش" : "فاکتور مجریان و تأسیساتکاران"}
              </strong>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>
                {t === "official" ? "با مالیات، تخفیف و چاپ رسمی" : "لیست سریع لوله، اتصالات و شیرآلات"}
              </span>
            </div>
          ))}
        </div>

        {saved && (
          <div style={{ background: "#e8f5e9", color: "#1a7a4a", padding: "12px 16px", borderRadius: "var(--radius-sm)", marginBottom: 16, fontWeight: 700, fontSize: 13 }}>
            <i className="ti ti-check" /> فاکتور با موفقیت ذخیره شد!
          </div>
        )}

        {/* OFFICIAL INVOICE */}
        {activeTab === "official" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem", alignItems: "start" }}>
            <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "2rem" }}>
              {/* Seller */}
              <div style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginBottom: "1rem", paddingBottom: ".75rem", borderBottom: "2px solid var(--bg2)", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-building" /> اطلاعات فروشنده
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>نام فروشنده</label><input style={inputStyle} defaultValue="Marjan — فروشگاه لوازم ساختمانی" /></div>
                <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>شماره تماس</label><input style={inputStyle} defaultValue="۰۲۱-۴۴۵۵۶۶۷۷" /></div>
              </div>

              {/* Buyer */}
              <div style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginTop: "1.5rem", marginBottom: "1rem", paddingBottom: ".75rem", borderBottom: "2px solid var(--bg2)", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-user" /> اطلاعات خریدار
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>نام خریدار</label><input style={inputStyle} value={buyer} onChange={(e) => setBuyer(e.target.value)} placeholder="نام خریدار" /></div>
                <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>شماره تماس</label><input style={inputStyle} placeholder="۰۹۱۲-XXX-XXXX" /></div>
              </div>

              {/* Invoice details */}
              <div style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginTop: "1.5rem", marginBottom: "1rem", paddingBottom: ".75rem", borderBottom: "2px solid var(--bg2)", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-calendar" /> مشخصات فاکتور
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>شماره فاکتور</label><input style={inputStyle} value={invNum} onChange={(e) => setInvNum(e.target.value)} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>تاریخ صدور</label><input style={inputStyle} value={invDate} onChange={(e) => setInvDate(e.target.value)} /></div>
              </div>

              {/* Items */}
              <div style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginTop: "1.5rem", marginBottom: "1rem", paddingBottom: ".75rem", borderBottom: "2px solid var(--bg2)", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-list" /> اقلام فاکتور
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "1rem 0" }}>
                <thead>
                  <tr>
                    {["شرح کالا / سایز", "تعداد", "واحد", "قیمت واحد (ت)", "جمع", ""].map((h) => (
                      <th key={h} style={{ background: "var(--bg)", padding: "9px 10px", fontSize: 12, fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "2px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {officialItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: "8px 6px", borderBottom: "1px solid var(--border)" }}><input style={tdInputStyle} value={item.desc} onChange={(e) => updateOfficial(item.id, "desc", e.target.value)} /></td>
                      <td style={{ padding: "8px 6px", borderBottom: "1px solid var(--border)" }}><input type="number" style={{ ...tdInputStyle, width: 56 }} value={item.qty} onChange={(e) => updateOfficial(item.id, "qty", Number(e.target.value))} /></td>
                      <td style={{ padding: "8px 6px", borderBottom: "1px solid var(--border)" }}><input style={{ ...tdInputStyle, width: 52 }} value={item.unit} onChange={(e) => updateOfficial(item.id, "unit", e.target.value)} /></td>
                      <td style={{ padding: "8px 6px", borderBottom: "1px solid var(--border)" }}><input type="number" style={{ ...tdInputStyle, width: 108 }} value={item.price ?? 0} onChange={(e) => updateOfficial(item.id, "price", Number(e.target.value))} /></td>
                      <td style={{ padding: "8px 6px", borderBottom: "1px solid var(--border)", fontWeight: 900, color: "var(--primary)" }}>{formatPrice((item.price ?? 0) * item.qty)}</td>
                      <td style={{ padding: "8px 6px", borderBottom: "1px solid var(--border)" }}><button onClick={() => removeOfficialRow(item.id)} style={{ background: "transparent", border: "none", color: "#c0392b", fontSize: 16, padding: 4, cursor: "pointer" }}><i className="ti ti-trash" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={addOfficialRow} style={{ background: "var(--bg2)", border: "1.5px dashed var(--border)", color: "var(--primary)", borderRadius: "var(--radius-sm)", padding: 9, fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", width: "100%", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                <i className="ti ti-plus" /> افزودن ردیف
              </button>

              {/* Totals */}
              <div style={{ background: "var(--bg)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, fontWeight: 700, color: "var(--text2)" }}><span>جمع کل</span><span>{formatPrice(officialSubtotal())}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, fontWeight: 700, color: "var(--text2)", alignItems: "center" }}>
                  <span>تخفیف</span>
                  <span><input type="number" value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))} style={{ width: 48, border: "1px solid var(--border)", borderRadius: 4, padding: "2px 6px", fontFamily: "Vazirmatn" }} /> %</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, fontWeight: 700, color: "var(--text2)" }}><span>مالیات ۱۰٪</span><span>{formatPrice(officialTax())}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 6px", fontSize: 16, fontWeight: 900, color: "var(--primary)", borderTop: "2px solid var(--border)", marginTop: 4 }}><span>مبلغ نهایی</span><span>{formatPrice(officialTotal())}</span></div>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>یادداشت</label>
                <textarea rows={3} style={inputStyle} placeholder="شرایط پرداخت، نحوه تحویل..." />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: "1.5rem" }}>
                <button onClick={handleSave} style={{ background: "#1a7a4a", color: "#fff", border: "none", padding: "11px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                  <i className="ti ti-device-floppy" /> ذخیره
                </button>
                <button onClick={() => window.print()} style={{ background: "var(--primary)", color: "#fff", border: "none", padding: "11px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                  <i className="ti ti-printer" /> چاپ / PDF
                </button>
              </div>
            </div>

            {/* Preview */}
            <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem", position: "sticky", top: 140 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".75rem" }}>
                <strong style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)" }}>پیش‌نمایش</strong>
                <span style={{ fontSize: 11, color: "var(--text3)" }}>آپدیت خودکار</span>
              </div>
              <div style={{ background: "var(--primary)", color: "#fff", padding: "1.25rem", borderRadius: "var(--radius-sm)", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div><h4 style={{ fontSize: 18, fontWeight: 900, marginBottom: 2 }}>فاکتور رسمی فروش</h4><p style={{ fontSize: 12, color: "rgba(255,255,255,.65)" }}>شماره: {invNum}</p></div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "var(--accent)" }}>Marjan</div>
                </div>
                <div style={{ marginTop: ".75rem", fontSize: 12, color: "rgba(255,255,255,.75)" }}>تاریخ: {invDate}</div>
              </div>
              <div style={{ fontSize: 12, marginBottom: ".75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontWeight: 700, color: "var(--text2)" }}>
                  <span>خریدار:</span><span style={{ color: "var(--text)" }}>{buyer || "—"}</span>
                </div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["کالا", "تعداد", "جمع"].map((h) => (
                      <th key={h} style={{ background: "var(--bg)", padding: "7px 8px", fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "1px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {officialItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{item.desc.substring(0, 20)}{item.desc.length > 20 ? "..." : ""}</td>
                      <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{item.qty}</td>
                      <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{formatPrice((item.price ?? 0) * item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ background: "var(--primary)", color: "#fff", padding: "10px 12px", borderRadius: "var(--radius-sm)", marginTop: ".75rem", display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 14 }}>
                <span>مبلغ نهایی</span><span>{formatPrice(officialTotal())}</span>
              </div>
            </div>
          </div>
        )}

        {/* CONTRACTOR INVOICE */}
        {activeTab === "contractor" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem", alignItems: "start" }}>
            <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "2rem" }}>
              <div style={{ background: "linear-gradient(135deg,var(--primary-dark),var(--primary-mid))", borderRadius: "var(--radius-sm)", padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 12 }}>
                <i className="ti ti-helmet" style={{ fontSize: 28, color: "var(--accent)" }} />
                <div>
                  <strong style={{ color: "#fff", fontSize: 14, display: "block" }}>فاکتور مجریان و تأسیساتکاران</strong>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,.65)" }}>لیست سریع لوازم مورد نیاز پروژه — قابل چاپ برای کارفرما</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>نام مجری</label><input style={inputStyle} value={ctName} onChange={(e) => setCtName(e.target.value)} placeholder="نام مجری یا شرکت" /></div>
                <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>نام پروژه</label><input style={inputStyle} value={ctProject} onChange={(e) => setCtProject(e.target.value)} placeholder="برج مسکونی رزیدنس" /></div>
                <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>تاریخ</label><input style={inputStyle} value={ctDate} onChange={(e) => setCtDate(e.target.value)} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>شماره لیست</label><input style={inputStyle} value={ctNum} onChange={(e) => setCtNum(e.target.value)} /></div>
              </div>

              {/* Quick add categories */}
              {Object.entries(contractorItems).map(([cat, items]) => (
                <div key={cat} style={{ marginBottom: "1.5rem" }}>
                  <div style={{ background: "var(--bg2)", borderRadius: "var(--radius-sm)", padding: ".75rem 1rem", marginBottom: "1rem", fontWeight: 900, color: "var(--primary)", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                    <i className={`ti ${cat === "pipes" ? "ti-minus" : cat === "fittings" ? "ti-git-merge" : "ti-circle-dotted"}`} />
                    {cat === "pipes" ? "لوله‌ها" : cat === "fittings" ? "اتصالات" : "شیرآلات"}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {items.map((item) => (
                      <div key={item.name} style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 10, cursor: "pointer", transition: "all .15s", textAlign: "center" }}>
                        <i className={`ti ${cat === "pipes" ? "ti-minus" : cat === "fittings" ? "ti-git-merge" : "ti-circle-dotted"}`} style={{ fontSize: 22, color: "var(--primary)", display: "block", marginBottom: 4 }} />
                        <span style={{ fontSize: 11, fontWeight: 900, color: "var(--text)", display: "block", marginBottom: 6 }}>{item.name}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
                          {item.sizes.map((s) => (
                            <button
                              key={s}
                              onClick={() => addContractorItem(`${item.name} - ${s}`, item.unit)}
                              style={{ background: "var(--bg2)", border: "1px solid var(--border)", color: "var(--text2)", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, cursor: "pointer", fontFamily: "Vazirmatn" }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Items table */}
              <div style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-list-check" /> لیست نهایی مواد
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["شرح کالا / سایز", "تعداد", "واحد", "برند", "یادداشت", ""].map((h) => (
                      <th key={h} style={{ background: "var(--bg)", padding: "9px 10px", fontSize: 12, fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "2px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contractorItems2.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: "8px 6px", borderBottom: "1px solid var(--border)" }}><input style={tdInputStyle} value={item.desc} onChange={(e) => updateContractor(item.id, "desc", e.target.value)} /></td>
                      <td style={{ padding: "8px 6px", borderBottom: "1px solid var(--border)" }}><input type="number" style={{ ...tdInputStyle, width: 56 }} value={item.qty} onChange={(e) => updateContractor(item.id, "qty", Number(e.target.value))} /></td>
                      <td style={{ padding: "8px 6px", borderBottom: "1px solid var(--border)" }}><input style={{ ...tdInputStyle, width: 52 }} value={item.unit} onChange={(e) => updateContractor(item.id, "unit", e.target.value)} /></td>
                      <td style={{ padding: "8px 6px", borderBottom: "1px solid var(--border)" }}><input style={{ ...tdInputStyle, width: 80 }} value={item.brand ?? ""} onChange={(e) => updateContractor(item.id, "brand", e.target.value)} /></td>
                      <td style={{ padding: "8px 6px", borderBottom: "1px solid var(--border)" }}><input style={tdInputStyle} value={item.note ?? ""} onChange={(e) => updateContractor(item.id, "note", e.target.value)} placeholder="توضیح..." /></td>
                      <td style={{ padding: "8px 6px", borderBottom: "1px solid var(--border)" }}><button onClick={() => removeContractorRow(item.id)} style={{ background: "transparent", border: "none", color: "#c0392b", fontSize: 16, padding: 4, cursor: "pointer" }}><i className="ti ti-trash" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={() => setContractorItems2([...contractorItems2, { id: genId(), desc: "", qty: 1, unit: "عدد", brand: "" }])} style={{ background: "var(--bg2)", border: "1.5px dashed var(--border)", color: "var(--primary)", borderRadius: "var(--radius-sm)", padding: 9, fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", width: "100%", marginTop: "1rem", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                <i className="ti ti-plus" /> افزودن ردیف دستی
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleSave} style={{ background: "#1a7a4a", color: "#fff", border: "none", padding: "11px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", flex: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <i className="ti ti-device-floppy" /> ذخیره
                </button>
                <button onClick={() => window.print()} style={{ background: "var(--primary)", color: "#fff", border: "none", padding: "11px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", flex: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <i className="ti ti-printer" /> چاپ / PDF
                </button>
              </div>
            </div>

            {/* Contractor preview */}
            <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem", position: "sticky", top: 140 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".75rem" }}>
                <strong style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)" }}>پیش‌نمایش</strong>
                <span style={{ fontSize: 11, color: "var(--text3)" }}>آپدیت خودکار</span>
              </div>
              <div style={{ background: "linear-gradient(135deg,#1a4a2e,#2d7a4a)", color: "#fff", padding: "1.25rem", borderRadius: "var(--radius-sm)", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div><h4 style={{ fontSize: 15, fontWeight: 900, marginBottom: 2 }}>لیست مواد تأسیساتی</h4><p style={{ fontSize: 12, color: "rgba(255,255,255,.65)" }}>شماره: {ctNum}</p></div>
                  <i className="ti ti-helmet" style={{ fontSize: 28, color: "rgba(255,255,255,.4)" }} />
                </div>
                <div style={{ marginTop: ".75rem", fontSize: 12, color: "rgba(255,255,255,.7)" }}>
                  <div>مجری: {ctName || "—"}</div>
                  <div>پروژه: {ctProject || "—"}</div>
                  <div>تاریخ: {ctDate}</div>
                </div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: ".75rem" }}>
                <thead>
                  <tr>{["قطعه", "تعداد", "واحد"].map((h) => <th key={h} style={{ background: "var(--bg)", padding: "7px 8px", fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "1px solid var(--border)" }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {contractorItems2.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{item.desc.substring(0, 22)}{item.desc.length > 22 ? "..." : ""}</td>
                      <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{item.qty}</td>
                      <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ background: "var(--bg)", borderRadius: "var(--radius-sm)", padding: "10px 12px", marginTop: ".75rem", display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 13, color: "var(--primary)" }}>
                <span>تعداد اقلام</span><span>{contractorItems2.length} قلم</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "5rem", color: "var(--text3)" }}>در حال بارگذاری...</div>}>
      <InvoiceContent />
    </Suspense>
  );
}
