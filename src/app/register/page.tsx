"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const inputStyle: React.CSSProperties = {
  border: "1.5px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  padding: "10px 12px",
  fontFamily: "Vazirmatn",
  fontSize: 13,
  color: "var(--text)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("رمز عبور و تکرار آن یکسان نیستند");
      return;
    }
    if (!/^09\d{9}$/.test(form.phone)) {
      setError("شماره موبایل معتبر نیست (مثال: ۰۹۱۲XXXXXXX)");
      return;
    }
    if (form.password.length < 6) {
      setError("رمز عبور حداقل ۶ کاراکتر باشد");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          email: form.email || undefined,
          password: form.password,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "خطا در ثبت‌نام");
        return;
      }

      // Auto-login after successful register
      const result = await signIn("credentials", {
        phone: form.phone,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        router.replace("/auth/login");
      } else {
        router.replace("/dashboard");
      }
    } catch {
      setError("خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "2rem 1rem",
        direction: "rtl",
        fontFamily: "Vazirmatn, sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "var(--radius)",
          width: 440,
          maxWidth: "100%",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "var(--primary)",
            padding: "1.25rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>ثبت‌نام</span>
          <Link href="/" style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 700 }}>
            <i className="ti ti-home" /> بازگشت به سایت
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid var(--border)" }}>
          <Link
            href="/auth/login"
            style={{
              flex: 1, padding: "12px", display: "block", textAlign: "center",
              fontSize: 13, fontWeight: 900, color: "var(--text3)",
              textDecoration: "none", borderBottom: "2px solid transparent", marginBottom: -2,
            }}
          >
            ورود
          </Link>
          <button
            style={{
              flex: 1, padding: "12px", background: "transparent", border: "none",
              borderBottom: "2px solid var(--primary)", marginBottom: -2,
              fontSize: 13, fontWeight: 900, color: "var(--primary)",
              cursor: "pointer", fontFamily: "Vazirmatn",
            }}
          >
            ثبت‌نام
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div style={{ background: "#fdf0f0", border: "1px solid #f5c6c6", color: "#c0392b", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>نام</label>
              <input style={inputStyle} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="علی" required minLength={2} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>نام خانوادگی</label>
              <input style={inputStyle} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="احمدی" required minLength={2} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>شماره موبایل</label>
            <input style={inputStyle} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="09121234567" type="tel" dir="ltr" required />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>ایمیل <span style={{ color: "var(--text3)", fontWeight: 400 }}>(اختیاری)</span></label>
            <input style={inputStyle} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="example@email.com" type="email" dir="ltr" />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>رمز عبور</label>
            <input style={inputStyle} value={form.password} onChange={(e) => set("password", e.target.value)} type="password" placeholder="حداقل ۶ کاراکتر" required minLength={6} autoComplete="new-password" />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>تکرار رمز عبور</label>
            <input style={inputStyle} value={form.confirm} onChange={(e) => set("confirm", e.target.value)} type="password" placeholder="تکرار رمز عبور" required autoComplete="new-password" />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "var(--primary)", color: "#fff", border: "none",
              padding: "12px", borderRadius: "var(--radius-sm)", fontSize: 14,
              fontWeight: 900, fontFamily: "Vazirmatn",
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: "var(--text3)" }}>
            قبلاً حساب دارید؟{" "}
            <Link href="/auth/login" style={{ color: "var(--primary)", fontWeight: 700 }}>ورود</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
