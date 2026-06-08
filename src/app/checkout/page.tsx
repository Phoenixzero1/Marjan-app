"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/store/cart";
import Link from "next/link";

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  isDefault: boolean;
}

interface CouponResult {
  code: string;
  discountType: string;
  discountAmount: number;
  description: string | null;
}

const SHIPPING_OPTIONS = [
  { id: "express", label: "پیک فوری (۱-۲ روز کاری)", cost: 50000 },
  { id: "standard", label: "پست پیشتاز (۳-۵ روز کاری)", cost: 20000 },
  { id: "free", label: "ارسال رایگان (بالای ۵۰۰ هزار تومان)", cost: 0 },
];

function formatPrice(n: number) {
  return n.toLocaleString("fa-IR");
}

const TAX_RATE = 0.1;

function CheckoutContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, clearCart, totalPrice } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // New address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrError, setAddrError] = useState("");
  const [newAddr, setNewAddr] = useState({
    label: "خانه", fullName: "", phone: "", province: "", city: "", address: "", postalCode: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (session?.user?.id) {
      fetch("/api/addresses")
        .then((r) => r.json())
        .then((d) => {
          setAddresses(d.addresses ?? []);
          const def = d.addresses?.find((a: Address) => a.isDefault);
          if (def) setSelectedAddressId(def.id);
        });
    }
  }, [session, status, router]);

  const subtotal = totalPrice();
  const shippingOption = SHIPPING_OPTIONS.find((o) => o.id === shippingMethod)!;
  const effectiveShipping = subtotal >= 500000 ? 0 : shippingOption.cost;
  const discountAmount = coupon?.discountAmount ?? 0;
  const taxBase = subtotal - discountAmount + effectiveShipping;
  const tax = Math.round(taxBase * TAX_RATE);
  const total = taxBase + tax;

  async function applyCounton() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, orderAmount: subtotal }),
    });
    const data = await res.json();
    setCouponLoading(false);
    if (!res.ok) {
      setCouponError(data.error ?? "کد تخفیف نامعتبر");
      setCoupon(null);
    } else {
      setCoupon(data.coupon);
    }
  }

  async function saveAddress() {
    setAddrError("");
    if (!newAddr.fullName.trim()) { setAddrError("نام و نام خانوادگی الزامی است"); return; }
    if (!/^09\d{9}$/.test(newAddr.phone)) { setAddrError("شماره موبایل معتبر وارد کنید (مثال: 09121234567)"); return; }
    if (!newAddr.province) { setAddrError("استان را انتخاب کنید"); return; }
    if (!newAddr.city.trim()) { setAddrError("شهر الزامی است"); return; }
    if (newAddr.address.trim().length < 5) { setAddrError("آدرس کامل وارد کنید"); return; }
    if (!/^\d{10}$/.test(newAddr.postalCode)) { setAddrError("کد پستی باید ۱۰ رقم باشد"); return; }

    setAddrSaving(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddr),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddrError(data.error ?? "خطا در ذخیره آدرس");
        return;
      }
      setAddresses((prev) => [...prev, data.address]);
      setSelectedAddressId(data.address.id);
      setShowAddressForm(false);
      setAddrError("");
      setNewAddr({ label: "خانه", fullName: "", phone: "", province: "", city: "", address: "", postalCode: "" });
    } catch {
      setAddrError("خطا در اتصال به سرور");
    } finally {
      setAddrSaving(false);
    }
  }

  async function handlePlaceOrder() {
    if (!selectedAddressId) {
      setSubmitError("لطفاً یک آدرس تحویل انتخاب کنید");
      return;
    }
    if (items.length === 0) {
      setSubmitError("سبد خرید شما خالی است");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const orderItems = items.map((item: CartItem) => ({
      productId: item.id,
      quantity: item.quantity,
      sizeLabel: item.sizeLabel ?? null,
      unitPrice: item.price,
    }));

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addressId: selectedAddressId,
        items: orderItems,
        couponCode: coupon?.code ?? null,
        shippingMethod,
        notes,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setSubmitError(data.error ?? "خطا در ثبت سفارش");
      return;
    }

    // 100% discount — order is free, skip payment gateway
    if (data.isFree) {
      clearCart();
      router.replace(`/dashboard/orders?success=${data.order.orderNumber}`);
      return;
    }

    // Initiate payment
    const payRes = await fetch("/api/payment/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: data.order.id }),
    });
    const payData = await payRes.json();

    if (payData.paymentUrl) {
      clearCart();
      window.location.href = payData.paymentUrl;
    } else {
      setSubmitError(payData.error ?? "خطا در اتصال به درگاه پرداخت");
    }
  }

  if (status === "loading") {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "Vazirmatn" }}>
        <i className="ti ti-shopping-cart-off" style={{ fontSize: 56, color: "var(--text3)" }} />
        <h2 style={{ fontSize: 20, fontWeight: 900 }}>سبد خرید شما خالی است</h2>
        <Link href="/products" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
          ادامه خرید
        </Link>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px",
    fontFamily: "Vazirmatn", fontSize: 13, width: "100%", outline: "none", color: "var(--text)",
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem", fontFamily: "Vazirmatn" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 28, color: "var(--text)" }}>تکمیل خرید</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 28, alignItems: "start" }}>
        {/* ── Left column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Delivery address */}
          <section style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ background: "var(--bg)", padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 15, fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-map-pin" style={{ color: "var(--primary)" }} />
                آدرس تحویل
              </h2>
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, background: "transparent", border: "none", cursor: "pointer", fontFamily: "Vazirmatn" }}
              >
                <i className="ti ti-plus" /> افزودن آدرس
              </button>
            </div>

            <div style={{ padding: 18 }}>
              {addresses.length === 0 && !showAddressForm && (
                <p style={{ fontSize: 13, color: "var(--text2)" }}>هنوز آدرسی ثبت نکرده‌اید. یک آدرس جدید اضافه کنید.</p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: showAddressForm ? 20 : 0 }}>
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    style={{
                      display: "flex", gap: 12, alignItems: "flex-start", padding: 14,
                      border: `1.5px solid ${selectedAddressId === addr.id ? "var(--primary)" : "var(--border)"}`,
                      borderRadius: "var(--radius-sm)", cursor: "pointer", background: selectedAddressId === addr.id ? "#f0f5ff" : "#fff",
                    }}
                  >
                    <input
                      type="radio" name="address" value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      style={{ marginTop: 3 }}
                    />
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 900 }}>{addr.fullName}</span>
                        <span style={{ fontSize: 11, background: "var(--bg)", border: "1px solid var(--border)", padding: "1px 8px", borderRadius: 12 }}>{addr.label}</span>
                        {addr.isDefault && <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700 }}>پیش‌فرض</span>}
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7, margin: 0 }}>
                        {addr.province}، {addr.city}، {addr.address}
                        <br />کد پستی: <span dir="ltr">{addr.postalCode}</span> — تلفن: <span dir="ltr">{addr.phone}</span>
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {/* New address form */}
              {showAddressForm && (
                <div style={{ border: "1.5px solid var(--primary)", borderRadius: "var(--radius-sm)", padding: 16, background: "#f8faff" }}>
                  <h3 style={{ fontSize: 13, fontWeight: 900, marginBottom: 14 }}>آدرس جدید</h3>
                  {addrError && (
                    <div style={{ background: "#fdecea", border: "1px solid #f5c6c6", color: "#c0392b", padding: "9px 12px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                      {addrError}
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { key: "fullName", label: "نام و نام خانوادگی" },
                      { key: "phone", label: "تلفن", dir: "ltr" },
                      { key: "city", label: "شهر" },
                      { key: "postalCode", label: "کد پستی (۱۰ رقم)", dir: "ltr" },
                      { key: "label", label: "برچسب (خانه، محل کار...)" },
                    ].map(({ key, label, dir }) => (
                      <div key={key}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 4 }}>{label}</label>
                        <input
                          style={inputStyle}
                          dir={dir as "ltr" | undefined}
                          value={(newAddr as Record<string, string>)[key]}
                          onChange={(e) => setNewAddr((p) => ({ ...p, [key]: e.target.value }))}
                        />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 4 }}>استان</label>
                      <select value={newAddr.province} onChange={(e) => setNewAddr((p) => ({ ...p, province: e.target.value }))} style={inputStyle}>
                        <option value="">انتخاب استان...</option>
                        {["آذربایجان شرقی","آذربایجان غربی","اردبیل","اصفهان","البرز","ایلام","بوشهر","تهران","چهارمحال و بختیاری","خراسان جنوبی","خراسان رضوی","خراسان شمالی","خوزستان","زنجان","سمنان","سیستان و بلوچستان","فارس","قزوین","قم","کردستان","کرمان","کرمانشاه","کهگیلویه و بویراحمد","گلستان","گیلان","لرستان","مازندران","مرکزی","هرمزگان","همدان","یزد"].map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn: "1/-1" }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 4 }}>آدرس کامل</label>
                      <textarea
                        style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
                        placeholder="خیابان، کوچه، پلاک، واحد..."
                        value={newAddr.address}
                        onChange={(e) => setNewAddr((p) => ({ ...p, address: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                    <button
                      onClick={saveAddress}
                      disabled={addrSaving}
                      style={{ background: addrSaving ? "#aaa" : "var(--primary)", color: "#fff", border: "none", padding: "9px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 700, fontFamily: "Vazirmatn", cursor: addrSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}
                    >
                      {addrSaving ? <><i className="ti ti-loader-2" /> در حال ذخیره...</> : <><i className="ti ti-check" /> ذخیره آدرس</>}
                    </button>
                    <button onClick={() => { setShowAddressForm(false); setAddrError(""); }} style={{ background: "transparent", color: "var(--text3)", border: "1.5px solid var(--border)", padding: "9px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer" }}>
                      انصراف
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Shipping method */}
          <section style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ background: "var(--bg)", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: 15, fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-truck" style={{ color: "var(--primary)" }} />
                روش ارسال
              </h2>
            </div>
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {SHIPPING_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  style={{
                    display: "flex", gap: 12, alignItems: "center", padding: "12px 14px",
                    border: `1.5px solid ${shippingMethod === opt.id ? "var(--primary)" : "var(--border)"}`,
                    borderRadius: "var(--radius-sm)", cursor: "pointer",
                    background: shippingMethod === opt.id ? "#f0f5ff" : "#fff",
                    opacity: opt.id === "free" && subtotal < 500000 ? 0.4 : 1,
                  }}
                >
                  <input
                    type="radio" name="shipping" value={opt.id}
                    checked={shippingMethod === opt.id}
                    disabled={opt.id === "free" && subtotal < 500000}
                    onChange={() => setShippingMethod(opt.id)}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{opt.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 900, color: opt.cost === 0 ? "#1a7a4a" : "var(--text)" }}>
                    {opt.cost === 0 || (opt.id === shippingMethod && subtotal >= 500000) ? "رایگان" : `${formatPrice(opt.cost)} ت`}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Notes */}
          <section style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ background: "var(--bg)", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: 15, fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-notes" style={{ color: "var(--primary)" }} />
                توضیحات سفارش (اختیاری)
              </h2>
            </div>
            <div style={{ padding: 18 }}>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                placeholder="توضیحات یا درخواست خاصی برای سفارش دارید؟"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </section>
        </div>

        {/* ── Right column: Summary ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 90 }}>
          {/* Cart items */}
          <div style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ background: "var(--bg)", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: 15, fontWeight: 900 }}>سبد خرید ({items.length} کالا)</h2>
            </div>
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {items.map((item: CartItem) => (
                <div key={`${item.id}-${item.sizeLabel}`} style={{ display: "flex", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl || "/placeholder.png"} alt={item.name} style={{ width: 48, height: 48, objectFit: "contain", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", lineHeight: 1.4, marginBottom: 3 }}>{item.name}</p>
                    {item.sizeLabel && <p style={{ fontSize: 11, color: "var(--text3)" }}>سایز: {item.sizeLabel}</p>}
                    <p style={{ fontSize: 12, color: "var(--primary)", fontWeight: 900 }}>
                      {item.quantity} × {formatPrice(item.price)} ت
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coupon */}
          <div style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius)", padding: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 8 }}>کد تخفیف</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="SUMMER2025"
                dir="ltr"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              />
              <button
                onClick={applyCounton}
                disabled={couponLoading}
                style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "0 14px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                {couponLoading ? "..." : "اعمال"}
              </button>
            </div>
            {couponError && <p style={{ fontSize: 11, color: "#c0392b", marginTop: 6 }}>{couponError}</p>}
            {coupon && <p style={{ fontSize: 11, color: "#1a7a4a", marginTop: 6, fontWeight: 700 }}>✓ {coupon.description ?? "تخفیف اعمال شد"}</p>}
          </div>

          {/* Price breakdown */}
          <div style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius)", padding: 18 }}>
            {[
              { label: "جمع سبد خرید", value: subtotal },
              ...(discountAmount > 0 ? [{ label: "تخفیف کد", value: -discountAmount }] : []),
              { label: "هزینه ارسال", value: effectiveShipping },
              { label: "مالیات ارزش افزوده (۱۰٪)", value: tax },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 10 }}>
                <span style={{ color: "var(--text2)" }}>{label}</span>
                <span style={{ fontWeight: 700, color: value < 0 ? "#1a7a4a" : "var(--text)" }}>
                  {value < 0 ? "−" : ""}{formatPrice(Math.abs(value))} تومان
                </span>
              </div>
            ))}
            <div style={{ borderTop: "1.5px solid var(--border)", paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 900 }}>
              <span>قابل پرداخت</span>
              <span style={{ color: "var(--primary)" }}>{formatPrice(total)} تومان</span>
            </div>
          </div>

          {submitError && (
            <div style={{ background: "#fdecea", color: "#c0392b", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 700 }}>
              {submitError}
            </div>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={submitting}
            style={{
              background: "var(--primary)", color: "#fff", border: "none",
              padding: "14px", borderRadius: "var(--radius-sm)", fontSize: 15, fontWeight: 900,
              fontFamily: "Vazirmatn", cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <i className="ti ti-credit-card" />
            {submitting ? "در حال پردازش..." : "پرداخت و ثبت سفارش"}
          </button>

          <p style={{ fontSize: 11, color: "var(--text3)", textAlign: "center" }}>
            با ادامه، <Link href="/terms" style={{ color: "var(--primary)" }}>شرایط و قوانین</Link> فروشگاه را می‌پذیرید.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
